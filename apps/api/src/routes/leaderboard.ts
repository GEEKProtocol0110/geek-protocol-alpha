import { FastifyInstance } from "fastify";

export async function leaderboardRoutes(fastify: FastifyInstance) {
  // GET /api/leaderboard/top?limit=50&sort=xp|points|streak
  fastify.get<{ Querystring: { limit?: string; sort?: string } }>("/top", async (request, reply) => {
    const limit = Math.min(parseInt(request.query.limit ?? "50", 10) || 50, 100);
    const sort = ["xp", "points", "currentStreak"].includes(request.query.sort ?? "")
      ? (request.query.sort as "xp" | "points" | "currentStreak")
      : "xp";

    const users = await fastify.prisma.user.findMany({
      orderBy: { [sort]: "desc" },
      take: limit,
      select: {
        id: true,
        username: true,
        walletAddress: true,
        xp: true,
        level: true,
        points: true,
        currentStreak: true,
        geekBalance: true,
        favoriteCharacter: true,
        dateCreated: true,
      },
    });

    return reply.send({
      success: true,
      data: users.map((u, i) => ({ ...u, rank: i + 1 })),
      updatedAt: new Date().toISOString(),
    });
  });

  // GET /api/leaderboard/user/:userId
  fastify.get<{ Params: { userId: string } }>("/user/:userId", async (request, reply) => {
    const userId = parseInt(request.params.userId, 10);
    if (isNaN(userId)) return reply.code(400).send({ error: "Invalid userId" });

    const user = await fastify.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        walletAddress: true,
        xp: true,
        level: true,
        points: true,
        currentStreak: true,
        longestStreak: true,
        geekBalance: true,
        favoriteCharacter: true,
        dateCreated: true,
        attempts: {
          select: { isCorrect: true, dateAttempted: true },
          orderBy: { dateAttempted: "desc" },
          take: 100,
        },
      },
    });

    if (!user) return reply.code(404).send({ error: "User not found" });

    const totalAttempts = user.attempts.length;
    const correct = user.attempts.filter((a) => a.isCorrect).length;

    // Get rank by XP
    const rank = await fastify.prisma.user.count({ where: { xp: { gt: user.xp } } });

    const { attempts, ...rest } = user;
    return reply.send({
      success: true,
      data: {
        ...rest,
        rank: rank + 1,
        totalAttempts,
        accuracy: totalAttempts > 0 ? Math.round((correct / totalAttempts) * 100) : 0,
      },
    });
  });
}
