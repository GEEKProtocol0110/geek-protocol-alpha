import { FastifyInstance } from "fastify";
import { z } from "zod";
import { makeAttemptToken, verifyAttemptToken } from "../lib/security";
import { logger } from "../lib/logger";
import { validateAttemptTiming } from "../lib/antiCheat";
import { BehaviorSignalsSchema, scoreBehavior } from "../lib/behaviorScore";
import {
  economyService,
  getEconomyConfig,
  isBreakerOpen,
  withEconomyTransaction,
  lockUser,
  applyMovement,
  InsufficientBalanceError,
  toAtomic,
  toBigInt,
  fromAtomic,
  minBig,
  clampPositive,
  treasuryBucket,
  utcDayKey,
} from "../services/economy";
import { creditRoyaltiesForServedQuestions } from "../services/cceRoyalties";

// Default topic pool when a run doesn't specify its own. These must match the
// active topic names in the database, otherwise every lookup falls through to
// the "any approved question" fallback below.
const TOPICS = [
  "Kaspa Origins",
  "GHOSTDAG & BlockDAG",
  "Mining & Consensus",
  "Tokenomics",
  "Wallets & Addresses",
  "KRC-20 & Smart Contracts",
  "Kaspa Ecosystem",
  "Crypto Fundamentals",
];

const GIGA_TIPS = [
  "Stay calm, trust your gut. My neural net says: instincts are usually right.",
  "Speed bonus activates under 5 seconds. Be fast, be accurate.",
  "Your combo multiplier is your best friend. Don't break the chain.",
  "The Omniscient Grid rewards knowledge. You got this, Seeker.",
  "Every correct answer is a step closer to Cognoscenti status.",
];
const ACE_TIPS = [
  "Statistically, your first instinct is correct 73% of the time.",
  "Eliminate the obvious wrong answers first. Logic prevails.",
  "Your historical accuracy in this topic suggests high confidence.",
  "The entry fee is an investment. ROI depends on your accuracy.",
  "Processing your performance profile... you're ready.",
];

function shuffleOptions(q: { option1: string; option2: string; option3: string; option4: string; correctOption: number }) {
  const options = [q.option1, q.option2, q.option3, q.option4];
  const correctText = options[q.correctOption - 1];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { options, correctIndex: options.indexOf(correctText) };
}

function pickTip(character: string): string {
  const arr = character === "ACE" ? ACE_TIPS : GIGA_TIPS;
  return arr[Math.floor(Math.random() * arr.length)];
}

function parseState(raw?: string | null) {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Entry fee for a round, including any modifier surcharge.
 * Multipliers are applied in basis points so the fee stays an exact integer.
 */
function entryFeeAtomic(baseFeeGeek: number, feeMultiplier: number): bigint {
  const base = toAtomic(baseFeeGeek);
  const bps = BigInt(Math.round(feeMultiplier * 10_000));
  return (base * bps) / 10_000n;
}

export async function gauntletRoutes(fastify: FastifyInstance) {
  const economy = economyService(fastify.prisma);

  /** Round table + modifiers, read live from the economy config. */
  async function roundConfig(round: number) {
    const config = await getEconomyConfig(fastify.prisma);
    const cfg = config.rules.gauntlet.rounds[round - 1];
    if (!cfg) throw new Error(`No configuration for Gauntlet round ${round}`);
    return { cfg, rules: config.rules };
  }

  // GET /api/gauntlet/config — round config + available topics.
  // The website reads this endpoint rather than hardcoding the table, so the
  // published numbers can never drift from the numbers the game charges.
  fastify.get("/config", async (_req, reply) => {
    const config = await getEconomyConfig(fastify.prisma);
    const g = config.rules.gauntlet;

    return reply.send({
      success: true,
      data: {
        rounds: g.rounds.map((r) => ({
          ...r,
          maxRoundReward: r.rewardPerCorrect * g.questionsPerRound,
          breakEvenCorrect: r.fee === 0 ? 0 : Math.ceil(r.fee / Math.max(r.rewardPerCorrect, 1)),
        })),
        topics: TOPICS,
        questionSeconds: g.questionSeconds,
        questionsPerRound: g.questionsPerRound,
        maxRewardPerRunGeek: g.maxRewardPerRunGeek,
        modifiers: g.modifiers,
        rewardsEnabled: config.rewardsEnabled,
        gauntletOpen: await isBreakerOpen(fastify.prisma, "GAUNTLET"),
      },
    });
  });

  // GET /api/gauntlet/run/active — check for an unfinished run
  fastify.get("/run/active", { preHandler: fastify.authenticate }, async (request, reply) => {
    const userId = request.jwtUser!.userId;
    const run = await fastify.prisma.gauntletRun.findFirst({
      where: { userId, completed: false },
      orderBy: { dateStarted: "desc" },
    });
    if (!run) return reply.send({ success: true, data: null });
    return reply.send({ success: true, data: run });
  });

  // POST /api/gauntlet/run/start — create a new run
  fastify.post("/run/start", { preHandler: fastify.authenticate }, async (request, reply) => {
    const Schema = z.object({ selectedTopics: z.array(z.string()).min(2) });
    const { selectedTopics } = Schema.parse(request.body);
    const userId = request.jwtUser!.userId;

    if (!(await isBreakerOpen(fastify.prisma, "GAUNTLET"))) {
      return reply.code(503).send({
        success: false,
        error:
          "The Gauntlet is paused while we verify treasury health. The Daily Quiz is still available for XP.",
        code: "GAUNTLET_PAUSED",
      });
    }

    // One active run per user. Any earlier unfinished run is closed here —
    // its per-round rewards were already credited at submit time, so nothing
    // is lost by closing it.
    const run = await withEconomyTransaction(fastify.prisma, async (tx) => {
      await lockUser(tx, userId);
      await tx.gauntletRun.updateMany({
        where: { userId, completed: false },
        data: { completed: true, dateCompleted: new Date() },
      });
      return tx.gauntletRun.create({
        data: {
          userId,
          selectedTopics: JSON.stringify(selectedTopics),
          activeRound: 1,
          activeState: JSON.stringify({ geekEarned: 0, xpEarned: 0, roundResults: [] }),
        },
      });
    });

    return reply.send({ success: true, data: run });
  });

  // POST /api/gauntlet/run/:runId/round/:round/questions — charge the entry fee,
  // then serve the questions.
  //
  // The fee moves available → locked ATOMICALLY before a single question is
  // sent. It is settled (70/30) when the round is submitted. A crash between
  // the two leaves the fee locked and recoverable, never half-spent.
  fastify.post(
    "/run/:runId/round/:round/questions",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const { runId, round } = z
        .object({ runId: z.coerce.number(), round: z.coerce.number().min(1).max(10) })
        .parse(request.params);

      const { modifier } = z.object({ modifier: z.string().optional() }).parse(request.body ?? {});
      const userId = request.jwtUser!.userId;

      const run = await fastify.prisma.gauntletRun.findFirst({
        where: { id: runId, userId, completed: false },
      });
      if (!run) return reply.code(404).send({ success: false, error: "Run not found" });

      if (!(await isBreakerOpen(fastify.prisma, "GAUNTLET"))) {
        return reply.code(503).send({
          success: false,
          error: "The Gauntlet is paused. You can cash out your run; new rounds are unavailable.",
          code: "GAUNTLET_PAUSED",
        });
      }

      const { cfg, rules } = await roundConfig(round);
      const mods = rules.gauntlet.modifiers as Record<string, { feeMultiplier: number }>;
      const feeMultiplier = modifier && mods[modifier] ? mods[modifier].feeMultiplier : 1;

      if (modifier === "hot_streak" && round < rules.gauntlet.modifiers.hot_streak.minRound) {
        return reply.code(400).send({
          success: false,
          error: `Hot Streak unlocks from round ${rules.gauntlet.modifiers.hot_streak.minRound}.`,
        });
      }

      const fee = entryFeeAtomic(cfg.fee, feeMultiplier);

      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: {
          favoriteCharacter: true,
          currentStreak: true,
          streakBonusMultiplier: true,
          categoryAccuracies: true,
        },
      });
      if (!user) return reply.code(404).send({ success: false, error: "User not found" });

      // Charge the entry fee. The idempotency key is (run, round), so a
      // refreshed browser or a retried request charges exactly once.
      if (fee > 0n) {
        try {
          await economy.lockFunds({
            userId,
            type: "GAUNTLET_ENTRY",
            amount: fee,
            idempotencyKey: `gauntlet:entry:${runId}:${round}`,
            referenceType: "GAUNTLET_ROUND",
            referenceId: `${runId}:${round}`,
            metadata: { round, modifier: modifier ?? null, baseFee: cfg.fee },
          });
        } catch (err) {
          if (err instanceof InsufficientBalanceError) {
            // Out of funds ends the run — the player cannot continue, and the
            // run should not sit open forever.
            await fastify.prisma.gauntletRun.update({
              where: { id: runId },
              data: { completed: true, dateCompleted: new Date() },
            });
            return reply.code(402).send({
              success: false,
              error: `Not enough GEEK for Round ${round}. Entry costs ${fromAtomic(fee)} GEEK; you have ${fromAtomic(err.available)} GEEK available.`,
              code: "INSUFFICIENT_BALANCE",
              data: { required: fromAtomic(fee), available: fromAtomic(err.available) },
            });
          }
          throw err;
        }

        await fastify.prisma.gauntletRun.update({
          where: { id: runId },
          data: { entryFeesPaidAtomic: { increment: fee.toString() } },
        });
      }

      const topics: string[] = JSON.parse(run.selectedTopics ?? JSON.stringify(TOPICS));
      const perRound = rules.gauntlet.questionsPerRound;

      let questions = await fastify.prisma.question.findMany({
        where: { status: "approved", fraudFlagged: false, topic: { name: { in: topics } } },
        include: { topic: true },
        take: 100,
      });

      if (questions.length < perRound) {
        questions = await fastify.prisma.question.findMany({
          where: { status: "approved", fraudFlagged: false },
          include: { topic: true },
          take: 100,
        });
      }

      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }
      const selected = questions.slice(0, perRound);

      const publicQuestions = await Promise.all(
        selected.map(async (q) => {
          const { options, correctIndex } = shuffleOptions(q);
          const attempts = await fastify.prisma.attempt.findMany({
            where: { userId, questionId: q.id },
            select: { isCorrect: true },
          });
          const topicAttempts = await fastify.prisma.attempt.findMany({
            where: { userId, question: { topicId: q.topicId } },
            select: { isCorrect: true },
            take: 100,
          });
          const pastAccuracy = attempts.length
            ? Math.round((attempts.filter((a) => a.isCorrect).length / attempts.length) * 100)
            : null;
          const topicAccuracy = topicAttempts.length
            ? Math.round((topicAttempts.filter((a) => a.isCorrect).length / topicAttempts.length) * 100)
            : null;
          return {
            id: q.id,
            question: q.question,
            options,
            correctIndex,
            difficulty: q.difficulty,
            topic: q.topic.name,
            funFact: q.funFact ?? null,
            seenCount: attempts.length,
            pastAccuracy,
            topicAccuracy,
          };
        })
      );

      const attemptId = `gauntlet_${runId}_r${round}_${Date.now()}`;
      const token = makeAttemptToken(
        {
          attemptId,
          runId: String(runId),
          round: String(round),
          questionIds: JSON.stringify(publicQuestions.map((q) => q.id)),
          correctAnswers: JSON.stringify(publicQuestions.map((q) => q.correctIndex)),
        },
        30 * 60
      );

      // Strip the answer key and the funFact before sending. Gauntlet pays the
      // largest rewards on the platform, so `correctIndex` never leaves the
      // server: it stays inside the signed token, and is revealed one question
      // at a time by POST /run/:runId/round/:round/answer once a choice is
      // committed.
      const clientQuestions = publicQuestions.map(({ correctIndex: _hidden, funFact: _fact, ...rest }) => {
        void _hidden;
        void _fact;
        return rest;
      });

      const activeState = parseState(run.activeState);
      await fastify.prisma.gauntletRun.update({
        where: { id: runId },
        data: {
          activeRound: round,
          activeState: JSON.stringify({ ...activeState, activeModifier: modifier ?? null }),
          activeStateUpdatedAt: new Date(),
        },
      });

      const character = user.favoriteCharacter ?? "GIGA";
      const balances = await economy.getBalanceView(userId);

      return reply.send({
        success: true,
        data: {
          roundConfig: {
            ...cfg,
            modifier: modifier ?? null,
            chargedEntryFee: Number(fromAtomic(fee)),
            questionSeconds: rules.gauntlet.questionSeconds,
          },
          token,
          questions: clientQuestions,
          tip: pickTip(character),
          character,
          player: {
            balances,
            geekBalance: Number(balances.available),
            currentStreak: user.currentStreak,
            streakBonusMultiplier: user.streakBonusMultiplier,
            categoryAccuracies: parseState(user.categoryAccuracies),
          },
        },
      });
    }
  );

  // POST /api/gauntlet/run/:runId/round/:round/answer — commit one answer, get
  // feedback. Same commit-then-reveal contract as the daily quiz: the correct
  // index is only returned once a choice has been recorded, and the recording
  // is write-once, so revealing an answer costs the player their guess.
  fastify.post(
    "/run/:runId/round/:round/answer",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const { runId, round } = z
        .object({ runId: z.coerce.number(), round: z.coerce.number().min(1).max(10) })
        .parse(request.params);

      const Schema = z.object({
        token: z.string(),
        questionIndex: z.number().int().min(0).max(99),
        answer: z.number().int().min(-1).max(3),
        timeTaken: z.number().min(0).max(600).optional(),
      });
      const parsed = Schema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ success: false, error: parsed.error.flatten() });
      }
      const { token, questionIndex, answer, timeTaken } = parsed.data;

      const verified = verifyAttemptToken(token);
      if (!verified.ok) return reply.code(401).send({ success: false, error: "Invalid token" });

      if (String(verified.data.runId) !== String(runId) || String(verified.data.round) !== String(round)) {
        return reply.code(403).send({ success: false, error: "Token does not match this round" });
      }

      const attemptId = String(verified.data.attemptId);
      const correctAnswers: number[] = JSON.parse(verified.data.correctAnswers as string);
      const questionIds: number[] = JSON.parse(verified.data.questionIds as string);
      if (questionIndex >= correctAnswers.length) {
        return reply.code(400).send({ success: false, error: "Question index out of range" });
      }

      const key = `gauntletans:${attemptId}`;
      const stored = await fastify.redis.hsetnx(
        key,
        String(questionIndex),
        JSON.stringify({ answer, timeTaken: timeTaken ?? null, at: Date.now() })
      );
      await fastify.redis.expire(key, 30 * 60);

      if (stored === 0) {
        return reply.code(409).send({ success: false, error: "This question has already been answered" });
      }

      const question = await fastify.prisma.question.findUnique({
        where: { id: questionIds[questionIndex] },
        select: { funFact: true },
      });

      return reply.send({
        success: true,
        data: {
          isCorrect: answer === correctAnswers[questionIndex],
          correctIndex: correctAnswers[questionIndex],
          funFact: question?.funFact ?? null,
        },
      });
    }
  );

  // POST /api/gauntlet/run/:runId/round/:round/submit — settle the round.
  //
  // This is where the entry fee is consumed (70% recycled, 30% burn-pending)
  // and the reward is credited, all through EconomyService. Rewards go straight
  // to available balance because the round is fully validated right here.
  fastify.post(
    "/run/:runId/round/:round/submit",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const { runId, round } = z
        .object({ runId: z.coerce.number(), round: z.coerce.number().min(1).max(10) })
        .parse(request.params);

      const Schema = z.object({
        token: z.string(),
        answers: z.array(z.number()),
        timings: z.array(z.number()).optional(),
        modifier: z.string().optional(),
        behavior: BehaviorSignalsSchema.optional(),
      });
      const { token, answers, timings, modifier, behavior } = Schema.parse(request.body);
      const userId = request.jwtUser!.userId;

      const verified = verifyAttemptToken(token);
      if (!verified.ok) return reply.code(401).send({ success: false, error: "Invalid token" });

      const run = await fastify.prisma.gauntletRun.findFirst({
        where: { id: runId, userId, completed: false },
      });
      if (!run) return reply.code(404).send({ success: false, error: "Run not found" });

      const { cfg, rules } = await roundConfig(round);
      const correctAnswers: number[] = JSON.parse(verified.data.correctAnswers as string);
      const questionIds: number[] = JSON.parse(verified.data.questionIds as string);

      // Score from the answers committed via /answer, which are write-once and
      // server-held. The client's array is only a fallback for a round that
      // never used the commit endpoint.
      const committedRaw = await fastify.redis.hgetall(`gauntletans:${String(verified.data.attemptId)}`);
      const effectiveAnswers = [...answers];
      const effectiveTimings = [...(timings ?? [])];
      for (const [idxStr, blob] of Object.entries(committedRaw || {})) {
        const idx = Number(idxStr);
        if (!Number.isInteger(idx) || idx < 0 || idx >= correctAnswers.length) continue;
        try {
          const rec = JSON.parse(blob) as { answer: number; timeTaken: number | null };
          effectiveAnswers[idx] = rec.answer;
          if (typeof rec.timeTaken === "number") effectiveTimings[idx] = rec.timeTaken * 1000;
        } catch {
          // Unparseable record — keep the client value for this index.
        }
      }

      // One submission per round attempt.
      const roundLock = await fastify.redis.set(
        `gauntletsubmitted:${String(verified.data.attemptId)}`,
        "1",
        "EX",
        60 * 60,
        "NX"
      );
      if (!roundLock) {
        return reply.code(409).send({ success: false, error: "This round has already been submitted" });
      }

      // Speed bonuses come from validated timings, never from what the client
      // claims. Gauntlet pays the largest per-question rewards on the platform.
      const timing = validateAttemptTiming({
        issuedAtMs: typeof verified.data.iat === "number" ? (verified.data.iat as number) : Date.now(),
        submittedAtMs: Date.now(),
        questionCount: correctAnswers.length,
        clientTimings: effectiveTimings.map((t) => (t ?? 20000) / 1000),
        maxSecondsPerQuestion: rules.gauntlet.questionSeconds,
      });

      if (!timing.ok) {
        fastify.log.warn(
          { userId, runId, round, reason: timing.reason, flags: timing.flags },
          "Gauntlet submission rejected by timing validation"
        );
        return reply.code(400).send({ success: false, error: timing.reason });
      }

      const behaviorVerdict = behavior ? scoreBehavior(behavior) : null;
      const suspicious = timing.flags.length > 0 || Boolean(behaviorVerdict?.suspicious);
      if (suspicious) {
        logger.warn(
          {
            userId,
            runId,
            round,
            timingFlags: timing.flags,
            behaviorScore: behaviorVerdict?.score,
            behaviorFlags: behaviorVerdict?.flags,
          },
          "Gauntlet attempt flagged for review"
        );
        await fastify.prisma.abuseSignal.create({
          data: {
            userId,
            signalType: "GAUNTLET_SUSPICIOUS",
            severity: 2,
            detail: JSON.stringify({ timingFlags: timing.flags, behaviorFlags: behaviorVerdict?.flags }),
          },
        });
      }

      // ---- Scoring (server-side only; the client never supplies a score) ----
      const mods = rules.gauntlet.modifiers;
      const rewardMultiplierBps =
        modifier === "double_down"
          ? BigInt(Math.round(mods.double_down.rewardMultiplier * 10_000))
          : 10_000n;

      const perCorrect = toAtomic(cfg.rewardPerCorrect);
      const results = effectiveAnswers.map((ans, i) => {
        const isCorrect = ans === correctAnswers[i];
        const timeTaken = timing.effectiveTimings[i] ?? 15;
        const fullCredit = timing.speedCreditFactor >= 1;
        const speedBonusPct =
          isCorrect && fullCredit && timeTaken < 5 ? 20 : isCorrect && fullCredit && timeTaken < 9 ? 10 : 0;

        let reward = isCorrect ? perCorrect : 0n;
        reward = (reward * rewardMultiplierBps) / 10_000n;

        // Hot streak: extra multiplier while the opening chain is unbroken.
        if (
          modifier === "hot_streak" &&
          i < mods.hot_streak.appliesToFirst &&
          effectiveAnswers.slice(0, i + 1).every((a, idx) => a === correctAnswers[idx])
        ) {
          reward = (reward * BigInt(Math.round(mods.hot_streak.rewardMultiplier * 10_000))) / 10_000n;
        }

        reward = (reward * BigInt(10_000 + speedBonusPct * 100)) / 10_000n;
        return { isCorrect, timeTaken, speedBonusPct, reward, questionId: questionIds[i] };
      });

      const correctCount = results.filter((r) => r.isCorrect).length;
      let grossReward = results.reduce((s, r) => s + r.reward, 0n);
      const xpEarned = correctCount * 15;

      // Per-run reward ceiling.
      const runCap = toAtomic(rules.gauntlet.maxRewardPerRunGeek);
      const alreadyPaid = toBigInt(run.rewardsPaidAtomic);
      const runRemaining = clampPositive(runCap - alreadyPaid);
      const cappedByRun = grossReward > runRemaining;
      grossReward = minBig(grossReward, runRemaining);

      // Safety-net refund, drawn from the reward pool like any other payout.
      let refund = 0n;
      if (modifier === "safety_net" && correctCount < mods.safety_net.refundBelowCorrect) {
        refund = (toAtomic(cfg.fee) * BigInt(Math.round(mods.safety_net.refundPct * 100))) / 10_000n;
      }

      // ---- Settlement: consume the locked entry fee, 70/30 ----
      const feeMultiplier =
        modifier && (mods as Record<string, { feeMultiplier: number }>)[modifier]
          ? (mods as Record<string, { feeMultiplier: number }>)[modifier].feeMultiplier
          : 1;
      const fee = entryFeeAtomic(cfg.fee, feeMultiplier);

      if (fee > 0n) {
        try {
          await economy.consumeLocked({
            userId,
            type: "GAUNTLET_FEE_CONSUMED",
            amount: fee,
            idempotencyKey: `gauntlet:consume:${runId}:${round}`,
            referenceType: "GAUNTLET_ROUND",
            referenceId: `${runId}:${round}`,
            metadata: { round, modifier: modifier ?? null },
          });
        } catch (err) {
          // The fee was locked when the questions were served; if it is not
          // there now something is badly wrong. Log and continue to reward —
          // refusing to pay a player for a completed round is the worse failure.
          logger.error({ err, runId, round, userId }, "gauntlet.fee_settlement_failed");
        }
      }

      // ---- Reward ----
      const grant = await economy.grantReward({
        userId,
        type: "GAUNTLET_REWARD",
        amount: grossReward,
        budget: "GAUNTLET",
        breaker: "GAUNTLET",
        // Validated at submit time, so there is nothing left to clear.
        pending: false,
        idempotencyKey: `gauntlet:reward:${runId}:${round}`,
        referenceType: "GAUNTLET_ROUND",
        referenceId: `${runId}:${round}`,
        flagged: suspicious,
        flagReason: suspicious ? "Timing or behaviour anomaly during the round" : undefined,
        metadata: { round, correctCount, modifier: modifier ?? null },
      });

      let refundGranted = 0n;
      if (refund > 0n) {
        const refundResult = await economy.grantReward({
          userId,
          type: "GAUNTLET_REFUND",
          amount: refund,
          budget: "GAUNTLET",
          breaker: "GAUNTLET",
          pending: false,
          idempotencyKey: `gauntlet:refund:${runId}:${round}`,
          referenceType: "GAUNTLET_ROUND",
          referenceId: `${runId}:${round}`,
          metadata: { round, reason: "safety_net" },
        });
        refundGranted = refundResult.granted;
      }

      // ---- Persist attempts, run state, XP, creator royalties ----
      try {
        const sessionId = `gauntlet_${runId}_r${round}`;
        for (let i = 0; i < results.length; i++) {
          await fastify.prisma.attempt.create({
            data: {
              userId,
              questionId: results[i].questionId,
              selectedOption: effectiveAnswers[i] + 1,
              isCorrect: results[i].isCorrect,
              timeTaken: results[i].timeTaken,
              sessionId,
              streakBonusApplied: 1,
            },
          });
        }

        const prevState = parseState(run.activeState);
        const roundResults = [
          ...(prevState.roundResults ?? []),
          {
            round,
            correctCount,
            geekEarned: Number(fromAtomic(grant.granted)),
            xpEarned,
          },
        ];

        await fastify.prisma.gauntletRun.update({
          where: { id: runId },
          data: {
            highestRound: Math.max(run.highestRound, round),
            totalCorrect: { increment: correctCount },
            totalQuestions: { increment: results.length },
            totalGeekEarned: { increment: Number(fromAtomic(grant.granted + refundGranted)) },
            totalXpEarned: { increment: xpEarned },
            rewardsPaidAtomic: { increment: (grant.granted + refundGranted).toString() },
            activeRound: round < 10 ? round + 1 : round,
            activeState: JSON.stringify({
              ...prevState,
              geekEarned: (prevState.geekEarned ?? 0) + Number(fromAtomic(grant.granted + refundGranted)),
              xpEarned: (prevState.xpEarned ?? 0) + xpEarned,
              roundResults,
              activeModifier: null,
            }),
            activeStateUpdatedAt: new Date(),
          },
        });

        // XP is reputation and is always awarded, even when GEEK is not.
        await fastify.prisma.user.update({
          where: { id: userId },
          data: { xp: { increment: xpEarned } },
        });

        // Creator royalties for the questions this round served.
        await creditRoyaltiesForServedQuestions(fastify.prisma, {
          questionIds: results.map((r) => r.questionId),
          playerId: userId,
          sessionId,
        });
      } catch (err) {
        logger.error({ err }, "gauntlet.submit_persist_failed");
      }

      const balances = await economy.getBalanceView(userId);
      const nextRound = round < 10 ? round + 1 : null;
      const nextFee = nextRound ? toAtomic(rules.gauntlet.rounds[nextRound - 1].fee) : 0n;

      return reply.send({
        success: true,
        data: {
          correctCount,
          totalQuestions: results.length,
          geekEarned: Number(fromAtomic(grant.granted)),
          xpEarned,
          refund: Number(fromAtomic(refundGranted)),
          // Be explicit when the player earned less than the raw score implies.
          rewardNotice:
            grant.granted < grant.requested || cappedByRun
              ? cappedByRun
                ? `Per-run reward cap of ${rules.gauntlet.maxRewardPerRunGeek} GEEK reached.`
                : grant.message
              : null,
          rewardReason: grant.reason,
          balances,
          nextRound,
          nextRoundFee: nextRound ? Number(fromAtomic(nextFee)) : null,
          canAffordNextRound: nextRound ? toBigInt(balances.atomic.available) >= nextFee : false,
          results: results.map((r, i) => ({
            questionId: r.questionId,
            isCorrect: r.isCorrect,
            reward: Number(fromAtomic(r.reward)),
            correctAnswer: correctAnswers[i],
          })),
        },
      });
    }
  );

  // POST /api/gauntlet/run/:runId/cashout — end the run.
  //
  // Rewards are credited per round, so cashing out moves no money. It closes
  // the run and writes an audit row summarising it. That is deliberate: paying
  // only at cash-out would mean a player who closed the tab lost everything.
  fastify.post("/run/:runId/cashout", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { runId } = z.object({ runId: z.coerce.number() }).parse(request.params);
    const userId = request.jwtUser!.userId;

    const run = await fastify.prisma.gauntletRun.findFirst({
      where: { id: runId, userId, completed: false },
    });
    if (!run) return reply.code(404).send({ success: false, error: "Run not found" });

    const state = parseState(run.activeState);
    const totalPaid = toBigInt(run.rewardsPaidAtomic);

    await withEconomyTransaction(fastify.prisma, async (tx) => {
      await lockUser(tx, userId);

      // Any entry fee still locked (round paid for but never submitted) goes
      // back to the player rather than being silently kept.
      const stillLocked = await tx.economyTransaction.findMany({
        where: {
          userId,
          referenceType: "GAUNTLET_ROUND",
          transactionType: "GAUNTLET_ENTRY",
          referenceId: { startsWith: `${runId}:` },
        },
      });
      for (const entry of stillLocked) {
        const consumed = await tx.economyTransaction.findFirst({
          where: { idempotencyKey: `gauntlet:consume:${entry.referenceId}:recycle` },
        });
        if (consumed) continue;
        await applyMovement(tx, {
          userId,
          type: "GAUNTLET_REFUND",
          amount: toBigInt(entry.amountAtomic),
          from: "LOCKED",
          to: "AVAILABLE",
          referenceType: "GAUNTLET_ROUND",
          referenceId: entry.referenceId ?? undefined,
          idempotencyKey: `gauntlet:unlock:${entry.referenceId}`,
          metadata: { reason: "run cashed out before the round was submitted" },
        });
      }

      await tx.gauntletRun.update({
        where: { id: runId },
        data: { completed: true, dateCompleted: new Date() },
      });

      // Zero-amount audit rows are not permitted in the ledger, so the cash-out
      // summary is recorded only when the run actually paid something.
      if (totalPaid > 0n) {
        await tx.gauntletClaim.create({
          data: { userId, runId, amount: Number(fromAtomic(totalPaid)), status: "claimed" },
        });
      }
    });

    const balances = await economy.getBalanceView(userId);

    return reply.send({
      success: true,
      data: {
        totalGeekEarned: Number(fromAtomic(totalPaid)),
        totalXpEarned: run.totalXpEarned,
        highestRound: run.highestRound,
        totalCorrect: run.totalCorrect,
        totalQuestions: run.totalQuestions,
        assisted: run.assisted,
        roundResults: state.roundResults ?? [],
        balances,
        note: "GEEK earned in the Gauntlet is credited to your Alpha balance as each round is settled.",
      },
    });
  });

  // POST /api/gauntlet/run/:runId/powerup — buy a power-up mid-run
  fastify.post("/run/:runId/powerup", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { runId } = z.object({ runId: z.coerce.number() }).parse(request.params);
    const { powerUp, round } = z
      .object({ powerUp: z.string(), round: z.coerce.number().min(1).max(10) })
      .parse(request.body);
    const userId = request.jwtUser!.userId;

    const run = await fastify.prisma.gauntletRun.findFirst({
      where: { id: runId, userId, completed: false },
    });
    if (!run) return reply.code(404).send({ success: false, error: "Run not found" });

    const { cfg } = await roundConfig(round);

    const result = await economy.purchasePowerUp({
      userId,
      powerUp,
      mode: "gauntlet",
      contextType: "GAUNTLET_RUN",
      contextId: String(runId),
      roundFeeAtomic: toAtomic(cfg.fee),
      // One purchase of a given power-up per run+round.
      idempotencyKey: `powerup:${userId}:${powerUp}:${runId}:${round}:${utcDayKey()}`,
    });

    if (!result.ok) return reply.code(400).send({ success: false, error: result.error });

    return reply.send({
      success: true,
      data: {
        powerUp,
        price: Number(fromAtomic(result.price)),
        remainingToday: result.remaining,
        assisted: result.marksAssisted,
        note: result.marksAssisted
          ? "This run is now marked assisted and will be ranked on the assisted leaderboard."
          : null,
        balances: await economy.getBalanceView(userId),
      },
    });
  });

  // GET /api/gauntlet/run/:runId/summary
  fastify.get("/run/:runId/summary", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { runId } = z.object({ runId: z.coerce.number() }).parse(request.params);
    const run = await fastify.prisma.gauntletRun.findFirst({
      where: { id: runId, userId: request.jwtUser!.userId },
    });
    if (!run) return reply.code(404).send({ success: false, error: "Not found" });

    const state = parseState(run.activeState);
    return reply.send({
      success: true,
      data: {
        ...run,
        totalGeekEarned: Number(fromAtomic(toBigInt(run.rewardsPaidAtomic))),
        roundResults: state.roundResults ?? [],
      },
    });
  });
}
