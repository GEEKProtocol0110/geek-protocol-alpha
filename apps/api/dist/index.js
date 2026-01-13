import Fastify from "fastify";
import fastifyHelmet from "@fastify/helmet";
import fastifyCors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { logger } from "./lib/logger";
import { authRoutes } from "./routes/auth";
import { quizRoutes } from "./routes/quiz";
import { rewardRoutes } from "./routes/rewards";
import { leaderboardRoutes } from "./routes/leaderboard";
import { adminRoutes } from "./routes/admin";
import { healthRoutes } from "./routes/health";
import { healthWorkerRoutes } from "./routes/health-worker";
const prisma = new PrismaClient();
const redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
});
const fastify = Fastify({
    logger: true,
});
// Register plugins
fastify.register(fastifyHelmet);
fastify.register(fastifyCors, {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
});
fastify.register(fastifyCookie);
fastify.decorate("prisma", prisma);
fastify.decorate("redis", redis);
// Health check (full DB + Redis)
fastify.register(healthRoutes, { prefix: "/health" });
fastify.register(healthWorkerRoutes, { prefix: "/health/worker" });
// Register routes
fastify.register(authRoutes, { prefix: "/api/auth" });
fastify.register(quizRoutes, { prefix: "/api/quiz" });
fastify.register(rewardRoutes, { prefix: "/api/rewards" });
fastify.register(leaderboardRoutes, { prefix: "/api/leaderboard" });
fastify.register(adminRoutes, { prefix: "/api/admin" });
// Graceful shutdown
const signals = ["SIGINT", "SIGTERM"];
signals.forEach((signal) => {
    process.on(signal, async () => {
        logger.info(`Received ${signal}, shutting down gracefully...`);
        await fastify.close();
        await prisma.$disconnect();
        await redis.quit();
        process.exit(0);
    });
});
// Start server
const start = async () => {
    try {
        const port = parseInt(process.env.PORT || "3002");
        const host = process.env.HOST || "0.0.0.0";
        await fastify.listen({ port, host });
        logger.info(`Server running at http://${host}:${port}`);
    }
    catch (err) {
        logger.error(err);
        process.exit(1);
    }
};
start();
