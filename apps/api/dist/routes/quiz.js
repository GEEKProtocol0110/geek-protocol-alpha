import { z } from "zod";
import { makeAttemptToken, verifyAttemptToken } from "../lib/security";
import { QUIZ_REWARD_TABLE } from "../config/quizRewards";
import { Queue } from "bullmq";
import Redis from "ioredis";
const QUESTION_TTL = 15 * 60; // 15 minutes
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const rewardQueue = new Queue("reward-processing", { connection: redis });
// Zod schemas
const StartQuizSchema = z.object({
    round: z.number().int().min(1).max(10),
});
const SubmitQuizSchema = z.object({
    attemptToken: z.string(),
    answers: z.array(z.number()),
    timeTakenPerQuestion: z.array(z.number()),
});
// Helpers
function getDailyTheme() {
    const themes = [
        "Video Games", "Sci-Fi & Fantasy", "Movies & TV",
        "Comics", "Anime & Manga", "Tech & Programming",
        "History", "Pop Culture",
    ];
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return themes[dayOfYear % themes.length];
}
function shuffleOptions(q) {
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
export async function quizRoutes(fastify) {
    // POST /api/quiz/start - Start a new quiz round
    fastify.post("/start", { preHandler: fastify.authenticate }, async (req, reply) => {
        const parse = StartQuizSchema.safeParse(req.body);
        if (!parse.success) {
            return reply.code(400).send({ success: false, error: parse.error.flatten() });
        }
        const { round } = parse.data;
        const userId = req.jwtUser.userId;
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
        const attemptToken = makeAttemptToken({
            attemptId,
            userId,
            round,
            questionIds: JSON.stringify(questionIds),
            correctAnswers: JSON.stringify(correctAnswers),
        }, QUESTION_TTL);
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
    fastify.post("/submit", { preHandler: fastify.authenticate }, async (req, reply) => {
        const parse = SubmitQuizSchema.safeParse(req.body);
        if (!parse.success) {
            return reply.code(400).send({ success: false, error: parse.error.flatten() });
        }
        const { attemptToken, answers, timeTakenPerQuestion } = parse.data;
        const userId = req.jwtUser.userId;
        // Verify attempt token
        const verified = verifyAttemptToken(attemptToken);
        if (!verified.ok) {
            return reply.code(401).send({ success: false, error: verified.error });
        }
        const { attemptId, round, questionIds: questionIdsJson, correctAnswers: correctAnswersJson } = verified.data;
        const questionIds = JSON.parse(questionIdsJson);
        const correctAnswers = JSON.parse(correctAnswersJson);
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
            if (isCorrect)
                correctCount++;
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
        const roundConfig = QUIZ_REWARD_TABLE[round];
        const rewardAmount = Math.min(correctCount * roundConfig.rewardPerQuestion, roundConfig.maxEarn);
        // Create QuizAttempt
        const quizAttempt = await fastify.prisma.quizAttempt.create({
            data: {
                attemptId,
                userId,
                attemptToken,
                round: round,
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
}
