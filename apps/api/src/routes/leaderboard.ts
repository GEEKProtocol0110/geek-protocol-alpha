import { FastifyInstance } from "fastify";

export async function leaderboardRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { type?: string; limit?: string } }>("/", async (request, reply) => {
    // TODO: Implement leaderboard
    return reply.send({
      success: false,
      error: "Not implemented",
    });
  });
}
