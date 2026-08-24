// Validate configuration before anything opens a socket or signs a token.
// This throws in production rather than booting with a public dev secret.
import { assertProductionConfig, IS_PRODUCTION } from "./lib/config";
assertProductionConfig();

import Fastify from "fastify";
import fastifyHelmet from "@fastify/helmet";
import fastifyCors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import fastifyRateLimit from "@fastify/rate-limit";
import { PrismaClient, Prisma } from "@prisma/client";
import Redis from "ioredis";
import { logger } from "./lib/logger";
import authPlugin from "./middleware/auth";
import { authRoutes } from "./routes/auth";
import { quizRoutes } from "./routes/quiz";
import { rewardRoutes } from "./routes/rewards";
import { leaderboardRoutes } from "./routes/leaderboard";
import { adminRoutes } from "./routes/admin";
import { gauntletRoutes } from "./routes/gauntlet";
import { healthRoutes } from "./routes/health";
import { cceRoutes } from "./routes/cce";
import { stickerRoutes } from "./routes/stickers";
import { tokenRoutes } from "./routes/token";
import { purchaseRoutes } from "./routes/purchase";
import { withdrawalRoutes } from "./routes/withdrawal";
import { kycRoutes } from "./routes/kyc";
import { statsRoutes } from "./routes/stats";
import { economyRoutes } from "./routes/economy";
import { adminEconomyRoutes } from "./routes/adminEconomy";
import { closePayoutQueues } from "./lib/payoutQueue";
import { ensureEconomyBootstrapped } from "./services/economy/bootstrap";

// Decimal fields (geekBalance, totalEarnedGeek) serialize as strings by
// default; every consumer (frontend + this API's own routes) treats them
// as numbers, so normalize at the JSON boundary.
(Prisma.Decimal.prototype as unknown as { toJSON(): number }).toJSON = function (this: Prisma.Decimal) {
  return this.toNumber();
};

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Redis
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const fastify = Fastify({
  logger: process.env.NODE_ENV === "development",
  bodyLimit: 20 * 1024 * 1024, // 20MB - bulk question imports can run to thousands of rows
});

// Decorate fastify with prisma and redis
fastify.decorate("prisma", prisma);
fastify.decorate("redis", redis);

// Register plugins
fastify.register(fastifyHelmet);
fastify.register(fastifyCors, {
  origin: (origin, cb) => {
    const allowed = (process.env.FRONTEND_ORIGIN || "http://localhost:3000")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);

    // In production the allow-list is the whole rule. The previous logic also
    // waved through localhost, any RFC1918 address, and any request with no
    // Origin header — combined with `credentials: true` that let a page on any
    // LAN host drive an authenticated session.
    if (IS_PRODUCTION) {
      if (origin && allowed.includes(origin)) return cb(null, true);
      // No Origin header: not a browser CORS request (curl, health checks,
      // server-to-server). Allowed through without CORS headers.
      if (!origin) return cb(null, false);
      return cb(new Error("CORS: origin not allowed"), false);
    }

    // Development keeps the permissive behaviour so LAN device testing works.
    if (!origin) return cb(null, true);
    const url = new URL(origin);
    const lanIp = process.env.LAN_IP || "";
    if (
      allowed.includes(origin) ||
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      (lanIp && url.hostname === lanIp) ||
      /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(url.hostname)
    ) {
      return cb(null, true);
    }
    cb(new Error("CORS: origin not allowed"), false);
  },
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
      instance.register(gauntletRoutes, { prefix: "/gauntlet" });
      instance.register(cceRoutes, { prefix: "/cce" });
      instance.register(stickerRoutes, { prefix: "/stickers" });
      instance.register(tokenRoutes, { prefix: "/token" });
      instance.register(purchaseRoutes, { prefix: "/purchase" });
      instance.register(withdrawalRoutes, { prefix: "/wallet" });
      instance.register(kycRoutes, { prefix: "/kyc" });
      instance.register(statsRoutes, { prefix: "/stats" });
      instance.register(economyRoutes, { prefix: "/economy" });
      instance.register(adminEconomyRoutes, { prefix: "/admin/economy" });
    },
    { prefix: "/api" }
  );

// NOTE: this process deliberately does NOT run a payout worker.
// It previously started a Worker on "reward-processing" whose handler was an
// empty stub. BullMQ round-robins jobs across every worker listening to a queue,
// so that stub was consuming real payout jobs and marking them completed without
// ever sending tokens. Payouts are processed exclusively by
// src/workers/rewards.ts (`npm run start:worker`), which runs in its own process.

// Graceful shutdown
const shutdown = async () => {
  logger.info("Shutting down gracefully...");
  try {
    await fastify.close();
    await closePayoutQueues();
    await prisma.$disconnect();
    await redis.quit();
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

    console.log("Step 3: Bootstrapping economy...");
    // Treasury accounts, budgets, breakers and the runtime config row must
    // exist before the first request, or the first reward of a fresh deploy
    // fails on a missing treasury account.
    await ensureEconomyBootstrapped(prisma);
    logger.info("Economy bootstrapped");

    console.log("Step 4: Starting Fastify server...");
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
