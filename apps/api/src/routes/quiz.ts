import { FastifyInstance } from "fastify";
import { z } from "zod";
import { makeAttemptToken, verifyAttemptToken } from "../lib/security";
import { logger } from "../lib/logger";
import { validateAttemptTiming, timeBonusFor } from "../lib/antiCheat";
import { BehaviorSignalsSchema, scoreBehavior } from "../lib/behaviorScore";
import {
  economyService,
  getEconomyConfig,
  isBreakerOpen,
  fromAtomic,
  toAtomic,
  utcDayKey,
} from "../services/economy";
import {
  calculateDailyReward,
  capToDaily,
  meetsAccountAge,
  rewardedPlayKeys,
  riskScoreFrom,
} from "../services/dailyQuizRewards";
import { creditRoyaltiesForServedQuestions } from "../services/cceRoyalties";

const QUESTION_TTL = 15 * 60; // 15 minutes

// Zod schemas
const StartQuizSchema = z.object({
  round: z.number().int().min(1).max(10),
});

const SubmitQuizSchema = z.object({
  attemptToken: z.string(),
  answers: z.array(z.number()),
  timeTakenPerQuestion: z.array(z.number()),
  behavior: BehaviorSignalsSchema.optional(),
});

const DailySubmitSchema = z.object({
  token: z.string(),
  answers: z.array(z.number()),
  timings: z.array(z.number()),
  behavior: BehaviorSignalsSchema.optional(),
});

function getComboMultiplier(combo: number) {
  if (combo >= 10) return 3.0;
  if (combo >= 7) return 2.5;
  if (combo >= 5) return 2.0;
  if (combo >= 3) return 1.5;
  return 1.0;
}

// Helpers
function getDailyTheme(): string {
  // Kaspa-native rotation. Was pop-culture categories, which had nothing to do
  // with the chain players are being paid on.
  const themes = [
    "Kaspa Origins", "GHOSTDAG & BlockDAG", "Mining & Consensus",
    "Tokenomics", "Wallets & Addresses", "KRC-20 & Smart Contracts",
    "Kaspa Ecosystem", "Crypto Fundamentals",
  ];
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  return themes[dayOfYear % themes.length];
}

function shuffleOptions(q: any) {
  const options = [q.option1, q.option2, q.option3, q.option4];
  const correctText = options[q.correctOption - 1];

  // Fisher-Yates shuffle
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  const newCorrectIndex = options.indexOf(correctText); // 0-based after shuffle
  return { options, correctIndex: newCorrectIndex };
}

// Routes
export async function quizRoutes(fastify: FastifyInstance) {
  const economy = economyService(fastify.prisma);

  // GET /api/quiz/config — the live daily-quiz rules, for the client and the site
  fastify.get("/config", async (_req, reply) => {
    const config = await getEconomyConfig(fastify.prisma);
    reply.header("Cache-Control", "public, max-age=30");
    return reply.send({
      success: true,
      data: {
        ...config.rules.dailyQuiz,
        rewardsEnabled: config.rewardsEnabled,
        dailyQuizOpen: await isBreakerOpen(fastify.prisma, "DAILY_QUIZ"),
      },
    });
  });

  // POST /api/quiz/start - Start a new quiz round
  fastify.post("/start",
    { preHandler: fastify.authenticate },
    async (req, reply) => {
      const parse = StartQuizSchema.safeParse(req.body);
      if (!parse.success) {
        return reply.code(400).send({ success: false, error: parse.error.flatten() });
      }

      const { round } = parse.data;
      const userId = req.jwtUser!.userId;

      const theme = getDailyTheme();
      const questions = await fastify.prisma.question.findMany({
        where: { status: "approved", topic: { name: theme } },
        include: { topic: true },
        orderBy: { dateCreated: "desc" },
        take: 50,
      });

      // Fallback to any approved questions
      const pool = questions.length >= 10 ? questions : await fastify.prisma.question.findMany({
        where: { status: "approved" },
        include: { topic: true },
        take: 50,
      });

      if (!pool.length) {
        return reply.code(404).send({ success: false, error: "No questions available" });
      }

      // Shuffle and pick 10 questions
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      const selected = pool.slice(0, 10);

      // Prepare question data and correct answers
      const questionData = selected.map(q => {
        const { options, correctIndex } = shuffleOptions(q);
        return {
          id: q.id,
          question: q.question,
          options,
          difficulty: q.difficulty,
          topic: q.topic.name,
          funFact: q.funFact ?? null,
        };
      });
      const correctAnswers = selected.map(q => q.correctOption - 1); // 0-based
      const questionIds = selected.map(q => q.id);
      const attemptId = `quiz_${userId}_${Date.now()}`;

      // Generate signed attempt token
      const attemptToken = makeAttemptToken(
        {
          attemptId,
          userId,
          round,
          questionIds: JSON.stringify(questionIds),
          correctAnswers: JSON.stringify(correctAnswers),
        },
        QUESTION_TTL
      );

      return reply.send({
        success: true,
        data: {
          attemptToken,
          round,
          questions: questionData,
          expiresAt: Math.floor(Date.now() / 1000) + QUESTION_TTL,
        },
      });
    });

  // POST /api/quiz/submit - Submit quiz answers
  fastify.post("/submit",
    { preHandler: fastify.authenticate },
    async (req, reply) => {
      const parse = SubmitQuizSchema.safeParse(req.body);
      if (!parse.success) {
        return reply.code(400).send({ success: false, error: parse.error.flatten() });
      }

      const { attemptToken, answers, timeTakenPerQuestion, behavior } = parse.data;
      const userId = req.jwtUser!.userId;

      // Verify attempt token
      const verified = verifyAttemptToken(attemptToken);
      if (!verified.ok) {
        return reply.code(401).send({ success: false, error: verified.error });
      }

      const { attemptId, round, questionIds: questionIdsJson, correctAnswers: correctAnswersJson, iat } = verified.data as any;
      const questionIds: number[] = JSON.parse(questionIdsJson);
      const correctAnswers: number[] = JSON.parse(correctAnswersJson);

      // Validate answers array length
      if (answers.length !== questionIds.length) {
        return reply.code(400).send({ success: false, error: "Answer count mismatch" });
      }

      // Timing is checked against the server's own signed issue time, not the
      // client's self-reported numbers. Posting `0` for every question no longer
      // buys a speed bonus.
      const timing = validateAttemptTiming({
        issuedAtMs: typeof iat === "number" ? iat : Date.now(),
        submittedAtMs: Date.now(),
        questionCount: questionIds.length,
        clientTimings: timeTakenPerQuestion,
      });

      if (!timing.ok) {
        logger.warn(
          { userId, attemptId, reason: timing.reason, flags: timing.flags },
          "Quiz submission rejected by timing validation"
        );
        return reply.code(400).send({ success: false, error: timing.reason });
      }

      // Advisory only — never used to withhold a payout, because a false
      // positive here means refusing to pay a real player.
      const behaviorVerdict = behavior ? scoreBehavior(behavior) : null;

      if (timing.flags.length || behaviorVerdict?.suspicious) {
        logger.warn(
          {
            userId,
            attemptId,
            timingFlags: timing.flags,
            behaviorScore: behaviorVerdict?.score,
            behaviorFlags: behaviorVerdict?.flags,
            elapsedSeconds: timing.elapsedSeconds,
            claimedSeconds: timing.claimedSeconds,
          },
          "Quiz attempt flagged for review"
        );
      }

      // Calculate score server-side
      let correctCount = 0;
      let score = 0;
      const results = answers.map((answer, idx) => {
        const isCorrect = answer === correctAnswers[idx];
        const timeTaken = timing.effectiveTimings[idx];
        const timeBonus = isCorrect ? timeBonusFor(timeTaken, timing.speedCreditFactor) : 0;
        const basePoints = isCorrect ? 100 : 0;
        const totalPoints = basePoints + timeBonus;

        if (isCorrect) correctCount++;
        score += totalPoints;

        return {
          questionId: questionIds[idx],
          isCorrect,
          answer,
          correctAnswer: correctAnswers[idx],
          timeTaken,
          points: totalPoints,
        };
      });

      // Reward goes through the economy service — the route never touches a
      // balance and never enqueues an ad-hoc payout job. The reward table, the
      // daily cap and the global budget all live in the economy config.
      const settlement = await settleDailyQuizReward(fastify, {
        userId,
        attemptId,
        attemptToken,
        round: round as number,
        correctCount,
        totalQuestions: questionIds.length,
        score,
        averageSeconds:
          timing.effectiveTimings.reduce((s, t) => s + t, 0) / Math.max(timing.effectiveTimings.length, 1),
        fullSpeedCredit: timing.speedCreditFactor >= 1,
        riskScore: riskScoreFrom(timing.flags, behaviorVerdict?.score, behaviorVerdict?.suspicious),
        questionIds,
      });

      return reply.send({
        success: true,
        data: {
          attemptId,
          status: settlement.granted > 0n ? "credited" : "no_reward",
          correctCount,
          totalQuestions: questionIds.length,
          score,
          rewardAmount: Number(fromAtomic(settlement.granted)),
          rewardPending: settlement.pending,
          rewardNotice: settlement.message,
          balances: settlement.balances,
          results,
        },
      });
    });

  // GET /api/quiz/daily - Fetch today's daily themed quiz (no auth required)
  fastify.get("/daily", async (_req, reply) => {
    const theme = getDailyTheme();
    const themed = await fastify.prisma.question.findMany({
      where: { status: "approved", topic: { name: theme } },
      include: { topic: true },
      orderBy: { dateCreated: "desc" },
      take: 50,
    });

    const pool = themed.length >= 10 ? themed : await fastify.prisma.question.findMany({
      where: { status: "approved" },
      include: { topic: true },
      take: 50,
    });

    if (!pool.length) {
      return reply.code(404).send({ success: false, error: "No questions available" });
    }

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const selected = pool.slice(0, 10);

    const shuffled = selected.map((q) => ({ q, ...shuffleOptions(q) }));

    // correctIndex and funFact are deliberately NOT included. This endpoint used
    // to ship the answer key to the browser, so a scraper could read every
    // answer out of the JSON before playing — which also made the canvas
    // question rendering pointless in this mode. Feedback now comes from
    // POST /daily/answer, one question at a time, after a choice is committed.
    const questionData = shuffled.map(({ q, options }) => ({
      id: q.id,
      question: q.question,
      options,
      difficulty: q.difficulty,
      topic: q.topic.name,
    }));

    const questionIds = selected.map((q) => q.id);
    const correctAnswers = shuffled.map((s) => s.correctIndex); // post-shuffle, 0-based
    const attemptId = `daily_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const token = makeAttemptToken(
      {
        attemptId,
        questionIds: JSON.stringify(questionIds),
        correctAnswers: JSON.stringify(correctAnswers),
      },
      30 * 60 // 30 minutes
    );

    return reply.send({
      success: true,
      data: { theme, token, questions: questionData },
    });
  });

  // POST /api/quiz/daily/answer — commit one answer, then receive feedback.
  //
  // Reveal is gated on commitment: the correct index for question i is only
  // returned once an answer for i has been recorded, and the recording is
  // write-once. So a client cannot poll this endpoint to harvest the answer key
  // before playing, and cannot revise an answer after seeing the result.
  fastify.post("/daily/answer", async (req, reply) => {
    const Schema = z.object({
      token: z.string(),
      questionIndex: z.number().int().min(0).max(99),
      answer: z.number().int().min(-1).max(3),
      timeTaken: z.number().min(0).max(600).optional(),
    });
    const parse = Schema.safeParse(req.body);
    if (!parse.success) {
      return reply.code(400).send({ success: false, error: parse.error.flatten() });
    }
    const { token, questionIndex, answer, timeTaken } = parse.data;

    const verified = verifyAttemptToken(token);
    if (!verified.ok) {
      return reply.code(401).send({ success: false, error: verified.error });
    }

    const { attemptId, correctAnswers: correctAnswersJson, questionIds: questionIdsJson } =
      verified.data as Record<string, string>;
    const correctAnswers: number[] = JSON.parse(correctAnswersJson);
    const questionIds: number[] = JSON.parse(questionIdsJson);

    if (questionIndex >= correctAnswers.length) {
      return reply.code(400).send({ success: false, error: "Question index out of range" });
    }

    const key = `dailyans:${attemptId}`;
    // HSETNX makes the first answer for this index the only one that counts.
    const stored = await fastify.redis.hsetnx(
      key,
      String(questionIndex),
      JSON.stringify({ answer, timeTaken: timeTaken ?? null, at: Date.now() })
    );
    await fastify.redis.expire(key, 30 * 60);

    if (stored === 0) {
      return reply
        .code(409)
        .send({ success: false, error: "This question has already been answered" });
    }

    const correctIndex = correctAnswers[questionIndex];
    // funFact is looked up now rather than shipped with the question list.
    const question = await fastify.prisma.question.findUnique({
      where: { id: questionIds[questionIndex] },
      select: { funFact: true },
    });

    return reply.send({
      success: true,
      data: {
        isCorrect: answer === correctIndex,
        correctIndex,
        funFact: question?.funFact ?? null,
      },
    });
  });

  // POST /api/quiz/daily/submit - Submit answers for the daily quiz (auth optional)
  fastify.post("/daily/submit",
    { preHandler: fastify.authenticateOptional },
    async (req, reply) => {
      const parse = DailySubmitSchema.safeParse(req.body);
      if (!parse.success) {
        return reply.code(400).send({ success: false, error: parse.error.flatten() });
      }
      const { token, answers, timings, behavior } = parse.data;

      const verified = verifyAttemptToken(token);
      if (!verified.ok) {
        return reply.code(401).send({ success: false, error: verified.error });
      }

      const {
        attemptId,
        questionIds: questionIdsJson,
        correctAnswers: correctAnswersJson,
        iat,
      } = verified.data as any;
      const questionIds: number[] = JSON.parse(questionIdsJson);
      const correctAnswers: number[] = JSON.parse(correctAnswersJson);

      if (answers.length !== questionIds.length || timings.length !== questionIds.length) {
        return reply.code(400).send({ success: false, error: "Answer count mismatch" });
      }

      // Prefer the answers this attempt actually committed via /daily/answer.
      // Those are write-once and server-held, so they cannot be revised after the
      // player has seen which choice was correct. The client-supplied array is
      // only a fallback for an attempt that never used the commit endpoint.
      const committedRaw = await fastify.redis.hgetall(`dailyans:${attemptId}`);
      const committedCount = Object.keys(committedRaw || {}).length;
      const effectiveAnswers = [...answers];
      const effectiveTimings = [...timings];

      if (committedCount > 0) {
        for (const [idxStr, blob] of Object.entries(committedRaw)) {
          const idx = Number(idxStr);
          if (!Number.isInteger(idx) || idx < 0 || idx >= questionIds.length) continue;
          try {
            const rec = JSON.parse(blob) as { answer: number; timeTaken: number | null };
            effectiveAnswers[idx] = rec.answer;
            if (typeof rec.timeTaken === "number") effectiveTimings[idx] = rec.timeTaken * 1000;
          } catch {
            // Unparseable record: leave the client value in place for this index.
          }
        }
      }

      // One attempt, one submission.
      const submitLock = await fastify.redis.set(
        `dailysubmitted:${attemptId}`,
        "1",
        "EX",
        60 * 60,
        "NX"
      );
      if (!submitLock) {
        return reply
          .code(409)
          .send({ success: false, error: "This attempt has already been submitted" });
      }

      // Same wall-clock check as the scored quiz. Note `timings` here are in ms.
      const dailyTiming = validateAttemptTiming({
        issuedAtMs: typeof iat === "number" ? iat : Date.now(),
        submittedAtMs: Date.now(),
        questionCount: questionIds.length,
        clientTimings: effectiveTimings.map((t) => (t ?? 15000) / 1000),
      });

      if (!dailyTiming.ok) {
        logger.warn(
          { attemptId, reason: dailyTiming.reason, flags: dailyTiming.flags },
          "Daily quiz submission rejected by timing validation"
        );
        return reply.code(400).send({ success: false, error: dailyTiming.reason });
      }

      const dailyBehavior = behavior ? scoreBehavior(behavior) : null;
      if (dailyTiming.flags.length || dailyBehavior?.suspicious) {
        logger.warn(
          {
            attemptId,
            timingFlags: dailyTiming.flags,
            behaviorScore: dailyBehavior?.score,
            behaviorFlags: dailyBehavior?.flags,
          },
          "Daily quiz attempt flagged for review"
        );
      }

      const userId = req.jwtUser?.userId;
      const streakMultiplier = userId
        ? (await fastify.prisma.user.findUnique({ where: { id: userId } }))?.streakBonusMultiplier ?? 1
        : 1;

      let correctCount = 0;
      let combo = 0;
      let totalPoints = 0;

      for (let i = 0; i < questionIds.length; i++) {
        const isCorrect = effectiveAnswers[i] === correctAnswers[i];
        if (isCorrect) correctCount++;

        combo = isCorrect ? combo + 1 : 0;
        // Validated/clamped seconds, not the raw client value.
        const timeTakenSec = dailyTiming.effectiveTimings[i];
        const speedBonus =
          isCorrect && timeTakenSec < 5 && dailyTiming.speedCreditFactor >= 1 ? 5 : 0;
        const basePoints = isCorrect ? 10 : 0;
        const comboMult = getComboMultiplier(combo);
        totalPoints += Math.round((basePoints + speedBonus) * streakMultiplier * comboMult);
      }

      const totalQuestions = questionIds.length;
      const xpEarned = correctCount * 8;

      // Guests play for fun; only a signed-in account can earn.
      if (!userId) {
        return reply.send({
          success: true,
          data: {
            correctCount,
            totalQuestions,
            totalPoints,
            xpEarned: 0,
            geekEarned: 0,
            rewardNotice:
              "Sign in to earn XP and Alpha GEEK for the Daily Quiz. Guest rounds are practice only.",
            guest: true,
          },
        });
      }

      const settlement = await settleDailyQuizReward(fastify, {
        userId,
        attemptId,
        attemptToken: token,
        round: 0,
        correctCount,
        totalQuestions,
        score: totalPoints,
        averageSeconds:
          dailyTiming.effectiveTimings.reduce((s, t) => s + t, 0) /
          Math.max(dailyTiming.effectiveTimings.length, 1),
        fullSpeedCredit: dailyTiming.speedCreditFactor >= 1,
        riskScore: riskScoreFrom(dailyTiming.flags, dailyBehavior?.score, dailyBehavior?.suspicious),
        questionIds,
      });

      // XP is reputation and is always awarded, whatever the reward budget says.
      await fastify.prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: xpEarned } },
      });

      return reply.send({
        success: true,
        data: {
          correctCount,
          totalQuestions,
          totalPoints,
          xpEarned,
          geekEarned: Number(fromAtomic(settlement.granted)),
          rewardPending: settlement.pending,
          rewardNotice: settlement.message,
          balances: settlement.balances,
        },
      });
    });

  /**
   * The one place a Daily Quiz reward is decided and credited.
   *
   * Both the authenticated `/submit` route and the `/daily/submit` route funnel
   * through here, so "one rewarded play per UTC day" is a single rule with a
   * single key rather than two endpoints each with their own idea of it.
   */
  async function settleDailyQuizReward(
    instance: FastifyInstance,
    input: {
      userId: number;
      attemptId: string;
      attemptToken: string;
      round: number;
      correctCount: number;
      totalQuestions: number;
      score: number;
      averageSeconds: number;
      fullSpeedCredit: boolean;
      riskScore: number;
      questionIds: number[];
    }
  ): Promise<{ granted: bigint; pending: boolean; message: string | null; balances: unknown }> {
    const config = await getEconomyConfig(instance.prisma);
    const rules = config.rules;
    const dayKey = utcDayKey();

    const noReward = async (message: string | null) => ({
      granted: 0n,
      pending: false,
      message,
      balances: await economy.getBalanceView(input.userId),
    });

    // Record the attempt regardless of whether it pays — the play history is
    // not conditional on the reward.
    await instance.prisma.quizAttempt
      .create({
        data: {
          attemptId: input.attemptId,
          userId: input.userId,
          attemptToken: input.attemptToken,
          round: input.round,
          correctCount: input.correctCount,
          score: input.score,
          rewardAmount: 0,
          status: "recorded",
        },
      })
      .catch(() => {
        // Duplicate attemptId: this attempt was already recorded. Not fatal.
      });

    if (!(await isBreakerOpen(instance.prisma, "DAILY_QUIZ"))) {
      return noReward("GEEK rewards are paused right now. Your XP and streak still count.");
    }

    if (!(await meetsAccountAge(instance.prisma, input.userId, rules.dailyQuiz.minAccountAgeHours))) {
      return noReward(
        `New accounts can earn GEEK after ${rules.dailyQuiz.minAccountAgeHours} hours. You're still earning XP.`
      );
    }

    // One rewarded play per UTC day, keyed on the user AND their wallet, so a
    // ring of accounts sharing one wallet collectively gets one rewarded play.
    const keys = await rewardedPlayKeys(instance.prisma, input.userId, dayKey);
    const claimed: string[] = [];
    for (const key of keys) {
      const ok = await instance.redis.set(key, input.attemptId, "EX", 172_800, "NX");
      if (!ok) {
        // Roll back any key we claimed in this loop, or a wallet collision
        // would permanently consume the user's own daily slot.
        if (claimed.length) await instance.redis.del(...claimed);
        return noReward(
          rules.dailyQuiz.practiceAllowed
            ? "You've already claimed today's Daily Quiz reward. Keep playing for practice and XP — GEEK resets at 00:00 UTC."
            : "You've already played today's Daily Quiz."
        );
      }
      claimed.push(key);
    }

    const breakdown = calculateDailyReward(rules, {
      correctCount: input.correctCount,
      totalQuestions: input.totalQuestions,
      averageSeconds: input.averageSeconds,
      fullSpeedCredit: input.fullSpeedCredit,
      streakDays: await currentStreakDays(instance, input.userId),
      riskScore: input.riskScore,
    });

    if (!breakdown.eligible) {
      // A play that earns nothing should not burn the day's rewarded slot.
      if (claimed.length) await instance.redis.del(...claimed);
      return noReward(breakdown.reason);
    }

    const flagged = input.riskScore >= rules.dailyQuiz.maxRiskScore / 2;

    const grant = await economy.grantReward({
      userId: input.userId,
      type: "DAILY_REWARD",
      amount: capToDaily(breakdown.grossAtomic, rules),
      budget: "DAILY_QUIZ",
      breaker: "DAILY_QUIZ",
      pending: true,
      holdHours: rules.dailyQuiz.pendingHoldHours,
      idempotencyKey: `daily:${input.userId}:${dayKey}`,
      referenceType: "QUIZ_ATTEMPT",
      referenceId: input.attemptId,
      userCap: {
        name: "daily:quiz",
        periodKey: dayKey,
        limit: toAtomic(rules.dailyQuiz.perUserDailyCapGeek),
      },
      flagged,
      flagReason: flagged ? `Anti-cheat risk score ${input.riskScore}` : undefined,
      metadata: {
        correctCount: input.correctCount,
        base: breakdown.baseAtomic.toString(),
        speedBonus: breakdown.speedBonusAtomic.toString(),
        streakBonus: breakdown.streakBonusAtomic.toString(),
        riskScore: input.riskScore,
      },
    });

    // Nothing was granted: release the daily slot so the player is not charged
    // a day for a reward they never received.
    if (grant.granted <= 0n && claimed.length) await instance.redis.del(...claimed);

    if (grant.granted > 0n) {
      await instance.prisma.quizAttempt
        .update({
          where: { attemptId: input.attemptId },
          data: { rewardAmount: fromAtomic(grant.granted), status: grant.pending ? "pending" : "paid" },
        })
        .catch(() => undefined);

      // Creator royalties for the questions this attempt served.
      await creditRoyaltiesForServedQuestions(instance.prisma, {
        questionIds: input.questionIds,
        playerId: input.userId,
        sessionId: input.attemptId,
      });
    }

    const holdNote =
      grant.granted > 0n && grant.pending
        ? ` It clears to your available balance in ${rules.dailyQuiz.pendingHoldHours}h after validation.`
        : "";

    return {
      granted: grant.granted,
      pending: grant.pending,
      message: grant.granted > 0n ? `${grant.message}${holdNote}` : grant.message,
      balances: await economy.getBalanceView(input.userId),
    };
  }

  /** Consecutive daily-quiz days, used for the streak bonus. */
  async function currentStreakDays(instance: FastifyInstance, userId: number): Promise<number> {
    const user = await instance.prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true },
    });
    return user?.currentStreak ?? 0;
  }
}
