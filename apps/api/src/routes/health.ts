import { FastifyInstance } from "fastify";

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/", async (request, reply) => {
    const startedAt = process.uptime();
    let db = false;
    let redis = false;

    try {
      await fastify.prisma.$queryRaw`SELECT 1`;
      db = true;
    } catch {
      db = false;
    }

    try {
      const pong = await fastify.redis.ping();
      redis = pong === "PONG";
    } catch {
      redis = false;
    }

    return reply.send({
      status: db && redis ? "ok" : "degraded",
      db,
      redis,
      uptimeSeconds: Math.round(startedAt),
      timestamp: new Date().toISOString(),
    });
  });
}
