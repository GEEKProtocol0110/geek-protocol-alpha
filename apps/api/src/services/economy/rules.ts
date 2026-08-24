/**
 * Default economy rules.
 *
 * These are DEFAULTS, not the live values. The live values are the `rules` JSON
 * on the single `EconomyRuntimeConfig` row, editable by an admin through an
 * audited endpoint. That indirection is the point: reward values must be
 * adjustable without changing source code (ECONOMY.md §11).
 *
 * Anything that can be tuned lives here. Anything that must never be tuned
 * (the 70/30 split, atomic-unit arithmetic, transition legality) lives in code.
 *
 * All GEEK values in this file are written in WHOLE GEEK for readability and
 * converted to atomic units at the point of use via `toAtomic`.
 */

import { z } from "zod";

export const GauntletRoundSchema = z.object({
  round: z.number().int().min(1).max(10),
  fee: z.number().min(0),
  rewardPerCorrect: z.number().min(0),
  difficulty: z.string(),
  label: z.string(),
});

export const EconomyRulesSchema = z.object({
  dailyQuiz: z.object({
    rewardedPlaysPerDay: z.number().int().min(0),
    questionCount: z.number().int().min(1),
    practiceAllowed: z.boolean(),
    minCorrectForReward: z.number().int().min(0),
    baseRewardPerCorrect: z.number().min(0),
    speedBonusPct: z.number().min(0),
    speedBonusUnderSeconds: z.number().min(0),
    streakBonusPctPerDay: z.number().min(0),
    streakBonusMaxPct: z.number().min(0),
    perUserDailyCapGeek: z.number().min(0),
    minAccountAgeHours: z.number().min(0),
    maxRiskScore: z.number().min(0).max(100),
    pendingHoldHours: z.number().min(0),
    questionSeconds: z.number().min(1),
  }),

  gauntlet: z.object({
    questionSeconds: z.number().min(1),
    questionsPerRound: z.number().int().min(1),
    rounds: z.array(GauntletRoundSchema).length(10),
    maxRewardPerRunGeek: z.number().min(0),
    shutdownFloorGeek: z.number().min(0),
    modifiers: z.object({
      double_down: z.object({ feeMultiplier: z.number(), rewardMultiplier: z.number() }),
      safety_net: z.object({
        feeMultiplier: z.number(),
        refundPct: z.number(),
        refundBelowCorrect: z.number().int(),
      }),
      hot_streak: z.object({
        feeMultiplier: z.number(),
        rewardMultiplier: z.number(),
        appliesToFirst: z.number().int(),
        minRound: z.number().int(),
      }),
    }),
  }),

  cce: z.object({
    approvalRewardGeek: z.number().min(0),
    royaltyPerServeGeek: z.number().min(0),
    royaltyDailyCapGeek: z.number().min(0),
    royaltyWeeklyCapGeek: z.number().min(0),
    royaltyLifetimeCapPerQuestionGeek: z.number().min(0),
    maxPendingSubmissions: z.number().int().min(0),
    maxSubmissionsPerDay: z.number().int().min(0),
    approvalClearingHours: z.number().min(0),
    royaltyClearingHours: z.number().min(0),
    reviewClearingHours: z.number().min(0),
    reviewRewardGeek: z.number().min(0),
    reviewDailyCap: z.number().int().min(0),
    reviewMinAccountAgeDays: z.number().min(0),
    reviewMinLevel: z.number().int().min(0),
    reviewMinQuizWins: z.number().int().min(0),
    reviewMinSeconds: z.number().min(0),
    reviewPerCreatorPerWeek: z.number().int().min(0),
    reviewMinAccuracyPct: z.number().min(0).max(100),
    reviewAccuracyGraceCount: z.number().int().min(0),
  }),

  powerUps: z.record(
    z.string(),
    z.object({
      priceGeek: z.number().min(0).optional(),
      /** Price as a multiple of the current Gauntlet round fee. */
      priceRoundFeeMultiplier: z.number().min(0).optional(),
      modes: z.array(z.enum(["daily", "gauntlet"])),
      dailyLimit: z.number().int().min(0),
      perRoundLimit: z.number().int().min(0).optional(),
      marksAssisted: z.boolean(),
      label: z.string(),
    })
  ),

  stickers: z.object({
    standardPackGeek: z.number().min(0),
    premiumPackGeek: z.number().min(0),
    craftFeeGeek: z.number().min(0),
    craftDustCost: z.number().int().min(0),
    duplicateConversionFeeGeek: z.number().min(0),
    listingFeeGeek: z.number().min(0),
    tradeFeePct: z.number().min(0).max(100),
    characterCustomisationGeek: z.number().min(0),
    seasonalPackGeek: z.number().min(0),
    selfDealWindowDays: z.number().min(0),
  }),

  withdrawal: z.object({
    minGeek: z.number().min(0),
    maxGeek: z.number().min(0),
    dailyLimitGeek: z.number().min(0),
    feePct: z.number().min(0).max(100),
    minFeeGeek: z.number().min(0),
    kycThresholdGeek: z.number().min(0),
    requiredConfirmations: z.number().int().min(0),
    maxFailuresBeforeSuspend: z.number().int().min(0),
  }),

  purchase: z.object({
    settlementHoldDays: z.number().min(0),
    minFiat: z.number().min(0),
    maxFiat: z.number().min(0),
    geekPerKas: z.number().min(0),
  }),

  budgets: z.record(
    z.string(),
    z.object({
      dailyGeek: z.number().min(0),
      monthlyGeek: z.number().min(0),
      enabled: z.boolean(),
      treasuryAccount: z.string(),
    })
  ),

  abuse: z.object({
    clusterThreshold: z.number().int().min(1),
    clusterDailyCapGeek: z.number().min(0),
    flaggedHoldHours: z.number().min(0),
  }),

  treasury: z.object({
    emergencyReserveFloorGeek: z.number().min(0),
    solvencyWarnRatio: z.number().min(0),
    solvencyTripRatio: z.number().min(0),
    workerHeartbeatMaxAgeSeconds: z.number().min(0),
    withdrawalFailureRateTripPct: z.number().min(0).max(100),
    withdrawal24hVolumeLimitGeek: z.number().min(0),
  }),
});

export type EconomyRules = z.infer<typeof EconomyRulesSchema>;

/**
 * The Alpha defaults. Every number here is documented in ECONOMY.md; if you
 * change one, change the document too — the website reads these values from the
 * API, so a drift here is a drift the players will see.
 */
export const DEFAULT_RULES: EconomyRules = {
  dailyQuiz: {
    rewardedPlaysPerDay: 1,
    questionCount: 10,
    practiceAllowed: true,
    minCorrectForReward: 6,
    baseRewardPerCorrect: 0.5,
    speedBonusPct: 10,
    speedBonusUnderSeconds: 5,
    streakBonusPctPerDay: 5,
    streakBonusMaxPct: 50,
    perUserDailyCapGeek: 15,
    minAccountAgeHours: 24,
    maxRiskScore: 70,
    pendingHoldHours: 24,
    questionSeconds: 15,
  },

  gauntlet: {
    questionSeconds: 20,
    questionsPerRound: 10,
    rounds: [
      { round: 1,  fee: 0,    rewardPerCorrect: 10,   difficulty: "easy",        label: "INITIATION" },
      { round: 2,  fee: 40,   rewardPerCorrect: 20,   difficulty: "easy-medium", label: "BASIC PROTOCOLS" },
      { round: 3,  fee: 100,  rewardPerCorrect: 40,   difficulty: "medium",      label: "NETWORK LAYER" },
      { round: 4,  fee: 200,  rewardPerCorrect: 80,   difficulty: "medium-hard", label: "DATA STREAMS" },
      { round: 5,  fee: 400,  rewardPerCorrect: 150,  difficulty: "hard",        label: "GRID ACCESS" },
      { round: 6,  fee: 750,  rewardPerCorrect: 280,  difficulty: "hard",        label: "DEEP PROTOCOL" },
      { round: 7,  fee: 1250, rewardPerCorrect: 450,  difficulty: "very-hard",   label: "CIPHER DESCENT" },
      { round: 8,  fee: 2000, rewardPerCorrect: 700,  difficulty: "very-hard",   label: "CORE BREACH" },
      { round: 9,  fee: 3500, rewardPerCorrect: 1100, difficulty: "expert",      label: "OMNISCIENT GATE" },
      { round: 10, fee: 6000, rewardPerCorrect: 1800, difficulty: "expert",      label: "APEX PROTOCOL" },
    ],
    maxRewardPerRunGeek: 40_000,
    shutdownFloorGeek: 100_000,
    modifiers: {
      double_down: { feeMultiplier: 2, rewardMultiplier: 2 },
      safety_net: { feeMultiplier: 1.1, refundPct: 50, refundBelowCorrect: 5 },
      hot_streak: { feeMultiplier: 1.25, rewardMultiplier: 1.5, appliesToFirst: 5, minRound: 3 },
    },
  },

  cce: {
    approvalRewardGeek: 5,
    royaltyPerServeGeek: 0.05,
    royaltyDailyCapGeek: 50,
    royaltyWeeklyCapGeek: 200,
    royaltyLifetimeCapPerQuestionGeek: 1000,
    maxPendingSubmissions: 10,
    maxSubmissionsPerDay: 20,
    approvalClearingHours: 72,
    royaltyClearingHours: 24,
    reviewClearingHours: 168,
    reviewRewardGeek: 0.1,
    reviewDailyCap: 20,
    reviewMinAccountAgeDays: 7,
    reviewMinLevel: 3,
    reviewMinQuizWins: 5,
    reviewMinSeconds: 15,
    reviewPerCreatorPerWeek: 3,
    reviewMinAccuracyPct: 60,
    reviewAccuracyGraceCount: 20,
  },

  powerUps: {
    FIFTY_FIFTY:   { priceGeek: 50, modes: ["daily", "gauntlet"], dailyLimit: 3, marksAssisted: true,  label: "50/50" },
    SKIP_QUESTION: { priceGeek: 75, modes: ["daily", "gauntlet"], dailyLimit: 2, marksAssisted: true,  label: "Skip Question" },
    EXTRA_TIME:    { priceGeek: 40, modes: ["daily", "gauntlet"], dailyLimit: 3, marksAssisted: true,  label: "Extra Time" },
    SAFETY_NET:    { priceRoundFeeMultiplier: 0.1, modes: ["gauntlet"], dailyLimit: 10, perRoundLimit: 1, marksAssisted: false, label: "Safety Net" },
    DOUBLE_GEEK:   { priceRoundFeeMultiplier: 1.0, modes: ["gauntlet"], dailyLimit: 10, perRoundLimit: 1, marksAssisted: false, label: "Double GEEK" },
  },

  stickers: {
    standardPackGeek: 100,
    premiumPackGeek: 400,
    craftFeeGeek: 250,
    craftDustCost: 500,
    duplicateConversionFeeGeek: 10,
    listingFeeGeek: 25,
    tradeFeePct: 5,
    characterCustomisationGeek: 500,
    seasonalPackGeek: 750,
    selfDealWindowDays: 30,
  },

  withdrawal: {
    minGeek: 100,
    maxGeek: 50_000,
    dailyLimitGeek: 100_000,
    feePct: 1,
    minFeeGeek: 10,
    kycThresholdGeek: 10_000,
    requiredConfirmations: 10,
    maxFailuresBeforeSuspend: 3,
  },

  purchase: {
    settlementHoldDays: 7,
    minFiat: 5,
    maxFiat: 500,
    geekPerKas: 100_000,
  },

  budgets: {
    DAILY_QUIZ:   { dailyGeek: 50_000,  monthlyGeek: 1_200_000, enabled: true,  treasuryAccount: "REWARD_RESERVE" },
    GAUNTLET:     { dailyGeek: 250_000, monthlyGeek: 6_000_000, enabled: true,  treasuryAccount: "REWARD_RESERVE" },
    CCE_CREATOR:  { dailyGeek: 20_000,  monthlyGeek: 500_000,   enabled: true,  treasuryAccount: "CREATOR_REWARD_POOL" },
    CCE_REVIEWER: { dailyGeek: 5_000,   monthlyGeek: 120_000,   enabled: true,  treasuryAccount: "CREATOR_REWARD_POOL" },
    TOURNAMENT:   { dailyGeek: 0,       monthlyGeek: 0,         enabled: false, treasuryAccount: "TOURNAMENT_POOL" },
    PROMOTION:    { dailyGeek: 0,       monthlyGeek: 0,         enabled: false, treasuryAccount: "OPERATIONS_TREASURY" },
    REFERRAL:     { dailyGeek: 0,       monthlyGeek: 0,         enabled: false, treasuryAccount: "OPERATIONS_TREASURY" },
    SEASONAL:     { dailyGeek: 0,       monthlyGeek: 0,         enabled: false, treasuryAccount: "OPERATIONS_TREASURY" },
    ACHIEVEMENT:  { dailyGeek: 5_000,   monthlyGeek: 100_000,   enabled: true,  treasuryAccount: "REWARD_RESERVE" },
  },

  abuse: {
    clusterThreshold: 3,
    clusterDailyCapGeek: 50,
    flaggedHoldHours: 336, // 14 days
  },

  treasury: {
    emergencyReserveFloorGeek: 1_000_000,
    solvencyWarnRatio: 1.25,
    solvencyTripRatio: 1.0,
    workerHeartbeatMaxAgeSeconds: 120,
    withdrawalFailureRateTripPct: 20,
    withdrawal24hVolumeLimitGeek: 500_000,
  },
};

/**
 * Merge stored rules over the defaults so a config row written by an older
 * release still validates after new keys are added.
 */
export function mergeRules(stored: unknown): EconomyRules {
  if (!stored || typeof stored !== "object") return DEFAULT_RULES;
  const merged = deepMerge(DEFAULT_RULES as unknown as Record<string, unknown>, stored as Record<string, unknown>);
  const parsed = EconomyRulesSchema.safeParse(merged);
  // A malformed stored config must not take the economy down; fall back to
  // defaults and let the health endpoint surface the problem.
  return parsed.success ? parsed.data : DEFAULT_RULES;
}

function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (v === undefined || v === null) continue;
    const b = base[k];
    if (
      b && typeof b === "object" && !Array.isArray(b) &&
      typeof v === "object" && !Array.isArray(v)
    ) {
      out[k] = deepMerge(b as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}
