/**
 * Daily Quiz reward calculation (ECONOMY.md §5).
 *
 * Split out from the route so the formula is testable on its own and the route
 * stays about HTTP. Nothing here touches a balance — it computes an amount, and
 * `EconomyService.grantReward` decides what is actually payable.
 */

import type { PrismaClient } from "@prisma/client";
import { applyPct, toAtomic, minBig, type EconomyRules } from "./economy";

export interface DailyRewardInput {
  correctCount: number;
  totalQuestions: number;
  /** Server-validated average seconds per question. */
  averageSeconds: number;
  /** Whether the timing validator granted full speed credit. */
  fullSpeedCredit: boolean;
  streakDays: number;
  /** 0-100 anti-cheat risk. Above the configured threshold pays nothing. */
  riskScore: number;
}

export interface DailyRewardBreakdown {
  eligible: boolean;
  reason: string | null;
  baseAtomic: bigint;
  speedBonusAtomic: bigint;
  streakBonusAtomic: bigint;
  grossAtomic: bigint;
}

/**
 * base   = correct × baseRewardPerCorrect
 * speed  = base × speedBonusPct         (only with validated timings)
 * streak = base × min(days × pct, max)
 */
export function calculateDailyReward(
  rules: EconomyRules,
  input: DailyRewardInput
): DailyRewardBreakdown {
  const q = rules.dailyQuiz;
  const zero: DailyRewardBreakdown = {
    eligible: false,
    reason: null,
    baseAtomic: 0n,
    speedBonusAtomic: 0n,
    streakBonusAtomic: 0n,
    grossAtomic: 0n,
  };

  if (input.riskScore > q.maxRiskScore) {
    return { ...zero, reason: "Attempt flagged by anti-cheat; no GEEK awarded." };
  }

  if (input.correctCount < q.minCorrectForReward) {
    return {
      ...zero,
      reason: `Score at least ${q.minCorrectForReward} of ${q.questionCount} to earn GEEK. XP is still awarded.`,
    };
  }

  const base = toAtomic(q.baseRewardPerCorrect) * BigInt(input.correctCount);

  const speedBonus =
    input.fullSpeedCredit && input.averageSeconds > 0 && input.averageSeconds < q.speedBonusUnderSeconds
      ? applyPct(base, q.speedBonusPct)
      : 0n;

  const streakPct = Math.min(input.streakDays * q.streakBonusPctPerDay, q.streakBonusMaxPct);
  const streakBonus = streakPct > 0 ? applyPct(base, streakPct) : 0n;

  return {
    eligible: true,
    reason: null,
    baseAtomic: base,
    speedBonusAtomic: speedBonus,
    streakBonusAtomic: streakBonus,
    grossAtomic: base + speedBonus + streakBonus,
  };
}

/**
 * Has this account already taken its rewarded play today?
 *
 * Keyed on BOTH the user id and the wallet address, so several accounts sharing
 * one wallet collectively get one rewarded play — the "multiple accounts, one
 * wallet" vector in ECONOMY.md §15.
 */
export async function rewardedPlayKeys(
  prisma: PrismaClient,
  userId: number,
  dayKey: string
): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { walletAddress: true },
  });

  const keys = [`daily:user:${userId}:${dayKey}`];
  if (user?.walletAddress) keys.push(`daily:wallet:${user.walletAddress}:${dayKey}`);
  return keys;
}

/** Is the account old enough to earn? Brand-new accounts farm; real ones wait. */
export async function meetsAccountAge(
  prisma: PrismaClient,
  userId: number,
  minHours: number
): Promise<boolean> {
  if (minHours <= 0) return true;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dateCreated: true },
  });
  if (!user) return false;
  return Date.now() - user.dateCreated.getTime() >= minHours * 3_600_000;
}

/**
 * Combine the timing and behaviour verdicts into one 0-100 risk score.
 * Deliberately coarse: this gates a reward, so it should be hard to trip by
 * accident and easy to explain when it does.
 */
export function riskScoreFrom(
  timingFlags: string[],
  behaviorScore: number | undefined,
  behaviorSuspicious: boolean | undefined
): number {
  let score = 0;
  score += Math.min(timingFlags.length * 25, 75);
  if (behaviorSuspicious) score += 40;
  else if (typeof behaviorScore === "number") score += Math.min(Math.max(behaviorScore, 0), 30);
  return Math.min(score, 100);
}

/** Cap a gross reward by the per-user daily ceiling. */
export function capToDaily(gross: bigint, rules: EconomyRules): bigint {
  return minBig(gross, toAtomic(rules.dailyQuiz.perUserDailyCapGeek));
}
