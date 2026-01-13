import { AdminAttemptsQuerySchema, AdminRewardsQuerySchema, AdminQuestionImportRequestSchema, } from "@geek/shared";
import { ZodError } from "zod";
export async function adminRoutes(fastify) {
    // Attempts listing with basic pagination and filters
    fastify.get("/attempts", async (request, reply) => {
        try {
            const { limit, offset, userId, wallet } = AdminAttemptsQuerySchema.parse(request.query);
            const take = limit;
            const skip = offset;
            const where = {};
            if (userId)
                where.userId = userId;
            if (wallet)
                where.user = { walletAddress: wallet };
            const items = await fastify.prisma.attempt.findMany({
                where,
                orderBy: { finishedAt: "desc" },
                take,
                skip,
                include: {
                    user: { select: { walletAddress: true, id: true } },
                    reward: { select: { status: true, amount: true, txid: true, id: true } },
                },
            });
            const data = items.map((a) => ({
                id: a.id,
                userId: a.userId,
                walletAddress: a.user.walletAddress,
                category: a.category,
                score: a.score,
                scorePct: a.scorePct,
                timeSeconds: a.timeSeconds,
                finishedAt: a.finishedAt,
                flags: a.flags,
                reward: a.reward
                    ? {
                        id: a.reward.id,
                        status: a.reward.status,
                        amount: Number(a.reward.amount),
                        txid: a.reward.txid || null,
                    }
                    : null,
            }));
            return reply.send({ success: true, data });
        }
        catch (err) {
            request.log.error({ err }, "admin.attempts_list_failed");
            return reply.code(500).send({ success: false, error: "Failed to list attempts" });
        }
    });
    // Rewards listing with status filter
    fastify.get("/rewards", async (request, reply) => {
        try {
            const { limit, offset, status, userId, wallet } = AdminRewardsQuerySchema.parse(request.query);
            const take = limit;
            const skip = offset;
            const where = {};
            if (status)
                where.status = status;
            if (userId)
                where.userId = userId;
            if (wallet)
                where.user = { walletAddress: wallet };
            const items = await fastify.prisma.reward.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take,
                skip,
                include: {
                    user: { select: { walletAddress: true, id: true } },
                    attempt: { select: { id: true, score: true, scorePct: true, finishedAt: true } },
                },
            });
            const data = items.map((r) => ({
                id: r.id,
                attemptId: r.attemptId,
                userId: r.userId,
                walletAddress: r.user.walletAddress,
                amount: Number(r.amount),
                status: r.status,
                txid: r.txid || null,
                error: r.error || null,
                createdAt: r.createdAt,
                confirmedAt: r.confirmedAt || null,
                attempt: r.attempt,
            }));
            return reply.send({ success: true, data });
        }
        catch (err) {
            request.log.error({ err }, "admin.rewards_list_failed");
            return reply.code(500).send({ success: false, error: "Failed to list rewards" });
        }
    });
    // Bulk import questions (admin-only manual tool)
    fastify.post("/questions/import", async (request, reply) => {
        try {
            const rawBody = request.body;
            const normalized = Array.isArray(rawBody)
                ? { questions: rawBody }
                : typeof rawBody === "object" && rawBody !== null
                    ? rawBody
                    : undefined;
            const { questions } = AdminQuestionImportRequestSchema.parse(normalized);
            const created = await fastify.prisma.$transaction(questions.map((q) => fastify.prisma.question.create({
                data: {
                    category: q.category,
                    prompt: q.prompt,
                    options: q.options,
                    correctIndex: q.correctIndex,
                    difficulty: q.difficulty,
                    tags: q.tags,
                    version: q.version,
                    active: q.active,
                },
            })));
            return reply.send({ success: true, data: { created: created.length } });
        }
        catch (err) {
            request.log.error({ err }, "admin.question_import_failed");
            const statusCode = err instanceof ZodError ? 400 : 500;
            const errorMessage = statusCode === 400 ? "Invalid question payload" : "Failed to import questions";
            return reply.code(statusCode).send({ success: false, error: errorMessage });
        }
    });
}
