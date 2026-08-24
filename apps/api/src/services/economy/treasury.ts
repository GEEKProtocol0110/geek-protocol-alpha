/**
 * Treasury accounting and solvency (ECONOMY.md §3).
 *
 * The number this file exists to compute is `remainingRewardCapacity`: how much
 * GEEK the protocol can still promise without exceeding what it actually holds.
 * When that hits zero, rewards stop. That is the whole insolvency defence.
 */

import type { PrismaClient } from "@prisma/client";
import { TREASURY_ACCOUNTS, type TreasuryAccountName } from "./types";
import { toAtomic, toBigInt, toDecimal, clampPositive, fromAtomic } from "./units";
import { getEconomyConfig, getRules } from "./config";
import { getBreakerStates, tripBreaker, workerHeartbeatAgeSeconds, type RedisLike } from "./breakers";
import { applyMovement, type Tx } from "./ledger";
import { treasuryBucket } from "./types";
import { budgetStatus } from "./budget";

const ACCOUNT_DESCRIPTIONS: Record<TreasuryAccountName, string> = {
  REWARD_RESERVE: "Funds all gameplay rewards. Refilled by the 70% recycle share.",
  CREATOR_REWARD_POOL: "Funds CCE creator and reviewer rewards and royalties.",
  TOURNAMENT_POOL: "Funds tournament prize pools.",
  OPERATIONS_TREASURY: "Platform revenue and the unrecycled remainder.",
  BURN_PENDING: "Accrued burn obligation, not yet broadcast on-chain.",
  BURN_CONFIRMED: "Cumulative burned, each tranche backed by a reveal txid.",
  WITHDRAWAL_HOT_WALLET: "Backs outstanding withdrawal obligations.",
  EMERGENCY_RESERVE: "Untouchable except by an audited admin action.",
};

export async function ensureTreasuryAccounts(prisma: PrismaClient): Promise<void> {
  for (const account of TREASURY_ACCOUNTS) {
    await prisma.treasuryAccount.upsert({
      where: { account },
      create: { account, description: ACCOUNT_DESCRIPTIONS[account] },
      update: { description: ACCOUNT_DESCRIPTIONS[account] },
    });
  }
}

export async function treasuryBalances(
  prisma: PrismaClient | Tx
): Promise<Record<string, bigint>> {
  const rows = await prisma.treasuryAccount.findMany();
  const out: Record<string, bigint> = {};
  for (const account of TREASURY_ACCOUNTS) out[account] = 0n;
  for (const row of rows) out[row.account] = toBigInt(row.balanceAtomic);
  return out;
}

export interface UserLiabilities {
  totalPending: bigint;
  totalAvailable: bigint;
  totalLocked: bigint;
  totalWithdrawn: bigint;
  /** What the protocol owes users right now. Withdrawn is already gone. */
  totalUserLiability: bigint;
  userCount: number;
}

export async function userLiabilities(prisma: PrismaClient | Tx): Promise<UserLiabilities> {
  const agg = await prisma.user.aggregate({
    _sum: {
      pendingBalance: true,
      availableBalance: true,
      lockedBalance: true,
      withdrawnBalance: true,
    },
    _count: { id: true },
  });

  const totalPending = toBigInt(agg._sum.pendingBalance ?? 0);
  const totalAvailable = toBigInt(agg._sum.availableBalance ?? 0);
  const totalLocked = toBigInt(agg._sum.lockedBalance ?? 0);
  const totalWithdrawn = toBigInt(agg._sum.withdrawnBalance ?? 0);

  return {
    totalPending,
    totalAvailable,
    totalLocked,
    totalWithdrawn,
    totalUserLiability: totalPending + totalAvailable + totalLocked,
    userCount: agg._count.id,
  };
}

/** GEEK committed to withdrawals that have locked funds but not yet settled. */
export async function outstandingWithdrawalObligations(
  prisma: PrismaClient | Tx
): Promise<bigint> {
  const agg = await prisma.withdrawal.aggregate({
    where: { status: { in: ["pending", "queued", "processing", "broadcast"] } },
    _sum: { amountAtomic: true },
  });
  return toBigInt(agg._sum.amountAtomic ?? 0);
}

export interface EconomyHealth {
  stage: number;
  treasury: Record<string, bigint>;
  liabilities: UserLiabilities;
  withdrawalObligations: bigint;
  burns: { pending: bigint; confirmed: bigint };
  /** Reserve + hot wallet + operations, minus the untouchable emergency floor. */
  backing: bigint;
  remainingRewardCapacity: bigint;
  solvencyRatio: number;
  breakers: Record<string, string>;
  workerHeartbeatAgeSeconds: number | null;
  budgets: Awaited<ReturnType<typeof budgetStatus>>;
  warnings: string[];
  healthy: boolean;
}

/**
 * The full picture. Backs `GET /api/economy/health` and the admin dashboard.
 */
export async function economyHealth(
  prisma: PrismaClient,
  redis?: RedisLike
): Promise<EconomyHealth> {
  const config = await getEconomyConfig(prisma);
  const rules = config.rules;
  const [treasury, liabilities, withdrawalObligations, breakers, budgets] = await Promise.all([
    treasuryBalances(prisma),
    userLiabilities(prisma),
    outstandingWithdrawalObligations(prisma),
    getBreakerStates(prisma),
    budgetStatus(prisma),
  ]);

  const heartbeat = redis ? await workerHeartbeatAgeSeconds(redis) : null;

  const emergencyFloor = toAtomic(rules.treasury.emergencyReserveFloorGeek);
  const backing =
    treasury.REWARD_RESERVE +
    treasury.CREATOR_REWARD_POOL +
    treasury.TOURNAMENT_POOL +
    treasury.OPERATIONS_TREASURY +
    treasury.WITHDRAWAL_HOT_WALLET;

  const remainingRewardCapacity = clampPositive(
    backing - liabilities.totalUserLiability - clampPositive(emergencyFloor - treasury.EMERGENCY_RESERVE)
  );

  const solvencyRatio =
    liabilities.totalUserLiability === 0n
      ? Number.POSITIVE_INFINITY
      : Number(fromAtomic(backing)) / Number(fromAtomic(liabilities.totalUserLiability));

  const warnings: string[] = [];
  if (solvencyRatio < rules.treasury.solvencyWarnRatio) {
    warnings.push(
      `Solvency ratio ${solvencyRatio.toFixed(3)} is below the warning threshold ${rules.treasury.solvencyWarnRatio}`
    );
  }
  if (remainingRewardCapacity === 0n) {
    warnings.push("Remaining reward capacity is zero — rewards should be paused");
  }
  if (treasury.WITHDRAWAL_HOT_WALLET < withdrawalObligations) {
    warnings.push("Withdrawal hot wallet does not cover outstanding withdrawal obligations");
  }
  if (heartbeat !== null && heartbeat > rules.treasury.workerHeartbeatMaxAgeSeconds) {
    warnings.push(`Payout worker heartbeat is ${heartbeat}s old`);
  }
  for (const b of budgets) {
    if (b.enabled && b.exhausted) warnings.push(`Budget ${b.name} is exhausted for this period`);
  }

  return {
    stage: config.stage,
    treasury,
    liabilities,
    withdrawalObligations,
    burns: { pending: treasury.BURN_PENDING, confirmed: treasury.BURN_CONFIRMED },
    backing,
    remainingRewardCapacity,
    solvencyRatio,
    breakers,
    workerHeartbeatAgeSeconds: heartbeat,
    budgets,
    warnings,
    healthy: warnings.length === 0,
  };
}

/**
 * Evaluate every automatic breaker condition and trip what needs tripping.
 * Run by the economy monitor worker, and after any large movement.
 */
export async function evaluateCircuitBreakers(
  prisma: PrismaClient,
  redis?: RedisLike
): Promise<string[]> {
  const rules = await getRules(prisma);
  const health = await economyHealth(prisma, redis);
  const tripped: string[] = [];

  if (health.remainingRewardCapacity <= 0n) {
    await tripBreaker(prisma, "REWARDS", "Remaining reward capacity reached zero");
    tripped.push("REWARDS");
  }

  if (health.solvencyRatio < rules.treasury.solvencyTripRatio) {
    await tripBreaker(
      prisma,
      "ALL",
      `Solvency ratio ${health.solvencyRatio.toFixed(3)} below trip threshold ${rules.treasury.solvencyTripRatio}`
    );
    tripped.push("ALL");
  }

  const gauntletFloor = toAtomic(rules.gauntlet.shutdownFloorGeek);
  if (health.remainingRewardCapacity < gauntletFloor) {
    await tripBreaker(
      prisma,
      "GAUNTLET",
      `Reward capacity ${fromAtomic(health.remainingRewardCapacity)} below the Gauntlet floor ${rules.gauntlet.shutdownFloorGeek}`
    );
    tripped.push("GAUNTLET");
  }

  if (health.treasury.WITHDRAWAL_HOT_WALLET < health.withdrawalObligations) {
    await tripBreaker(prisma, "WITHDRAWALS", "Hot wallet does not cover outstanding obligations");
    tripped.push("WITHDRAWALS");
  }

  // Payout failure rate over the last 24h.
  const since = new Date(Date.now() - 86_400_000);
  const [failed, total] = await Promise.all([
    prisma.withdrawal.count({ where: { createdAt: { gte: since }, status: "failed" } }),
    prisma.withdrawal.count({ where: { createdAt: { gte: since } } }),
  ]);
  if (total >= 10) {
    const failureRate = (failed / total) * 100;
    if (failureRate > rules.treasury.withdrawalFailureRateTripPct) {
      await tripBreaker(
        prisma,
        "WITHDRAWALS",
        `Withdrawal failure rate ${failureRate.toFixed(1)}% over 24h exceeds ${rules.treasury.withdrawalFailureRateTripPct}%`
      );
      tripped.push("WITHDRAWALS");
    }
  }

  // 24h withdrawal volume safety limit.
  const volume = await prisma.withdrawal.aggregate({
    where: { createdAt: { gte: since }, status: { notIn: ["failed", "cancelled"] } },
    _sum: { amountAtomic: true },
  });
  if (toBigInt(volume._sum.amountAtomic ?? 0) > toAtomic(rules.treasury.withdrawal24hVolumeLimitGeek)) {
    await tripBreaker(prisma, "WITHDRAWALS", "24h withdrawal volume exceeded the safety limit");
    tripped.push("WITHDRAWALS");
  }

  if (
    health.workerHeartbeatAgeSeconds !== null &&
    health.workerHeartbeatAgeSeconds > rules.treasury.workerHeartbeatMaxAgeSeconds
  ) {
    await tripBreaker(
      prisma,
      "ALL",
      `Payout worker heartbeat is ${health.workerHeartbeatAgeSeconds}s old`
    );
    tripped.push("ALL");
  }

  return [...new Set(tripped)];
}

/**
 * Fund a treasury account from outside the protocol (genesis, a top-up).
 * The only movement whose source is EXTERNAL.
 */
export async function fundTreasury(
  tx: Tx,
  account: TreasuryAccountName,
  amount: bigint,
  idempotencyKey: string,
  note?: string
): Promise<void> {
  await applyMovement(tx, {
    type: "TREASURY_FUNDING",
    amount,
    from: "EXTERNAL",
    to: treasuryBucket(account),
    idempotencyKey,
    referenceType: "ADMIN",
    metadata: { note: note ?? "treasury funding" },
  });
}

/** Set the low-balance floor used by health warnings. */
export async function setTreasuryFloor(
  prisma: PrismaClient,
  account: TreasuryAccountName,
  floorGeek: number
): Promise<void> {
  await prisma.treasuryAccount.update({
    where: { account },
    data: { floorAtomic: toDecimal(toAtomic(floorGeek)) },
  });
}
