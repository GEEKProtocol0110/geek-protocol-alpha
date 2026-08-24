/**
 * Bucket transition legality and reward-calculation rules.
 *
 * The transition table is the safety model: if a movement is not listed, it is
 * rejected. These tests pin down both halves — what must be allowed, and what
 * must never be.
 */

import { describe, it, expect } from "vitest";
import {
  assertLegalTransition,
  IllegalTransitionError,
  treasuryBucket,
  isTreasuryBucket,
  treasuryAccountOf,
  isUserBucket,
  TRANSACTION_TYPES,
  TREASURY_ACCOUNTS,
} from "../types";
import { calculateDailyReward, riskScoreFrom, capToDaily } from "../../dailyQuizRewards";
import { DEFAULT_RULES } from "../rules";
import { toAtomic, fromAtomic } from "../units";

describe("legal transitions", () => {
  const LEGAL: Array<[string, string]> = [
    [treasuryBucket("REWARD_RESERVE"), "PENDING"],
    [treasuryBucket("REWARD_RESERVE"), "AVAILABLE"],
    ["PENDING", "AVAILABLE"],
    ["PENDING", treasuryBucket("REWARD_RESERVE")],
    ["AVAILABLE", "LOCKED"],
    ["AVAILABLE", treasuryBucket("BURN_PENDING")],
    ["LOCKED", "AVAILABLE"],
    ["LOCKED", "WITHDRAWN"],
    ["LOCKED", treasuryBucket("REWARD_RESERVE")],
    [treasuryBucket("BURN_PENDING"), treasuryBucket("BURN_CONFIRMED")],
    ["EXTERNAL", treasuryBucket("OPERATIONS_TREASURY")],
  ];

  it.each(LEGAL)("allows %s → %s", (from, to) => {
    expect(() => assertLegalTransition(from, to)).not.toThrow();
  });

  const ILLEGAL: Array<[string, string, string]> = [
    ["AVAILABLE", "WITHDRAWN", "withdrawing must reserve funds in LOCKED first"],
    ["AVAILABLE", "PENDING", "spendable money cannot become unvalidated money"],
    ["PENDING", "LOCKED", "unvalidated money cannot be committed to a wager"],
    ["WITHDRAWN", "AVAILABLE", "withdrawn is terminal — the money left the platform"],
    ["WITHDRAWN", treasuryBucket("REWARD_RESERVE"), "withdrawn is terminal"],
    ["EXTERNAL", "AVAILABLE", "external value must land in the treasury, not straight on a user"],
    ["AVAILABLE", "AVAILABLE", "a movement to itself is a no-op and almost certainly a bug"],
    ["LOCKED", "PENDING", "not a defined path"],
  ];

  it.each(ILLEGAL)("rejects %s → %s (%s)", (from, to) => {
    expect(() => assertLegalTransition(from, to)).toThrow(IllegalTransitionError);
  });

  it("names the document in the error, so the fix is findable", () => {
    try {
      assertLegalTransition("AVAILABLE", "WITHDRAWN");
      throw new Error("should have thrown");
    } catch (err) {
      expect((err as Error).message).toContain("ECONOMY.md");
    }
  });
});

describe("bucket helpers", () => {
  it("round-trips a treasury account", () => {
    for (const account of TREASURY_ACCOUNTS) {
      const bucket = treasuryBucket(account);
      expect(isTreasuryBucket(bucket)).toBe(true);
      expect(treasuryAccountOf(bucket)).toBe(account);
    }
  });

  it("does not confuse a user bucket with a treasury bucket", () => {
    expect(isUserBucket("AVAILABLE")).toBe(true);
    expect(isUserBucket(treasuryBucket("REWARD_RESERVE"))).toBe(false);
    expect(isTreasuryBucket("AVAILABLE")).toBe(false);
  });

  it("rejects an unknown treasury bucket", () => {
    expect(() => treasuryAccountOf("TREASURY_NOT_A_REAL_ACCOUNT")).toThrow();
  });

  it("declares every transaction type the document lists", () => {
    for (const required of [
      "DAILY_REWARD",
      "GAUNTLET_ENTRY",
      "GAUNTLET_REWARD",
      "GAUNTLET_CASHOUT",
      "CCE_CREATOR_REWARD",
      "CCE_REVIEW_REWARD",
      "CREATOR_ROYALTY",
      "POWERUP_PURCHASE",
      "STICKER_PACK_PURCHASE",
      "MARKETPLACE_SALE",
      "MARKETPLACE_FEE",
      "REWARD_POOL_RECYCLE",
      "BURN_PENDING",
      "BURN_CONFIRMED",
      "WITHDRAWAL_LOCK",
      "WITHDRAWAL_CONFIRMED",
      "WITHDRAWAL_RELEASE",
      "PURCHASE_PENDING",
      "PURCHASE_CONFIRMED",
      "REFUND",
      "ADMIN_ADJUSTMENT",
      "FRAUD_REVERSAL",
    ]) {
      expect(TRANSACTION_TYPES).toContain(required);
    }
  });
});

describe("daily quiz reward formula", () => {
  const base = {
    totalQuestions: 10,
    averageSeconds: 8,
    fullSpeedCredit: true,
    streakDays: 0,
    riskScore: 0,
  };

  it("pays nothing below the minimum score", () => {
    const r = calculateDailyReward(DEFAULT_RULES, { ...base, correctCount: 5 });
    expect(r.eligible).toBe(false);
    expect(r.grossAtomic).toBe(0n);
    expect(r.reason).toContain("XP is still awarded");
  });

  it("pays the base rate at the minimum score", () => {
    const r = calculateDailyReward(DEFAULT_RULES, { ...base, correctCount: 6 });
    expect(r.eligible).toBe(true);
    expect(fromAtomic(r.baseAtomic)).toBe("3"); // 6 × 0.5
    expect(r.speedBonusAtomic).toBe(0n); // 8s is not under the 5s threshold
    expect(r.streakBonusAtomic).toBe(0n);
  });

  it("adds a speed bonus only with validated timings", () => {
    const fast = calculateDailyReward(DEFAULT_RULES, {
      ...base,
      correctCount: 10,
      averageSeconds: 3,
    });
    expect(fromAtomic(fast.speedBonusAtomic)).toBe("0.5"); // 10% of 5

    // Same timings, but the validator withheld speed credit: no bonus.
    const unvalidated = calculateDailyReward(DEFAULT_RULES, {
      ...base,
      correctCount: 10,
      averageSeconds: 3,
      fullSpeedCredit: false,
    });
    expect(unvalidated.speedBonusAtomic).toBe(0n);
  });

  it("caps the streak bonus at the configured maximum", () => {
    const long = calculateDailyReward(DEFAULT_RULES, {
      ...base,
      correctCount: 10,
      streakDays: 400,
    });
    // 50% of a base of 5 GEEK, not 400 × 5%.
    expect(fromAtomic(long.streakBonusAtomic)).toBe("2.5");
  });

  it("pays nothing when the anti-cheat risk is above the threshold", () => {
    const r = calculateDailyReward(DEFAULT_RULES, {
      ...base,
      correctCount: 10,
      riskScore: 95,
    });
    expect(r.eligible).toBe(false);
    expect(r.grossAtomic).toBe(0n);
    expect(r.reason).toContain("anti-cheat");
  });

  it("cannot exceed the per-user daily cap", () => {
    const huge = toAtomic("999999");
    expect(capToDaily(huge, DEFAULT_RULES)).toBe(
      toAtomic(DEFAULT_RULES.dailyQuiz.perUserDailyCapGeek)
    );
  });
});

describe("risk scoring", () => {
  it("is zero for a clean attempt", () => {
    expect(riskScoreFrom([], undefined, undefined)).toBe(0);
  });

  it("rises with timing flags", () => {
    expect(riskScoreFrom(["impossible_speed"], undefined, undefined)).toBe(25);
    expect(riskScoreFrom(["a", "b", "c", "d"], undefined, undefined)).toBe(75);
  });

  it("a suspicious behaviour verdict alone does not disqualify", () => {
    // 40 is below the 70 threshold: a behaviour signal is advisory, because a
    // false positive means refusing to pay a real player.
    expect(riskScoreFrom([], 10, true)).toBe(40);
    expect(riskScoreFrom([], 10, true)).toBeLessThan(DEFAULT_RULES.dailyQuiz.maxRiskScore);
  });

  it("timing flags plus behaviour do disqualify", () => {
    expect(riskScoreFrom(["a", "b"], 20, true)).toBeGreaterThan(
      DEFAULT_RULES.dailyQuiz.maxRiskScore
    );
  });

  it("never exceeds 100", () => {
    expect(riskScoreFrom(["a", "b", "c", "d", "e"], 100, true)).toBe(100);
  });
});
