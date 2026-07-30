import { z } from "zod";
import { logger } from "../lib/logger";
const BulkQuestionSchema = z.object({
    category: z.string().min(1),
    question: z.string().min(1),
    options: z.array(z.string().min(1)).length(4),
    correctIndex: z.number().int().min(0).max(3),
    difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
    funFact: z.string().optional(),
    sourceLink: z.string().optional(),
    subtopic: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
    yearReleased: z.number().int().optional(),
});
const BulkImportSchema = z.object({
    questions: z.array(BulkQuestionSchema).min(1).max(5000),
});
export async function adminRoutes(fastify) {
    async function requireAdmin(userId) {
        const user = await fastify.prisma.user.findUnique({ where: { id: userId } });
        return user?.isAdmin ? user : null;
    }
    // GET /api/admin/questions/topics - List topics with question counts (admin only)
    fastify.get("/questions/topics", { preHandler: fastify.authenticate }, async (req, reply) => {
        const admin = await requireAdmin(req.jwtUser.userId);
        if (!admin)
            return reply.code(403).send({ success: false, error: "Admin access required" });
        const topics = await fastify.prisma.topic.findMany({
            orderBy: { name: "asc" },
            include: { _count: { select: { questions: true } } },
        });
        return reply.send({
            success: true,
            data: topics.map((t) => ({
                id: t.id,
                name: t.name,
                isActive: t.isActive,
                questionCount: t._count.questions,
            })),
        });
    });
    // POST /api/admin/questions/bulk - Bulk-create questions from a JSON array (admin only)
    fastify.post("/questions/bulk", { preHandler: fastify.authenticate }, async (req, reply) => {
        const admin = await requireAdmin(req.jwtUser.userId);
        if (!admin)
            return reply.code(403).send({ success: false, error: "Admin access required" });
        const parse = BulkImportSchema.safeParse(req.body);
        if (!parse.success) {
            return reply.code(400).send({ success: false, error: parse.error.flatten() });
        }
        const { questions } = parse.data;
        const topics = await fastify.prisma.topic.findMany();
        const topicByName = new Map(topics.map((t) => [t.name.trim().toLowerCase(), t]));
        const validCategories = topics.map((t) => t.name);
        const toInsert = [];
        const failed = [];
        questions.forEach((q, index) => {
            const topic = topicByName.get(q.category.trim().toLowerCase());
            if (!topic) {
                failed.push({
                    index,
                    error: `Unknown category "${q.category}". Valid categories: ${validCategories.join(", ")}`,
                });
                return;
            }
            const trimmedOptions = q.options.map((o) => o.trim());
            const uniqueOptions = new Set(trimmedOptions.map((o) => o.toLowerCase()));
            if (uniqueOptions.size !== 4) {
                failed.push({ index, error: "Options must be 4 distinct, non-empty strings" });
                return;
            }
            toInsert.push({
                question: q.question.trim(),
                option1: trimmedOptions[0],
                option2: trimmedOptions[1],
                option3: trimmedOptions[2],
                option4: trimmedOptions[3],
                correctOption: q.correctIndex + 1,
                difficulty: q.difficulty,
                topicId: topic.id,
                createdBy: req.jwtUser.userId,
                approvedBy: req.jwtUser.userId,
                status: "approved",
                dateApproved: new Date(),
                subtopic: q.subtopic,
                sourceLink: q.sourceLink,
                funFact: q.funFact,
                topicTags: JSON.stringify(q.tags ?? []),
                yearReleased: q.yearReleased,
            });
        });
        let insertedCount = 0;
        if (toInsert.length) {
            const result = await fastify.prisma.question.createMany({ data: toInsert });
            insertedCount = result.count;
        }
        logger.info({ adminId: req.jwtUser.userId, requested: questions.length, inserted: insertedCount, failed: failed.length }, "Bulk question import");
        return reply.send({
            success: true,
            data: {
                requested: questions.length,
                inserted: insertedCount,
                failedCount: failed.length,
                failed,
            },
        });
    });
}
