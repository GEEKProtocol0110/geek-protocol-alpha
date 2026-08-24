/**
 * Reward budget engine (ECONOMY.md §11).
 *
 * A budget is a daily and monthly ceiling on how much GEEK a given reward
 * source may create. Consumption is recorded in the SAME transaction as the
 * reward, under a unique (budget, periodType, periodKey) row, so two concurrent
 * grants can never both spend the last of a budget.
 *
 * When a budget is exhausted the answer is a partial or zero grant — never an
 * unfunded reward. Gameplay continues in XP-only mode.
 */

import type { PrismaClient } from "@prisma/client";
import type { Tx } from "./ledger";
import { lockResource } from "./ledger";
import { toAtomic, toBigInt, toDecimal, clampPositive, minBig } from "./units";
import { getRules } from "./config";

export type BudgetName =
  | "DAILY_QUIZ"
  | "GAUNTLET"
  | "CCE_CREATOR"
  | "CCE_REVIEWER"
  | "TOURNAMENT"
  | "PROMOTION"
  | "REFERRAL"
  | "SEASONAL"
  | "ACHIEVEMENT";

/** UTC day key, e.g. "2026-08-17". Budgets reset at 00:00 UTC, never local. */
export function utcDayKey(at: Date = new Date()): string {
  return at.toISOString().slice(0, 10);
}

/** UTC calendar-month key, e.g. "2026-08". */
export function utcMonthKey(at: Date = new Date()): string {
  return at.toISOString().slice(0, 7);
}

/** UTC ISO week key, e.g. "2026-W33". Used by CCE weekly royalty caps. */
export function utcWeekKey(at: Date = new Date()): string {
  const d = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
  // ISO-8601: week 1 is the week containing the first Thursday.
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export interface BudgetConsumption {
  granted: bigint;
  exhausted: boolean;
  dailyRemaining: bigint;
  monthlyRemaining: bigint;
}

/**
 * Reserve up to `requested` atomic units from a budget.
 *
 * Returns how much was actually available. The caller must move only the
 * granted amount — this is the function that stops the protocol writing GEEK it
 * has not budgeted for.
 *
 * MUST be called inside the same transaction as the reward movement.
 */
export async function consumeBudget(
  tx: Tx,
  name: BudgetName | string,
  requested: bigint,
  at: Date = new Date()
): Promise<BudgetConsumption> {
  if (requested <= 0n) {
    return { granted: 0n, exhausted: false, dailyRemaining: 0n, monthlyRemaining: 0n };
  }

  // Serialize concurrent consumers of the same budget. Without this, two
  // transactions can each read "900 of 1000 used" and each grant 100.
  await lockResource(tx, `budget:${name}`);

  const budget = await tx.rewardBudget.findUnique({ where: { name } });
  if (!budget || !budget.enabled) {
    return { granted: 0n, exhausted: true, dailyRemaining: 0n, monthlyRemaining: 0n };
  }

  const dayKey = utcDayKey(at);
  const monthKey = utcMonthKey(at);

  const [dayPeriod, monthPeriod] = await Promise.all([
    getOrCreatePeriod(tx, budget.id, "DAY", dayKey),
    getOrCreatePeriod(tx, budget.id, "MONTH", monthKey),
  ]);

  const dailyLimit = toBigInt(budget.dailyLimitAtomic);
  const monthlyLimit = toBigInt(budget.monthlyLimitAtomic);
  const dailyRemaining = clampPositive(dailyLimit - toBigInt(dayPeriod.consumedAtomic));
  const monthlyRemaining = clampPositive(monthlyLimit - toBigInt(monthPeriod.consumedAtomic));

  const granted = minBig(requested, dailyRemaining, monthlyRemaining);

  if (granted > 0n) {
    await tx.rewardBudgetPeriod.update({
      where: { id: dayPeriod.id },
      data: { consumedAtomic: { increment: toDecimal(granted) }, grantCount: { increment: 1 } },
    });
    await tx.rewardBudgetPeriod.update({
      where: { id: monthPeriod.id },
      data: { consumedAtomic: { increment: toDecimal(granted) }, grantCount: { increment: 1 } },
    });
  }

  return {
    granted,
    exhausted: granted < requested,
    dailyRemaining: dailyRemaining - granted,
    monthlyRemaining: monthlyRemaining - granted,
  };
}

/**
 * Give budget back. Used when a reward movement is reversed, so a fraud
 * reversal does not permanently burn a slice of the day's budget.
 */
export async function releaseBudget(
  tx: Tx,
  name: string,
  amount: bigint,
  at: Date = new Date()
): Promise<void> {
  if (amount <= 0n) return;
  const budget = await tx.rewardBudget.findUnique({ where: { name } });
  if (!budget) return;

  for (const [periodType, periodKey] of [
    ["DAY", utcDayKey(at)],
    ["MONTH", utcMonthKey(at)],
  ] as const) {
    const period = await tx.rewardBudgetPeriod.findUnique({
      where: { budgetId_periodType_periodKey: { budgetId: budget.id, periodType, periodKey } },
    });
    if (!period) continue;
    // Never drive consumption below zero, whatever the reversal claims.
    const consumed = toBigInt(period.consumedAtomic);
    const next = consumed > amount ? consumed - amount : 0n;
    await tx.rewardBudgetPeriod.update({
      where: { id: period.id },
      data: { consumedAtomic: toDecimal(next) },
    });
  }
}

async function getOrCreatePeriod(tx: Tx, budgetId: number, periodType: string, periodKey: string) {
  const existing = await tx.rewardBudgetPeriod.findUnique({
    where: { budgetId_periodType_periodKey: { budgetId, periodType, periodKey } },
  });
  if (existing) return existing;

  // Two transactions can race to create the first row of a new UTC day; the
  // unique constraint makes the loser's upsert resolve to the winner's row.
  return tx.rewardBudgetPeriod.upsert({
    where: { budgetId_periodType_periodKey: { budgetId, periodType, periodKey } },
    create: { budgetId, periodType, periodKey },
    update: {},
  });
}

// ---------------------------------------------------------------------------
// Per-user caps
// ---------------------------------------------------------------------------

export interface UserCapResult {
  allowed: bigint;
  capped: boolean;
  remaining: bigint;
}

/**
 * Apply a per-user, per-period cap (daily quiz cap, CCE royalty caps).
 *
 * `limit <= 0` means "no cap configured", which returns the full request rather
 * than zero — an unset cap must never silently stop paying players.
 */
export async function consumeUserCap(
  tx: Tx,
  userId: number,
  capName: string,
  periodKey: string,
  requested: bigint,
  limit: bigint
): Promise<UserCapResult> {
  if (requested <= 0n) return { allowed: 0n, capped: false, remaining: 0n };
  if (limit <= 0n) return { allowed: requested, capped: false, remaining: 0n };

  await lockResource(tx, `cap:${userId}:${capName}:${periodKey}`);

  const row = await tx.userRewardCap.upsert({
    where: { userId_capName_periodKey: { userId, capName, periodKey } },
    create: { userId, capName, periodKey },
    update: {},
  });

  const consumed = toBigInt(row.consumedAtomic);
  const remaining = clampPositive(limit - consumed);
  const allowed = minBig(requested, remaining);

  if (allowed > 0n) {
    await tx.userRewardCap.update({
      where: { id: row.id },
      data: { consumedAtomic: { increment: toDecimal(allowed) }, count: { increment: 1 } },
    });
  }

  return { allowed, capped: allowed < requested, remaining: remaining - allowed };
}

/** Count-based limit (reviews per day, power-ups per day). */
export async function consumeUserCount(
  tx: Tx,
  userId: number,
  capName: string,
  periodKey: string,
  limit: number
): Promise<{ allowed: boolean; used: number; remaining: number }> {
  await lockResource(tx, `cnt:${userId}:${capName}:${periodKey}`);

  const row = await tx.userRewardCap.upsert({
    where: { userId_capName_periodKey: { userId, capName, periodKey } },
    create: { userId, capName, periodKey },
    update: {},
  });

  if (row.count >= limit) {
    return { allowed: false, used: row.count, remaining: 0 };
  }

  const updated = await tx.userRewardCap.update({
    where: { id: row.id },
    data: { count: { increment: 1 } },
  });

  return { allowed: true, used: updated.count, remaining: Math.max(0, limit - updated.count) };
}

/** Read a count without consuming it — for "how many do I have left?" UI. */
export async function peekUserCount(
  prisma: PrismaClient,
  userId: number,
  capName: string,
  periodKey: string
): Promise<number> {
  const row = await prisma.userRewardCap.findUnique({
    where: { userId_capName_periodKey: { userId, capName, periodKey } },
  });
  return row?.count ?? 0;
}

/** Sync the RewardBudget rows to the configured rules. Idempotent. */
export async function syncBudgetsFromRules(prisma: PrismaClient): Promise<void> {
  const rules = await getRules(prisma);
  for (const [name, cfg] of Object.entries(rules.budgets)) {
    await prisma.rewardBudget.upsert({
      where: { name },
      create: {
        name,
        enabled: cfg.enabled,
        dailyLimitAtomic: toDecimal(toAtomic(cfg.dailyGeek)),
        monthlyLimitAtomic: toDecimal(toAtomic(cfg.monthlyGeek)),
        treasuryAccount: cfg.treasuryAccount,
      },
      update: {
        enabled: cfg.enabled,
        dailyLimitAtomic: toDecimal(toAtomic(cfg.dailyGeek)),
        monthlyLimitAtomic: toDecimal(toAtomic(cfg.monthlyGeek)),
        treasuryAccount: cfg.treasuryAccount,
      },
    });
  }
}

/** Budget status for the admin dashboard and the health endpoint. */
export async function budgetStatus(prisma: PrismaClient, at: Date = new Date()) {
  const budgets = await prisma.rewardBudget.findMany({ orderBy: { name: "asc" } });
  const dayKey = utcDayKey(at);
  const monthKey = utcMonthKey(at);

  return Promise.all(
    budgets.map(async (b) => {
      const [day, month] = await Promise.all([
        prisma.rewardBudgetPeriod.findUnique({
          where: { budgetId_periodType_periodKey: { budgetId: b.id, periodType: "DAY", periodKey: dayKey } },
        }),
        prisma.rewardBudgetPeriod.findUnique({
          where: { budgetId_periodType_periodKey: { budgetId: b.id, periodType: "MONTH", periodKey: monthKey } },
        }),
      ]);

      const dailyLimit = toBigInt(b.dailyLimitAtomic);
      const monthlyLimit = toBigInt(b.monthlyLimitAtomic);
      const dailyUsed = day ? toBigInt(day.consumedAtomic) : 0n;
      const monthlyUsed = month ? toBigInt(month.consumedAtomic) : 0n;

      return {
        name: b.name,
        enabled: b.enabled,
        treasuryAccount: b.treasuryAccount,
        dailyLimit,
        dailyUsed,
        dailyRemaining: clampPositive(dailyLimit - dailyUsed),
        monthlyLimit,
        monthlyUsed,
        monthlyRemaining: clampPositive(monthlyLimit - monthlyUsed),
        exhausted: dailyUsed >= dailyLimit || monthlyUsed >= monthlyLimit,
        grantsToday: day?.grantCount ?? 0,
      };
    })
  );
}
