import { payoutQueueDepths } from "../lib/payoutQueue";
export async function healthRoutes(fastify) {
    // Per-lane payout backlog. A single hot lane here means the shard key is
    // skewed; a rising totalWaiting across all lanes means the workers are down
    // or PAYOUT_CONCURRENCY is too low for current volume.
    fastify.get("/payouts", async (_request, reply) => {
        try {
            return reply.send({ status: "ok", ...(await payoutQueueDepths()) });
        }
        catch (err) {
            return reply.code(503).send({ status: "unavailable", error: String(err) });
        }
    });
    fastify.get("/", async (request, reply) => {
        const startedAt = process.uptime();
        let db = false;
        let redis = false;
        try {
            await fastify.prisma.$queryRaw `SELECT 1`;
            db = true;
        }
        catch {
            db = false;
        }
        try {
            const pong = await fastify.redis.ping();
            redis = pong === "PONG";
        }
        catch {
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
