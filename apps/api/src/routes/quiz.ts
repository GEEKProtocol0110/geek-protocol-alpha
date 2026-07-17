import { FastifyInstance } from "fastify";
import { z } from "zod";
import { makeAttemptToken, verifyAttemptToken } from "../lib/security";
import { logger } from "../lib/logger";
import { QUIZ_REWARD_TABLE } from "../config/quizRewards";
import { Queue, Worker } from "bullmq";
import Redis from "ioredis";

const QUESTION_TTL = 15 * 60; // 15 minutes
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const rewardQueue = new Queue("reward-processing", { connection: redis as any });

// Zod schemas
const StartQuizSchema = z.object({
  round: z.number().int().min(1).max(10),
});

const SubmitQuizSchema = z.object({
  attemptToken: z.string(),
  answers: z.array(z.number()),
  timeTakenPerQuestion: z.array(z.number()),
});

const DailySubmitSchema = z.object({
  token: z.string(),
  answers: z.array(z.number()),
  timings: z.array(z.number()),
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
  const themes = [
    "Video Games", "Sci-Fi & Fantasy", "Movies & TV",
    "Comics", "Anime & Manga", "Tech & Programming",
    "History", "Pop Culture",
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

      const { attemptToken, answers, timeTakenPerQuestion } = parse.data;
      const userId = req.jwtUser!.userId;

      // Verify attempt token
      const verified = verifyAttemptToken(attemptToken);
      if (!verified.ok) {
        return reply.code(401).send({ success: false, error: verified.error });
      }

      const { attemptId, round, questionIds: questionIdsJson, correctAnswers: correctAnswersJson } = verified.data as any;
      const questionIds: number[] = JSON.parse(questionIdsJson);
      const correctAnswers: number[] = JSON.parse(correctAnswersJson);

      // Validate answers array length
      if (answers.length !== questionIds.length) {
        return reply.code(400).send({ success: false, error: "Answer count mismatch" });
      }

      // Calculate score server-side
      let correctCount = 0;
      let score = 0;
      const results = answers.map((answer, idx) => {
        const isCorrect = answer === correctAnswers[idx];
        const timeTaken = timeTakenPerQuestion[idx] || 15;
        const timeBonus = isCorrect ? Math.max(0, (15 - timeTaken) * 10) : 0;
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

      // Calculate reward amount
      const roundConfig = QUIZ_REWARD_TABLE[round as number];
      const rewardAmount = Math.min(
        correctCount * roundConfig.rewardPerQuestion,
        roundConfig.maxEarn
      );

      // Create QuizAttempt
      const quizAttempt = await fastify.prisma.quizAttempt.create({
        data: {
          attemptId,
          userId,
          attemptToken,
          round: round as number,
          correctCount,
          score,
          rewardAmount,
          status: "pending",
        },
      });

      // Enqueue reward job
      await rewardQueue.add("process-reward", {
        attemptId,
        userId,
        rewardAmount,
        type: "quiz_reward",
      });

      return reply.send({
        success: true,
        data: {
          attemptId,
          status: "settling",
          correctCount,
          totalQuestions: questionIds.length,
          score,
          rewardAmount,
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

    const questionData = shuffled.map(({ q, options, correctIndex }) => ({
      id: q.id,
      question: q.question,
      options,
      correctIndex,
      difficulty: q.difficulty,
      topic: q.topic.name,
      funFact: q.funFact ?? null,
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

  // POST /api/quiz/daily/submit - Submit answers for the daily quiz (auth optional)
  fastify.post("/daily/submit",
    { preHandler: fastify.authenticateOptional },
    async (req, reply) => {
      const parse = DailySubmitSchema.safeParse(req.body);
      if (!parse.success) {
        return reply.code(400).send({ success: false, error: parse.error.flatten() });
      }
      const { token, answers, timings } = parse.data;

      const verified = verifyAttemptToken(token);
      if (!verified.ok) {
        return reply.code(401).send({ success: false, error: verified.error });
      }

      const {
        attemptId,
        questionIds: questionIdsJson,
        correctAnswers: correctAnswersJson,
      } = verified.data as any;
      const questionIds: number[] = JSON.parse(questionIdsJson);
      const correctAnswers: number[] = JSON.parse(correctAnswersJson);

      if (answers.length !== questionIds.length || timings.length !== questionIds.length) {
        return reply.code(400).send({ success: false, error: "Answer count mismatch" });
      }

      const userId = req.jwtUser?.userId;
      const streakMultiplier = userId
        ? (await fastify.prisma.user.findUnique({ where: { id: userId } }))?.streakBonusMultiplier ?? 1
        : 1;

      let correctCount = 0;
      let combo = 0;
      let totalPoints = 0;

      for (let i = 0; i < questionIds.length; i++) {
        const isCorrect = answers[i] === correctAnswers[i];
        if (isCorrect) correctCount++;

        combo = isCorrect ? combo + 1 : 0;
        const timeTakenSec = (timings[i] ?? 15000) / 1000;
        const speedBonus = isCorrect && timeTakenSec < 5 ? 5 : 0;
        const basePoints = isCorrect ? 10 : 0;
        const comboMult = getComboMultiplier(combo);
        totalPoints += Math.round((basePoints + speedBonus) * streakMultiplier * comboMult);
      }

      const totalQuestions = questionIds.length;
      const xpEarned = correctCount * 8;
      const geekEarned = Number((correctCount * 0.5).toFixed(2));

      if (userId) {
        await fastify.prisma.quizAttempt.create({
          data: {
            attemptId,
            userId,
            attemptToken: token,
            round: 0,
            correctCount,
            score: totalPoints,
            rewardAmount: geekEarned,
            status: "pending",
          },
        });

        await rewardQueue.add("process-reward", {
          attemptId,
          userId,
          rewardAmount: geekEarned,
          type: "quiz_reward",
        });
      }

      return reply.send({
        success: true,
        data: { correctCount, totalQuestions, totalPoints, xpEarned, geekEarned },
      });
    });
}
