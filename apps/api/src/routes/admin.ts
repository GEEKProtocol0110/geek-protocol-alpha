import { FastifyInstance } from "fastify";

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { flagged?: string } }>("/attempts", async (request, reply) => {
    // TODO: Implement admin attempts view
    return reply.send({
      success: false,
      error: "Not implemented",
    });
  });

  fastify.get<{ Querystring: { status?: string } }>("/rewards", async (request, reply) => {
    // TODO: Implement admin rewards view
    return reply.send({
      success: false,
      error: "Not implemented",
    });
  });

  fastify.post<{ Body: unknown }>("/questions/import", async (request, reply) => {
    // TODO: Implement question import
    return reply.send({
      success: false,
      error: "Not implemented",
    });
  });
}
