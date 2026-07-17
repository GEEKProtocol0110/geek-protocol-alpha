import { z } from "zod";
const SubmitSchema = z.object({
    question: z.string().min(10).max(500),
    option1: z.string().min(1).max(200),
    option2: z.string().min(1).max(200),
    option3: z.string().min(1).max(200),
    option4: z.string().min(1).max(200),
    correctOption: z.number().int().min(1).max(4),
    difficulty: z.enum(["easy", "medium", "hard"]),
    topicId: z.number().int().positive(),
    subtopic: z.string().max(100).optional(),
    funFact: z.string().max(500).optional(),
    sourceLink: z.string().url().optional().or(z.literal("")),
});
const ReviewSchema = z.object({
    questionId: z.number().int().positive(),
    action: z.enum(["approve", "reject"]),
    detailedFeedback: z.string().max(500).optional(),
});
export async function cceRoutes(fastify) {
    // GET /api/cce/dashboard — creator stats for the current user
    fastify.get("/dashboard", { preHandler: fastify.authenticate }, async (req, reply) => {
        const userId = req.jwtUser.userId;
        const user = await fastify.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: {
                level: true,
                questionsSubmitted: true,
                questionsApproved: true,
                questionsRejected: true,
                reviewsCompleted: true,
                reviewAccuracy: true,
                totalEarnedGeek: true,
                geekBalance: true,
            },
        });
        if (user.level < 10) {
            return reply.code(403).send({ error: "CCE requires Level 10 or higher." });
        }
        // Top 5 earning questions
        const topQuestions = await fastify.prisma.question.findMany({
            where: { createdBy: userId },
            orderBy: { totalEarned: "desc" },
            take: 5,
            select: {
                id: true,
                question: true,
                totalEarned: true,
                totalServes: true,
                status: true,
                topic: { select: { name: true } },
            },
        });
        // Is there a question in the review queue NOT created by this user?
        const reviewAvailable = await fastify.prisma.reviewQueue.findFirst({
            where: { question: { createdBy: { not: userId }, status: "pending" } },
            select: { id: true },
        });
        const approvalRate = user.questionsSubmitted > 0
            ? Math.round((user.questionsApproved / user.questionsSubmitted) * 100)
            : 0;
        return reply.send({
            data: {
                level: user.level,
                questionsSubmitted: user.questionsSubmitted,
                questionsApproved: user.questionsApproved,
                questionsRejected: user.questionsRejected,
                approvalRate,
                reviewsCompleted: user.reviewsCompleted,
                reviewAccuracy: Math.round(user.reviewAccuracy),
                totalEarnedGeek: user.totalEarnedGeek,
                geekBalance: user.geekBalance,
                topQuestions,
                reviewAvailable: !!reviewAvailable,
            },
        });
    });
    // GET /api/cce/topics — list of topics
    fastify.get("/topics", { preHandler: fastify.authenticate }, async (_req, reply) => {
        const topics = await fastify.prisma.topic.findMany({
            where: { isActive: true },
            select: { id: true, name: true, icon: true },
            orderBy: { name: "asc" },
        });
        return reply.send({ data: topics });
    });
    // POST /api/cce/submit — submit a new question
    fastify.post("/submit", { preHandler: fastify.authenticate }, async (req, reply) => {
        const userId = req.jwtUser.userId;
        const user = await fastify.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { level: true },
        });
        if (user.level < 10)
            return reply.code(403).send({ error: "CCE requires Level 10." });
        const parse = SubmitSchema.safeParse(req.body);
        if (!parse.success)
            return reply.code(400).send({ error: parse.error.flatten() });
        const d = parse.data;
        const question = await fastify.prisma.question.create({
            data: {
                question: d.question,
                option1: d.option1,
                option2: d.option2,
                option3: d.option3,
                option4: d.option4,
                correctOption: d.correctOption,
                difficulty: d.difficulty,
                topicId: d.topicId,
                subtopic: d.subtopic,
                funFact: d.funFact,
                sourceLink: d.sourceLink || null,
                createdBy: userId,
                status: "pending",
            },
        });
        // Add to review queue
        await fastify.prisma.reviewQueue.create({ data: { questionId: question.id } });
        // Increment user counter
        await fastify.prisma.user.update({
            where: { id: userId },
            data: { questionsSubmitted: { increment: 1 } },
        });
        return reply.code(201).send({ data: question });
    });
    // GET /api/cce/review/next — get next question to review
    fastify.get("/review/next", { preHandler: fastify.authenticate }, async (req, reply) => {
        const userId = req.jwtUser.userId;
        const user = await fastify.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { level: true },
        });
        if (user.level < 10)
            return reply.code(403).send({ error: "CCE requires Level 10." });
        // Already reviewed by this user?
        const reviewed = await fastify.prisma.questionValidation.findMany({
            where: { validatorId: userId },
            select: { questionId: true },
        });
        const reviewedIds = reviewed.map((r) => r.questionId);
        const entry = await fastify.prisma.reviewQueue.findFirst({
            where: {
                question: {
                    status: "pending",
                    createdBy: { not: userId },
                    ...(reviewedIds.length ? { id: { notIn: reviewedIds } } : {}),
                },
            },
            orderBy: { priority: "desc" },
            include: {
                question: {
                    include: {
                        topic: { select: { name: true } },
                    },
                },
            },
        });
        if (!entry)
            return reply.send({ data: null });
        // Hide correct answer from reviewer
        const { correctOption: _hidden, ...safeQ } = entry.question;
        void _hidden;
        return reply.send({ data: safeQ });
    });
    // POST /api/cce/review — submit a review decision
    fastify.post("/review", { preHandler: fastify.authenticate }, async (req, reply) => {
        const userId = req.jwtUser.userId;
        const user = await fastify.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { level: true, reviewsCompleted: true, reviewAccuracy: true },
        });
        if (user.level < 10)
            return reply.code(403).send({ error: "CCE requires Level 10." });
        const parse = ReviewSchema.safeParse(req.body);
        if (!parse.success)
            return reply.code(400).send({ error: parse.error.flatten() });
        const { questionId, action, detailedFeedback } = parse.data;
        const question = await fastify.prisma.question.findUnique({ where: { id: questionId } });
        if (!question)
            return reply.code(404).send({ error: "Question not found" });
        if (question.createdBy === userId)
            return reply.code(403).send({ error: "Cannot review own question" });
        if (question.status !== "pending")
            return reply.code(409).send({ error: "Question already reviewed" });
        // Check not double-reviewing
        const already = await fastify.prisma.questionValidation.findFirst({
            where: { questionId, validatorId: userId },
        });
        if (already)
            return reply.code(409).send({ error: "Already reviewed this question" });
        const geekReward = 0.1;
        await fastify.prisma.questionValidation.create({
            data: {
                questionId,
                validatorId: userId,
                action,
                geekAwarded: geekReward,
                detailedFeedback: detailedFeedback || null,
            },
        });
        // Update question vote counts
        const updatedQ = await fastify.prisma.question.update({
            where: { id: questionId },
            data: {
                approvalsCount: action === "approve" ? { increment: 1 } : undefined,
                rejectionsCount: action === "reject" ? { increment: 1 } : undefined,
                totalReviews: { increment: 1 },
            },
        });
        // Auto-approve/reject when threshold met (3 votes)
        let finalStatus = updatedQ.status;
        if (updatedQ.approvalsCount >= 3) {
            await fastify.prisma.question.update({
                where: { id: questionId },
                data: { status: "approved", dateApproved: new Date() },
            });
            await fastify.prisma.reviewQueue.deleteMany({ where: { questionId } });
            // Reward creator
            if (updatedQ.createdBy) {
                await fastify.prisma.user.update({
                    where: { id: updatedQ.createdBy },
                    data: { questionsApproved: { increment: 1 } },
                });
            }
            finalStatus = "approved";
        }
        else if (updatedQ.rejectionsCount >= 3) {
            await fastify.prisma.question.update({
                where: { id: questionId },
                data: { status: "rejected" },
            });
            await fastify.prisma.reviewQueue.deleteMany({ where: { questionId } });
            if (updatedQ.createdBy) {
                await fastify.prisma.user.update({
                    where: { id: updatedQ.createdBy },
                    data: { questionsRejected: { increment: 1 } },
                });
            }
            finalStatus = "rejected";
        }
        // Reward reviewer
        await fastify.prisma.user.update({
            where: { id: userId },
            data: {
                reviewsCompleted: { increment: 1 },
                geekBalance: { increment: geekReward },
                totalEarnedGeek: { increment: geekReward },
            },
        });
        return reply.send({ data: { status: finalStatus, geekAwarded: geekReward } });
    });
    // GET /api/cce/my-questions — paginated list of user's submitted questions
    fastify.get("/my-questions", { preHandler: fastify.authenticate }, async (req, reply) => {
        const userId = req.jwtUser.userId;
        const { page = "1", status } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const take = 10;
        const skip = (pageNum - 1) * take;
        const where = { createdBy: userId };
        if (status && ["pending", "approved", "rejected"].includes(status))
            where.status = status;
        const [questions, total] = await Promise.all([
            fastify.prisma.question.findMany({
                where,
                orderBy: { dateCreated: "desc" },
                skip,
                take,
                select: {
                    id: true,
                    question: true,
                    status: true,
                    difficulty: true,
                    dateCreated: true,
                    totalServes: true,
                    totalEarned: true,
                    approvalsCount: true,
                    rejectionsCount: true,
                    topic: { select: { name: true } },
                },
            }),
            fastify.prisma.question.count({ where }),
        ]);
        return reply.send({ data: questions, total, page: pageNum, pages: Math.ceil(total / take) });
    });
    // GET /api/cce/leaderboard — top creators by earnings
    fastify.get("/leaderboard", { preHandler: fastify.authenticate }, async (_req, reply) => {
        const creators = await fastify.prisma.user.findMany({
            where: { questionsApproved: { gt: 0 } },
            orderBy: { totalEarnedGeek: "desc" },
            take: 50,
            select: {
                id: true,
                username: true,
                level: true,
                questionsApproved: true,
                questionsSubmitted: true,
                totalEarnedGeek: true,
                reviewsCompleted: true,
                reviewAccuracy: true,
            },
        });
        return reply.send({
            data: creators.map((u, i) => ({
                rank: i + 1,
                ...u,
                approvalRate: u.questionsSubmitted > 0
                    ? Math.round((u.questionsApproved / u.questionsSubmitted) * 100)
                    : 0,
            })),
        });
    });
}
