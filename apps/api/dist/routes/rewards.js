import { RewardLookupParamsSchema, RewardAttemptParamsSchema } from "@geek/shared";
import { ZodError } from "zod";
function serializeReward(reward) {
    return {
        id: reward.id,
        attemptId: reward.attemptId,
        userId: reward.userId,
        amount: reward.amount.toString(),
        status: reward.status,
        txid: reward.txid,
        error: reward.error,
        createdAt: reward.createdAt.toISOString(),
        confirmedAt: reward.confirmedAt ? reward.confirmedAt.toISOString() : null,
    };
}
export async function rewardRoutes(fastify) {
    fastify.get("/user/:userId", async (request, reply) => {
        try {
            const { userId } = RewardLookupParamsSchema.parse(request.params);
            const rewards = await fastify.prisma.reward.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                take: 100,
            });
            return reply.send({ success: true, data: rewards.map(serializeReward) });
        }
        catch (err) {
            const status = err instanceof ZodError ? 400 : 500;
            const message = status === 400 ? "Invalid user id" : "Failed to fetch rewards";
            request.log.error({ err }, "rewards.user_fetch_failed");
            return reply.code(status).send({ success: false, error: message });
        }
    });
    fastify.get("/:attemptId", async (request, reply) => {
        try {
            const { attemptId } = RewardAttemptParamsSchema.parse(request.params);
            const reward = await fastify.prisma.reward.findUnique({ where: { attemptId } });
            if (!reward) {
                return reply.code(404).send({ success: false, error: "Reward not found" });
            }
            return reply.send({ success: true, data: serializeReward(reward) });
        }
        catch (err) {
            const status = err instanceof ZodError ? 400 : 500;
            const message = status === 400 ? "Invalid attempt id" : "Failed to fetch reward";
            request.log.error({ err }, "rewards.attempt_fetch_failed");
            return reply.code(status).send({ success: false, error: message });
        }
    });
}
