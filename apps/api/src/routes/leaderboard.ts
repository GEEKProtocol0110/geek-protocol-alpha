import { FastifyInstance } from "fastify";

export async function leaderboardRoutes(fastify: FastifyInstance) {
  // Get top leaderboard by XP
  fastify.get<{ Querystring: { limit?: string } }>("/top", async (request, reply) => {
    try {
      const limit = Math.min(parseInt(request.query.limit || "100"), 500);

      const users = await fastify.prisma.user.findMany({
        orderBy: { xp: "desc" },
        take: limit,
        select: {
          id: true,
          walletAddress: true,
          xp: true,
          level: true,
          streak: true,
          createdAt: true,
        },
      });

      // Add rank
      const withRank = users.map((user, idx) => ({
        ...user,
        rank: idx + 1,
      }));

      return reply.send({ success: true, data: withRank });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ success: false, error: "Failed to fetch leaderboard" });
    }
  });

  // Get single user stats
  fastify.get<{ Params: { userId: string } }>("/user/:userId", async (request, reply) => {
    try {
      const { userId } = request.params;

      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        include: {
          attempts: {
            select: {
              id: true,
              score: true,
              scorePct: true,
              category: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });

      if (!user) {
        return reply.code(404).send({ success: false, error: "User not found" });
      }

      // Calculate stats
      const totalAttempts = user.attempts.length;
      const totalScore = user.attempts.reduce((sum, a) => sum + a.score, 0);
      const avgScore = totalAttempts > 0 ? totalScore / totalAttempts : 0;

      return reply.send({
        success: true,
        data: {
          id: user.id,
          walletAddress: user.walletAddress,
          xp: user.xp,
          level: user.level,
          streak: user.streak,
          totalAttempts,
          avgScore: Math.round(avgScore * 100) / 100,
          recentAttempts: user.attempts,
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ success: false, error: "Failed to fetch user stats" });
    }
  });
}
