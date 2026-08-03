import { z } from "zod";
import { makeAttemptToken, verifyAttemptToken } from "../lib/security";
import { logger } from "../lib/logger";
import { QUIZ_REWARD_TABLE } from "../config/quizRewards";
import { enqueuePayout } from "../lib/payoutQueue";
import { validateAttemptTiming, timeBonusFor } from "../lib/antiCheat";
import { BehaviorSignalsSchema, scoreBehavior } from "../lib/behaviorScore";
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
function getComboMultiplier(combo) {
    if (combo >= 10)
        return 3.0;
    if (combo >= 7)
        return 2.5;
    if (combo >= 5)
        return 2.0;
    if (combo >= 3)
        return 1.5;
    return 1.0;
}
// Helpers
function getDailyTheme() {
    // Kaspa-native rotation. Was pop-culture categories, which had nothing to do
    // with the chain players are being paid on.
    const themes = [
        "Kaspa Origins", "GHOSTDAG & BlockDAG", "Mining & Consensus",
        "Tokenomics", "Wallets & Addresses", "KRC-20 & Smart Contracts",
        "Kaspa Ecosystem", "Crypto Fundamentals",
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
        const { attemptToken, answers, timeTakenPerQuestion, behavior } = parse.data;
        const userId = req.jwtUser.userId;
        // Verify attempt token
        const verified = verifyAttemptToken(attemptToken);
        if (!verified.ok) {
            return reply.code(401).send({ success: false, error: verified.error });
        }
        const { attemptId, round, questionIds: questionIdsJson, correctAnswers: correctAnswersJson, iat } = verified.data;
        const questionIds = JSON.parse(questionIdsJson);
        const correctAnswers = JSON.parse(correctAnswersJson);
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
            logger.warn({ userId, attemptId, reason: timing.reason, flags: timing.flags }, "Quiz submission rejected by timing validation");
            return reply.code(400).send({ success: false, error: timing.reason });
        }
        // Advisory only — never used to withhold a payout, because a false
        // positive here means refusing to pay a real player.
        const behaviorVerdict = behavior ? scoreBehavior(behavior) : null;
        if (timing.flags.length || behaviorVerdict?.suspicious) {
            logger.warn({
                userId,
                attemptId,
                timingFlags: timing.flags,
                behaviorScore: behaviorVerdict?.score,
                behaviorFlags: behaviorVerdict?.flags,
                elapsedSeconds: timing.elapsedSeconds,
                claimedSeconds: timing.claimedSeconds,
            }, "Quiz attempt flagged for review");
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
        await enqueuePayout({
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
        const token = makeAttemptToken({
            attemptId,
            questionIds: JSON.stringify(questionIds),
            correctAnswers: JSON.stringify(correctAnswers),
        }, 30 * 60 // 30 minutes
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
        const { attemptId, correctAnswers: correctAnswersJson, questionIds: questionIdsJson } = verified.data;
        const correctAnswers = JSON.parse(correctAnswersJson);
        const questionIds = JSON.parse(questionIdsJson);
        if (questionIndex >= correctAnswers.length) {
            return reply.code(400).send({ success: false, error: "Question index out of range" });
        }
        const key = `dailyans:${attemptId}`;
        // HSETNX makes the first answer for this index the only one that counts.
        const stored = await fastify.redis.hsetnx(key, String(questionIndex), JSON.stringify({ answer, timeTaken: timeTaken ?? null, at: Date.now() }));
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
    fastify.post("/daily/submit", { preHandler: fastify.authenticateOptional }, async (req, reply) => {
        const parse = DailySubmitSchema.safeParse(req.body);
        if (!parse.success) {
            return reply.code(400).send({ success: false, error: parse.error.flatten() });
        }
        const { token, answers, timings, behavior } = parse.data;
        const verified = verifyAttemptToken(token);
        if (!verified.ok) {
            return reply.code(401).send({ success: false, error: verified.error });
        }
        const { attemptId, questionIds: questionIdsJson, correctAnswers: correctAnswersJson, iat, } = verified.data;
        const questionIds = JSON.parse(questionIdsJson);
        const correctAnswers = JSON.parse(correctAnswersJson);
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
                if (!Number.isInteger(idx) || idx < 0 || idx >= questionIds.length)
                    continue;
                try {
                    const rec = JSON.parse(blob);
                    effectiveAnswers[idx] = rec.answer;
                    if (typeof rec.timeTaken === "number")
                        effectiveTimings[idx] = rec.timeTaken * 1000;
                }
                catch {
                    // Unparseable record: leave the client value in place for this index.
                }
            }
        }
        // One attempt, one submission.
        const submitLock = await fastify.redis.set(`dailysubmitted:${attemptId}`, "1", "EX", 60 * 60, "NX");
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
            logger.warn({ attemptId, reason: dailyTiming.reason, flags: dailyTiming.flags }, "Daily quiz submission rejected by timing validation");
            return reply.code(400).send({ success: false, error: dailyTiming.reason });
        }
        const dailyBehavior = behavior ? scoreBehavior(behavior) : null;
        if (dailyTiming.flags.length || dailyBehavior?.suspicious) {
            logger.warn({
                attemptId,
                timingFlags: dailyTiming.flags,
                behaviorScore: dailyBehavior?.score,
                behaviorFlags: dailyBehavior?.flags,
            }, "Daily quiz attempt flagged for review");
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
            if (isCorrect)
                correctCount++;
            combo = isCorrect ? combo + 1 : 0;
            // Validated/clamped seconds, not the raw client value.
            const timeTakenSec = dailyTiming.effectiveTimings[i];
            const speedBonus = isCorrect && timeTakenSec < 5 && dailyTiming.speedCreditFactor >= 1 ? 5 : 0;
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
            await enqueuePayout({
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
