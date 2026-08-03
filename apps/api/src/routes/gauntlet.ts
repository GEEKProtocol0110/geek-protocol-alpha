import { FastifyInstance } from "fastify";
import { z } from "zod";
import { makeAttemptToken, verifyAttemptToken } from "../lib/security";
import { logger } from "../lib/logger";
import { validateAttemptTiming } from "../lib/antiCheat";
import { BehaviorSignalsSchema, scoreBehavior } from "../lib/behaviorScore";

/** Must match QUESTION_TIME in the gauntlet play client. */
const GAUNTLET_QUESTION_SECONDS = 20;

const ROUND_CONFIG = [
  { round: 1, fee: 0,    difficulty: "easy",        rewardPerCorrect: 10,   label: "INITIATION" },
  { round: 2, fee: 40,   difficulty: "easy-medium", rewardPerCorrect: 20,   label: "BASIC PROTOCOLS" },
  { round: 3, fee: 100,  difficulty: "medium",      rewardPerCorrect: 40,   label: "NETWORK LAYER" },
  { round: 4, fee: 200,  difficulty: "medium-hard", rewardPerCorrect: 80,   label: "DATA STREAMS" },
  { round: 5, fee: 400,  difficulty: "hard",        rewardPerCorrect: 150,  label: "GRID ACCESS" },
  { round: 6, fee: 750,  difficulty: "hard",        rewardPerCorrect: 280,  label: "DEEP PROTOCOL" },
  { round: 7, fee: 1250, difficulty: "very-hard",   rewardPerCorrect: 450,  label: "CIPHER DESCENT" },
  { round: 8, fee: 2000, difficulty: "very-hard",   rewardPerCorrect: 700,  label: "CORE BREACH" },
  { round: 9, fee: 3500, difficulty: "expert",      rewardPerCorrect: 1100, label: "OMNISCIENT GATE" },
  { round:10, fee: 6000, difficulty: "expert",      rewardPerCorrect: 1800, label: "APEX PROTOCOL" },
];

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

export async function gauntletRoutes(fastify: FastifyInstance) {

  // GET /api/gauntlet/config — round config + available topics
  fastify.get("/config", async (_req, reply) => {
    return reply.send({ success: true, data: { rounds: ROUND_CONFIG, topics: TOPICS } });
  });

  // GET /api/gauntlet/run/active?userId=N — check for unfinished run
  fastify.get("/run/active", async (request, reply) => {
    const { userId } = z.object({ userId: z.coerce.number() }).parse(request.query);
    const run = await fastify.prisma.gauntletRun.findFirst({
      where: { userId, completed: false },
      orderBy: { dateStarted: "desc" },
    });
    if (!run) return reply.send({ success: true, data: null });
    return reply.send({ success: true, data: run });
  });

  // POST /api/gauntlet/run/start — create a new run
  fastify.post("/run/start", async (request, reply) => {
    const Schema = z.object({
      userId: z.number(),
      selectedTopics: z.array(z.string()).min(2),
    });
    const { userId, selectedTopics } = Schema.parse(request.body);

    // Cancel any existing incomplete runs
    await fastify.prisma.gauntletRun.updateMany({
      where: { userId, completed: false },
      data: { completed: true },
    });

    const run = await fastify.prisma.gauntletRun.create({
      data: {
        userId,
        selectedTopics: JSON.stringify(selectedTopics),
        activeRound: 1,
        activeState: JSON.stringify({ geekEarned: 0, xpEarned: 0, roundResults: [] }),
      },
    });
    return reply.send({ success: true, data: run });
  });

  // POST /api/gauntlet/run/:runId/round/:round/questions — fetch questions for a round
  fastify.post("/run/:runId/round/:round/questions", async (request, reply) => {
    const { runId, round } = z.object({
      runId: z.coerce.number(),
      round: z.coerce.number().min(1).max(10),
    }).parse(request.params);

    const Body = z.object({ userId: z.number(), modifier: z.string().optional() });
    const { userId, modifier } = Body.parse(request.body);

    const run = await fastify.prisma.gauntletRun.findFirst({ where: { id: runId, userId, completed: false } });
    if (!run) return reply.code(404).send({ success: false, error: "Run not found" });

    const cfg = ROUND_CONFIG[round - 1];
    const topics: string[] = JSON.parse(run.selectedTopics ?? JSON.stringify(TOPICS));
    const activeState = parseState(run.activeState);
    const paidRounds: number[] = activeState.paidRounds ?? [];
    const alreadyPaid = paidRounds.includes(round);
    const user = await fastify.prisma.user.findUnique({
      where: { id: userId },
      select: {
        geekBalance: true,
        favoriteCharacter: true,
        currentStreak: true,
        streakBonusMultiplier: true,
        categoryAccuracies: true,
      },
    });
    if (!user) return reply.code(404).send({ success: false, error: "User not found" });

    const entryMultiplier = modifier === "double_down" ? 2 : modifier === "safety_net" ? 1.1 : 1;
    const entryFee = Math.round(cfg.fee * entryMultiplier);
    if (!alreadyPaid && entryFee > 0) {
      if (user.geekBalance.toNumber() < entryFee) {
        return reply.code(402).send({ success: false, error: `Not enough GEEK for Round ${round}. Required: ${entryFee}` });
      }
      await fastify.prisma.user.update({
        where: { id: userId },
        data: { geekBalance: { decrement: entryFee } },
      });
      paidRounds.push(round);
    }

    // Fetch questions from selected topics
    let questions = await fastify.prisma.question.findMany({
      where: { status: "approved", topic: { name: { in: topics } } },
      include: { topic: true },
      take: 100,
    });

    if (questions.length < 10) {
      questions = await fastify.prisma.question.findMany({
        where: { status: "approved" },
        include: { topic: true },
        take: 100,
      });
    }

    // Shuffle and pick 10
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    const selected = questions.slice(0, 10);

    const publicQuestions = await Promise.all(selected.map(async (q) => {
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
    }));

    const attemptId = `gauntlet_${runId}_r${round}_${Date.now()}`;
    const token = makeAttemptToken({
      attemptId,
      runId: String(runId),
      round: String(round),
      questionIds: JSON.stringify(publicQuestions.map((q) => q.id)),
      correctAnswers: JSON.stringify(publicQuestions.map((q) => q.correctIndex)),
    }, 30 * 60);

    // Strip the answer key and the funFact before sending. Gauntlet pays the
    // largest rewards on the platform and was shipping `correctIndex` straight
    // to the browser, so a scraper could read every answer out of the response
    // body. Both are now revealed one question at a time by
    // POST /run/:runId/round/:round/answer, and only after a choice is
    // committed. correctAnswers stays inside the signed token, which the client
    // cannot read.
    const clientQuestions = publicQuestions.map(({ correctIndex: _hidden, funFact: _fact, ...rest }) => {
      void _hidden;
      void _fact;
      return rest;
    });

    // Save active round
    await fastify.prisma.gauntletRun.update({
      where: { id: runId },
      data: {
        activeRound: round,
        activeState: JSON.stringify({ ...activeState, paidRounds, activeModifier: modifier ?? null }),
        activeStateUpdatedAt: new Date(),
      },
    });

    const character = user.favoriteCharacter ?? "GIGA";

    return reply.send({
      success: true,
      data: {
        roundConfig: { ...cfg, modifier: modifier ?? null, chargedEntryFee: entryFee },
        token,
        questions: clientQuestions,
        tip: pickTip(character),
        character,
        player: {
          geekBalance: Math.max(0, user.geekBalance.toNumber() - (!alreadyPaid ? entryFee : 0)),
          currentStreak: user.currentStreak,
          streakBonusMultiplier: user.streakBonusMultiplier,
          categoryAccuracies: parseState(user.categoryAccuracies),
        },
      },
    });
  });

  // POST /api/gauntlet/run/:runId/round/:round/submit
  // POST /api/gauntlet/run/:runId/round/:round/answer — commit one answer, get feedback.
  // Same commit-then-reveal contract as the daily quiz: the correct index for a
  // question is only returned once a choice for it has been recorded, and the
  // recording is write-once, so revealing an answer costs the player their guess.
  fastify.post("/run/:runId/round/:round/answer", async (request, reply) => {
    const { runId, round } = z.object({
      runId: z.coerce.number(),
      round: z.coerce.number().min(1).max(10),
    }).parse(request.params);

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

    // The token is bound to a specific run and round.
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
  });

  fastify.post("/run/:runId/round/:round/submit", async (request, reply) => {
    const { runId, round } = z.object({
      runId: z.coerce.number(),
      round: z.coerce.number().min(1).max(10),
    }).parse(request.params);

    const Schema = z.object({
      userId: z.number(),
      token: z.string(),
      answers: z.array(z.number()),
      timings: z.array(z.number()).optional(),
      modifier: z.string().optional(),
      behavior: BehaviorSignalsSchema.optional(),
    });
    const { userId, token, answers, timings, modifier, behavior } = Schema.parse(request.body);

    const verified = verifyAttemptToken(token);
    if (!verified.ok) return reply.code(401).send({ success: false, error: "Invalid token" });

    const run = await fastify.prisma.gauntletRun.findFirst({ where: { id: runId, userId, completed: false } });
    if (!run) return reply.code(404).send({ success: false, error: "Run not found" });

    const cfg = ROUND_CONFIG[round - 1];
    const correctAnswers: number[] = JSON.parse(verified.data.correctAnswers as string);
    const questionIds: number[] = JSON.parse(verified.data.questionIds as string);

    // Score from the answers committed via /answer, which are write-once and
    // server-held. The client's array is only a fallback for a round that never
    // used the commit endpoint.
    const committedRaw = await fastify.redis.hgetall(
      `gauntletans:${String(verified.data.attemptId)}`
    );
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

    // Gauntlet pays the largest per-question rewards on the platform, so the
    // same wall-clock check applies here: speed bonuses come from validated
    // timings, never from what the client claims.
    const timing = validateAttemptTiming({
      issuedAtMs:
        typeof verified.data.iat === "number" ? (verified.data.iat as number) : Date.now(),
      submittedAtMs: Date.now(),
      questionCount: correctAnswers.length,
      clientTimings: effectiveTimings.map((t) => (t ?? 20000) / 1000),
      maxSecondsPerQuestion: GAUNTLET_QUESTION_SECONDS,
    });

    if (!timing.ok) {
      fastify.log.warn(
        { userId, runId, round, reason: timing.reason, flags: timing.flags },
        "Gauntlet submission rejected by timing validation"
      );
      return reply.code(400).send({ success: false, error: timing.reason });
    }

    const behaviorVerdict = behavior ? scoreBehavior(behavior) : null;
    if (timing.flags.length || behaviorVerdict?.suspicious) {
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
    }

    const results = effectiveAnswers.map((ans, i) => {
      const isCorrect = ans === correctAnswers[i];
      const timeTaken = timing.effectiveTimings[i] ?? 15;
      const fullCredit = timing.speedCreditFactor >= 1;
      const speedBonus =
        isCorrect && fullCredit && timeTaken < 5
          ? 0.2
          : isCorrect && fullCredit && timeTaken < 9
            ? 0.1
            : 0;
      let reward = isCorrect ? cfg.rewardPerCorrect : 0;
      if (modifier === "double_down") reward *= 2;
      if (modifier === "hot_streak" && i < 5 && answers.slice(0, i + 1).every((a, idx) => a === correctAnswers[idx])) reward *= 1.5;
      return { isCorrect, timeTaken, speedBonus, reward: Math.round(reward * (1 + speedBonus)), questionId: questionIds[i] };
    });

    const correctCount = results.filter((r) => r.isCorrect).length;
    const geekEarned = results.reduce((s, r) => s + r.reward, 0);
    const xpEarned = correctCount * 15;

    // Safety net modifier: partial refund if < 50% correct
    let refund = 0;
    if (modifier === "safety_net" && correctCount < 5) refund = Math.round(cfg.fee * 0.5);

    // Persist attempts
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

      // Update run state
      const prevState = parseState(run.activeState);
      const roundResults = [...(prevState.roundResults ?? []), { round, correctCount, geekEarned, xpEarned }];
      const totalGeek = (prevState.geekEarned ?? 0) + geekEarned + refund;
      const totalXp = (prevState.xpEarned ?? 0) + xpEarned;

      await fastify.prisma.gauntletRun.update({
        where: { id: runId },
        data: {
          highestRound: Math.max(run.highestRound, round),
          totalCorrect: { increment: correctCount },
          totalQuestions: { increment: 10 },
          totalGeekEarned: { increment: geekEarned + refund },
          totalXpEarned: { increment: xpEarned },
          activeRound: round < 10 ? round + 1 : round,
          activeState: JSON.stringify({
            ...prevState,
            geekEarned: totalGeek,
            xpEarned: totalXp,
            roundResults,
            activeModifier: null,
          }),
          activeStateUpdatedAt: new Date(),
        },
      });

      // Give user XP immediately
      await fastify.prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: xpEarned } },
      });
    } catch (err) {
      logger.error({ err }, "gauntlet.submit_persist_failed");
    }

    return reply.send({
      success: true,
      data: {
        correctCount,
        totalQuestions: 10,
        geekEarned,
        xpEarned,
        refund,
        results: results.map((r, i) => ({
          questionId: r.questionId,
          isCorrect: r.isCorrect,
          reward: r.reward,
          correctAnswer: correctAnswers[i],
        })),
      },
    });
  });

  // POST /api/gauntlet/run/:runId/cashout — end the run and credit GEEK
  fastify.post("/run/:runId/cashout", async (request, reply) => {
    const { runId } = z.object({ runId: z.coerce.number() }).parse(request.params);
    const { userId } = z.object({ userId: z.number() }).parse(request.body);

    const run = await fastify.prisma.gauntletRun.findFirst({ where: { id: runId, userId, completed: false } });
    if (!run) return reply.code(404).send({ success: false, error: "Run not found" });

    const state = JSON.parse(run.activeState ?? "{}");
    const totalGeek: number = run.totalGeekEarned;

    await fastify.prisma.gauntletRun.update({
      where: { id: runId },
      data: { completed: true, dateCompleted: new Date() },
    });

    if (totalGeek > 0) {
      await fastify.prisma.user.update({
        where: { id: userId },
        data: { geekBalance: { increment: totalGeek } },
      });
      await fastify.prisma.gauntletClaim.create({
        data: { userId, runId, amount: totalGeek, status: "claimed" },
      });
    }

    return reply.send({
      success: true,
      data: {
        totalGeekEarned: totalGeek,
        totalXpEarned: run.totalXpEarned,
        highestRound: run.highestRound,
        totalCorrect: run.totalCorrect,
        totalQuestions: run.totalQuestions,
        roundResults: state.roundResults ?? [],
      },
    });
  });

  // GET /api/gauntlet/run/:runId/summary
  fastify.get("/run/:runId/summary", async (request, reply) => {
    const { runId } = z.object({ runId: z.coerce.number() }).parse(request.params);
    const run = await fastify.prisma.gauntletRun.findUnique({ where: { id: runId } });
    if (!run) return reply.code(404).send({ success: false, error: "Not found" });
    const state = JSON.parse(run.activeState ?? "{}");
    return reply.send({
      success: true,
      data: { ...run, roundResults: state.roundResults ?? [] },
    });
  });
}
