import Fastify from "fastify";
import fastifyHelmet from "@fastify/helmet";
import fastifyCors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import fastifyRateLimit from "@fastify/rate-limit";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { logger } from "./lib/logger";
import authPlugin from "./middleware/auth";
import { authRoutes } from "./routes/auth";
import { quizRoutes } from "./routes/quiz";
import { rewardRoutes } from "./routes/rewards";
import { leaderboardRoutes } from "./routes/leaderboard";
import { adminRoutes } from "./routes/admin";
import { healthRoutes } from "./routes/health";
import { Worker } from "bullmq";

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Redis
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const fastify = Fastify({
  logger: process.env.NODE_ENV === "development",
});

// Decorate fastify with prisma and redis
fastify.decorate("prisma", prisma);
fastify.decorate("redis", redis);

// Register plugins
fastify.register(fastifyHelmet);
fastify.register(fastifyCors, {
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  credentials: true,
});
fastify.register(fastifyCookie, {
  secret: process.env.SECRET_KEY,
});

// Register auth decorator
fastify.register(authPlugin);

// Register Rate Limit
fastify.register(fastifyRateLimit, {
  global: true,
  max: 100,
  timeWindow: "15 minutes",
});

// Health check routes
fastify.register(healthRoutes, { prefix: "/health" });

// API Routes
fastify.register(
  async (instance) => {
    // Stricter rate limits for auth and payment routes
    instance.register(authRoutes, {
      prefix: "/auth",
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 minute",
        },
      },
    });

    instance.register(quizRoutes, { prefix: "/quiz" });
    instance.register(rewardRoutes, { prefix: "/rewards" });
    instance.register(leaderboardRoutes, { prefix: "/leaderboard" });
    instance.register(adminRoutes, { prefix: "/admin" });

    // Payment routes placeholder (stricter rate limit)
    instance.post("/payment/buy-geek", {
      config: {
        rateLimit: {
          max: 3,
          timeWindow: "1 minute",
        },
      },
      handler: async (request, reply) => {
        return { message: "Payment integration coming soon" };
      },
    });
  },
  { prefix: "/api" }
);

// Start BullMQ Worker for reward processing
const rewardWorker = new Worker(
  "reward-processing",
  async (job) => {
    logger.info({ jobId: job.id }, "Processing reward job");
    // Reward logic will be implemented in src/workers/rewards.ts
  },
  { connection: redis as any }
);

rewardWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Reward job completed");
});

rewardWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Reward job failed");
});

// Graceful shutdown
const shutdown = async () => {
  logger.info("Shutting down gracefully...");
  try {
    await fastify.close();
    await prisma.$disconnect();
    await redis.quit();
    await rewardWorker.close();
    logger.info("Shutdown complete");
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Error during shutdown");
    process.exit(1);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Start server
const start = async () => {
  try {
    console.log("Step 1: Connecting to PostgreSQL...");
    // Check database connection
    await prisma.$connect();
    logger.info("Connected to PostgreSQL via Prisma");

    console.log("Step 2: Waiting for Redis...");
    // Check redis connection
    await new Promise((resolve, reject) => {
      console.log("Adding Redis event listeners...");
      redis.on("ready", () => {
        console.log("Redis ready event fired!");
        resolve(undefined);
      });
      redis.on("error", (err) => {
        console.log("Redis error event fired!", err);
        reject(err);
      });
      // If already connected, resolve immediately
      if (redis.status === "ready") {
        console.log("Redis already ready!");
        resolve(undefined);
      }
    });
    logger.info("Connected to Redis");

    console.log("Step 3: Starting Fastify server...");
    const port = parseInt(process.env.PORT || "5000");
    const host = "0.0.0.0";
    await fastify.listen({ port, host });
    logger.info(`Server listening on port ${port}`);
  } catch (err) {
    logger.error({ err }, "Failed to start server");
    process.exit(1);
  }
};

start();
