/**
 * Public alpha telemetry for the landing page.
 *
 * Everything here is an aggregate over real rows — no seeded or illustrative
 * numbers. If the alpha is quiet the page will say so honestly; inventing
 * traffic on a site asking people to connect a wallet is exactly the kind of
 * thing that destroys the trust this endpoint exists to build.
 *
 * Cached briefly because it is unauthenticated and hit by every landing view.
 */
const CACHE_KEY = "public:alpha-stats";
const CACHE_TTL_SECONDS = 60;
export async function statsRoutes(fastify) {
    fastify.get("/alpha", async (_req, reply) => {
        try {
            const cached = await fastify.redis.get(CACHE_KEY);
            if (cached) {
                return reply.header("cache-control", "public, max-age=60").send(JSON.parse(cached));
            }
        }
        catch {
            // Cache is an optimisation; fall through to a live read.
        }
        const dayAgo = new Date(Date.now() - 24 * 3600000);
        const [players, activePlayersToday, quizAttempts, attemptsToday, approvedQuestions, pendingReview, totalReviews, gauntletRuns, rewardsConfirmed, topicCount, geekAgg,] = await Promise.all([
            fastify.prisma.user.count(),
            fastify.prisma.quizAttempt.findMany({
                where: { createdAt: { gte: dayAgo } },
                select: { userId: true },
                distinct: ["userId"],
            }),
            fastify.prisma.quizAttempt.count(),
            fastify.prisma.quizAttempt.count({ where: { createdAt: { gte: dayAgo } } }),
            fastify.prisma.question.count({ where: { status: "approved" } }),
            fastify.prisma.question.count({ where: { status: "pending" } }),
            fastify.prisma.questionValidation.count(),
            fastify.prisma.gauntletRun.count(),
            fastify.prisma.reward.count({ where: { status: "confirmed" } }),
            fastify.prisma.topic.count({ where: { isActive: true } }),
            fastify.prisma.user.aggregate({ _sum: { totalEarnedGeek: true } }),
        ]);
        const payload = {
            success: true,
            data: {
                players,
                activePlayersToday: activePlayersToday.length,
                quizAttempts,
                attemptsToday,
                approvedQuestions,
                pendingReview,
                totalReviews,
                gauntletRuns,
                rewardsConfirmed,
                topicCount,
                geekDistributed: Number(geekAgg._sum.totalEarnedGeek ?? 0),
                generatedAt: new Date().toISOString(),
            },
        };
        try {
            await fastify.redis.set(CACHE_KEY, JSON.stringify(payload), "EX", CACHE_TTL_SECONDS);
        }
        catch {
            // Non-fatal.
        }
        return reply.header("cache-control", "public, max-age=60").send(payload);
    });
}
