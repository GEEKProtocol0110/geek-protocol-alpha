/**
 * Economy background worker.
 *
 * Three jobs, on independent timers:
 *
 *   1. CLEARING  — move matured, unflagged pending credits into available.
 *   2. MONITOR   — evaluate circuit breaker conditions and trip what needs it.
 *   3. HEARTBEAT — publish a liveness signal, so the ALL breaker can trip when
 *                  this process dies. A dead worker means pending rewards stop
 *                  clearing and burns stop settling; the economy should notice.
 *
 * Run alongside the payout worker: `npm run start:economy-worker`.
 */

import { assertProductionConfig } from "../lib/config";
assertProductionConfig();

import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { logger } from "../lib/logger";
import { economyService } from "../services/economy/service";
import { evaluateCircuitBreakers } from "../services/economy/treasury";
import { recordWorkerHeartbeat } from "../services/economy/breakers";
import { ensureEconomyBootstrapped } from "../services/economy/bootstrap";
import { fromAtomic } from "../services/economy/units";

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const CLEARING_INTERVAL_MS = Number(process.env.ECONOMY_CLEARING_INTERVAL_MS || 60_000);
const MONITOR_INTERVAL_MS = Number(process.env.ECONOMY_MONITOR_INTERVAL_MS || 300_000);
const HEARTBEAT_INTERVAL_MS = Number(process.env.ECONOMY_HEARTBEAT_INTERVAL_MS || 30_000);
const CLEARING_BATCH = Number(process.env.ECONOMY_CLEARING_BATCH || 500);

const economy = economyService(prisma);

/**
 * Only one instance should clear at a time — two workers clearing the same
 * batch would each be safe individually (the idempotency key stops a double
 * credit), but the lock keeps the logs and the load sane.
 */
async function withLock(name: string, ttlSeconds: number, fn: () => Promise<void>): Promise<void> {
  const key = `economy:lock:${name}`;
  const acquired = await redis.set(key, String(process.pid), "EX", ttlSeconds, "NX");
  if (!acquired) return;
  try {
    await fn();
  } finally {
    await redis.del(key);
  }
}

async function runClearing(): Promise<void> {
  await withLock("clearing", 300, async () => {
    const result = await economy.clearMaturedPending(CLEARING_BATCH);
    if (result.cleared > 0) {
      logger.info(
        { cleared: result.cleared, amount: fromAtomic(result.amount) },
        "economy.pending_cleared"
      );
    }
  });
}

async function runMonitor(): Promise<void> {
  await withLock("monitor", 600, async () => {
    const tripped = await evaluateCircuitBreakers(prisma, redis);
    if (tripped.length) {
      logger.error({ tripped }, "economy.breakers_tripped_by_monitor");
    }
  });
}

async function runHeartbeat(): Promise<void> {
  await recordWorkerHeartbeat(redis);
}

/** Wrap a periodic task so one failure never kills the timer. */
function every(ms: number, name: string, fn: () => Promise<void>): NodeJS.Timeout {
  const tick = async () => {
    try {
      await fn();
    } catch (err) {
      logger.error({ err, task: name }, "economy.worker_task_failed");
    }
  };
  void tick();
  return setInterval(tick, ms);
}

async function main() {
  await prisma.$connect();
  await ensureEconomyBootstrapped(prisma);

  const timers = [
    every(HEARTBEAT_INTERVAL_MS, "heartbeat", runHeartbeat),
    every(CLEARING_INTERVAL_MS, "clearing", runClearing),
    every(MONITOR_INTERVAL_MS, "monitor", runMonitor),
  ];

  logger.info(
    {
      clearingIntervalMs: CLEARING_INTERVAL_MS,
      monitorIntervalMs: MONITOR_INTERVAL_MS,
      heartbeatIntervalMs: HEARTBEAT_INTERVAL_MS,
    },
    "Economy worker started"
  );

  const shutdown = async () => {
    logger.info("Economy worker shutting down...");
    for (const t of timers) clearInterval(t);
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  logger.error({ err }, "Economy worker failed to start");
  process.exit(1);
});
