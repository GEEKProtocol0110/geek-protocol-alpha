/**
 * Circuit breakers (ECONOMY.md §18).
 *
 * A breaker is a named switch that stops one class of economic activity.
 * Gameplay never stops — XP keeps flowing — but GEEK does.
 *
 * A tripped breaker NEVER auto-recovers into paying out. Whatever condition
 * tripped it (a drained reserve, a dead worker, duplicate payments) needs a
 * human to confirm it is genuinely resolved. Auto-reset is how a transient
 * blip turns into a slow leak nobody notices.
 */

import type { PrismaClient } from "@prisma/client";
import type { Tx } from "./ledger";
import { logger } from "../../lib/logger";

export const BREAKERS = [
  "ALL",
  "REWARDS",
  "GAUNTLET",
  "DAILY_QUIZ",
  "CCE",
  "WITHDRAWALS",
  "PURCHASES",
  "MARKETPLACE",
] as const;
export type BreakerName = (typeof BREAKERS)[number];

export type BreakerState = "OPEN" | "TRIPPED" | "MANUAL_PAUSE";

const CACHE_TTL_MS = 5_000;
let cache: { states: Record<string, BreakerState>; at: number } | null = null;

export function invalidateBreakerCache(): void {
  cache = null;
}

export async function getBreakerStates(
  prisma: PrismaClient
): Promise<Record<string, BreakerState>> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.states;

  const states: Record<string, BreakerState> = {};
  for (const name of BREAKERS) states[name] = "OPEN";

  try {
    const rows = await prisma.circuitBreaker.findMany();
    for (const row of rows) states[row.name] = row.state as BreakerState;
  } catch (err) {
    // If we cannot read the breakers we do not know whether it is safe to pay.
    // Fail closed: report everything tripped rather than paying blind.
    logger.error({ err }, "economy.breaker_read_failed — failing closed");
    for (const name of BREAKERS) states[name] = "TRIPPED";
    return states;
  }

  cache = { states, at: now };
  return states;
}

/**
 * Is this activity permitted right now? `ALL` gates everything, so a single
 * switch can pause the entire economy.
 */
export async function isBreakerOpen(
  prisma: PrismaClient,
  name: BreakerName
): Promise<boolean> {
  const states = await getBreakerStates(prisma);
  if (states.ALL !== "OPEN") return false;
  if (name !== "ALL" && name !== "REWARDS" && states.REWARDS !== "OPEN") {
    // REWARDS is the parent of every reward-granting breaker.
    if (isRewardBreaker(name)) return false;
  }
  return (states[name] ?? "OPEN") === "OPEN";
}

function isRewardBreaker(name: BreakerName): boolean {
  return name === "GAUNTLET" || name === "DAILY_QUIZ" || name === "CCE";
}

export async function tripBreaker(
  prisma: PrismaClient | Tx,
  name: BreakerName,
  reason: string,
  by = "system"
): Promise<void> {
  await prisma.circuitBreaker.upsert({
    where: { name },
    create: { name, state: "TRIPPED", reason, trippedAt: new Date(), trippedBy: by },
    update: { state: "TRIPPED", reason, trippedAt: new Date(), trippedBy: by },
  });
  invalidateBreakerCache();
  logger.error({ breaker: name, reason, by }, "economy.breaker_tripped");

  await prisma.economyAlert.create({
    data: {
      severity: "CRITICAL",
      code: `BREAKER_${name}`,
      message: `Circuit breaker ${name} tripped: ${reason}`,
      metadata: { breaker: name, by },
    },
  });
}

/** Admin-only pause. Distinguished from an automatic trip in the audit trail. */
export async function pauseBreaker(
  prisma: PrismaClient,
  name: BreakerName,
  reason: string,
  by: string
): Promise<void> {
  await prisma.circuitBreaker.upsert({
    where: { name },
    create: { name, state: "MANUAL_PAUSE", reason, trippedAt: new Date(), trippedBy: by },
    update: { state: "MANUAL_PAUSE", reason, trippedAt: new Date(), trippedBy: by },
  });
  invalidateBreakerCache();
  logger.warn({ breaker: name, reason, by }, "economy.breaker_paused");
}

/** Explicit human reset. The only way out of TRIPPED or MANUAL_PAUSE. */
export async function resetBreaker(
  prisma: PrismaClient,
  name: BreakerName,
  by: string
): Promise<void> {
  await prisma.circuitBreaker.upsert({
    where: { name },
    create: { name, state: "OPEN", resetAt: new Date(), resetBy: by },
    update: { state: "OPEN", reason: null, resetAt: new Date(), resetBy: by },
  });
  invalidateBreakerCache();
  logger.warn({ breaker: name, by }, "economy.breaker_reset");
}

export async function ensureBreakersExist(prisma: PrismaClient): Promise<void> {
  for (const name of BREAKERS) {
    await prisma.circuitBreaker.upsert({
      where: { name },
      create: { name, state: "OPEN" },
      update: {},
    });
  }
  invalidateBreakerCache();
}

// ---------------------------------------------------------------------------
// Worker heartbeat — the "is anything actually processing?" signal
// ---------------------------------------------------------------------------

const HEARTBEAT_KEY = "economy:worker:heartbeat";

export interface RedisLike {
  set(key: string, value: string, mode: "EX", seconds: number): Promise<unknown>;
  get(key: string): Promise<string | null>;
}

export async function recordWorkerHeartbeat(redis: RedisLike): Promise<void> {
  await redis.set(HEARTBEAT_KEY, String(Date.now()), "EX", 600);
}

/** Seconds since the payout worker last checked in, or null if never. */
export async function workerHeartbeatAgeSeconds(redis: RedisLike): Promise<number | null> {
  const raw = await redis.get(HEARTBEAT_KEY);
  if (!raw) return null;
  const ts = Number(raw);
  if (!Number.isFinite(ts)) return null;
  return Math.floor((Date.now() - ts) / 1000);
}
