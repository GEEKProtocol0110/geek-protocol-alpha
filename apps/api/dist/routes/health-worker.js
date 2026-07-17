export async function healthWorkerRoutes(fastify) {
    fastify.get("/", async (request, reply) => {
        let heartbeatTs = null;
        let alive = false;
        try {
            const raw = await fastify.redis.get("worker:rewards:heartbeat");
            if (raw) {
                const parsed = JSON.parse(raw);
                heartbeatTs = parsed?.ts ?? null;
                alive = typeof heartbeatTs === "number" && Date.now() - heartbeatTs < 45000;
            }
        }
        catch {
            alive = false;
        }
        return reply.send({
            status: alive ? "ok" : "degraded",
            alive,
            lastHeartbeatMsAgo: heartbeatTs ? Date.now() - heartbeatTs : null,
            timestamp: new Date().toISOString(),
        });
    });
}
