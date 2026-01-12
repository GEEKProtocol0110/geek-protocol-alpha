import { FastifyInstance } from "fastify";
import { StartQuizRequestSchema, QuestionPublicSchema, SubmitQuizRequestSchema } from "@geek/shared";
import { makeAttemptToken, verifyAttemptToken } from "../lib/security";
import { authMiddleware } from "../lib/auth-middleware";

const RUN_LENGTH = 10;
const ATTEMPT_TTL_SECONDS = 15 * 60; // 15 minutes window

export async function quizRoutes(fastify: FastifyInstance) {
  // Start quiz attempt
  fastify.post<{ Body: unknown }>("/start", async (request, reply) => {
    try {
      await authMiddleware(request, reply);
      const body = StartQuizRequestSchema.parse(request.body);
      const category = body.category || "General Geek";

      const userId = request.userId || "temp-user";

      const questions = await fastify.prisma.question.findMany({
        where: { category, active: true },
        orderBy: { createdAt: "desc" },
        take: RUN_LENGTH * 3,
      });

      if (!questions.length) {
        return reply.code(400).send({ success: false, error: "No questions available" });
      }

      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }
      const selected = questions.slice(0, RUN_LENGTH);

      const now = new Date();
      const attempt = await fastify.prisma.attempt.create({
        data: {
          userId,
          category,
          questionIds: selected.map((q) => q.id),
          answers: [],
          correctAnswers: selected.map((q) => q.correctIndex),
          score: 0,
          scorePct: 0,
          startedAt: now,
          finishedAt: now,
        },
      });

      const token = makeAttemptToken({ attemptId: attempt.id }, ATTEMPT_TTL_SECONDS);

      const publicQuestions = selected.map((q) =>
        QuestionPublicSchema.parse({
          id: q.id,
          category: q.category,
          prompt: q.prompt,
          options: q.options,
          correctIndex: q.correctIndex,
          difficulty: (q as { difficulty?: string | null }).difficulty || "medium",
          tags: q.tags,
          version: q.version,
          active: q.active,
          createdAt: q.createdAt,
        })
      );

      return reply.send({
        success: true,
        data: {
          attemptId: attempt.id,
          attemptToken: token,
          expiresAt: Math.floor(Date.now() / 1000) + ATTEMPT_TTL_SECONDS,
          questions: publicQuestions,
        },
      });
    } catch (err) {
      request.log.error({ err }, "quiz.start_failed");
      const message = err instanceof Error ? err.message : "Bad request";
      return reply.code(400).send({ success: false, error: message });
    }
  });

  // Submit attempt for server-side scoring
  fastify.post<{ Body: unknown }>("/submit", async (request, reply) => {
    try {
      const parsed = SubmitQuizRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ success: false, error: "Invalid payload" });
      }

      const { attemptId, attemptToken, answers } = parsed.data;

      const verified = verifyAttemptToken(attemptToken);
      if (!verified.ok || verified.data.attemptId !== attemptId) {
        return reply.code(401).send({ success: false, error: "Invalid token" });
      }

      const attempt = await fastify.prisma.attempt.findUnique({ where: { id: attemptId } });
      if (!attempt) {
        return reply.code(404).send({ success: false, error: "Attempt not found" });
      }

      const correct = attempt.correctAnswers || [];
      if (answers.length !== correct.length) {
        return reply.code(400).send({ success: false, error: "Answers length mismatch" });
      }

      let score = 0;
      const perQuestion: { questionId: string; correct: boolean; answer: number }[] = [];
      for (let i = 0; i < answers.length; i++) {
        const isCorrect = Number(answers[i]) === Number(correct[i]);
        if (isCorrect) score++;
        perQuestion.push({ questionId: attempt.questionIds[i], correct: isCorrect, answer: Number(answers[i]) });
      }
      const scorePct = Math.round((score / answers.length) * 100);

      const finishedAt = new Date();
      const timeSeconds = Math.max(0, Math.floor((finishedAt.getTime() - new Date(attempt.startedAt).getTime()) / 1000));

      await fastify.prisma.attempt.update({
        where: { id: attemptId },
        data: {
          answers: answers.map((x) => Number(x)),
          score,
          scorePct,
          finishedAt,
          timeSeconds,
        },
      });

      await Promise.all(
        perQuestion.map((aq) =>
          fastify.prisma.attemptQuestion.upsert({
            where: { attemptId_questionId: { attemptId, questionId: aq.questionId } },
            create: { attemptId, questionId: aq.questionId, answer: aq.answer, correct: aq.correct },
            update: { answer: aq.answer, correct: aq.correct },
          })
        )
      );

      await fastify.redis.lpush("reward_queue", JSON.stringify({ attemptId }));

      return reply.send({
        success: true,
        data: {
          attemptId,
          score,
          scorePct,
          timeSeconds,
        },
      });
    } catch (err) {
      request.log.error({ err }, "quiz.submit_failed");
      const message = err instanceof Error ? err.message : "Server error";
      return reply.code(500).send({ success: false, error: message });
    }
  });

  // Get a user's attempt history (basic)
  fastify.get<{ Params: { userId: string } }>("/history/:userId", async (request, reply) => {
    const { userId } = request.params;
    const attempts = await fastify.prisma.attempt.findMany({
      where: { userId },
      orderBy: { finishedAt: "desc" },
      take: 50,
    });
    return reply.send({ success: true, data: attempts });
  });
}
