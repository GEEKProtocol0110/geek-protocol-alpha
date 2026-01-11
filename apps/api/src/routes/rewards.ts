import { FastifyInstance } from "fastify";

function serializeReward(reward: any) {
  return {
    ...reward,
    amount: reward.amount ? reward.amount.toString() : "0",
    createdAt: reward.createdAt instanceof Date ? reward.createdAt.toISOString() : reward.createdAt,
    confirmedAt:
      reward.confirmedAt instanceof Date ? reward.confirmedAt.toISOString() : reward.confirmedAt ?? null,
  };
}

export async function rewardRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { userId: string } }>("/user/:userId", async (request, reply) => {
    const { userId } = request.params;
    const rewards = await fastify.prisma.reward.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return reply.send({ success: true, data: rewards.map(serializeReward) });
  });

  fastify.get<{ Params: { attemptId: string } }>("/:attemptId", async (request, reply) => {
    const { attemptId } = request.params;
    const reward = await fastify.prisma.reward.findUnique({ where: { attemptId } });
    if (!reward) {
      return reply.code(404).send({ success: false, error: "Reward not found" });
    }
    return reply.send({ success: true, data: serializeReward(reward) });
  });
}
