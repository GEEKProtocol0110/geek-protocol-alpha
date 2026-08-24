/**
 * Live economy configuration.
 *
 * Reads the single `EconomyRuntimeConfig` row, merges it over the defaults, and
 * caches it briefly so the hot path (every quiz submit, every Gauntlet round)
 * does not hit the database for rules on each call. An admin config write bumps
 * `version` and calls `invalidateConfigCache()`, so a change is live within the
 * cache TTL at worst and immediately in the process that made it.
 */

import type { PrismaClient } from "@prisma/client";
import { DEFAULT_RULES, mergeRules, type EconomyRules } from "./rules";
import { logger } from "../../lib/logger";

export interface EconomyConfigState {
  stage: number;
  withdrawalsEnabled: boolean;
  purchasesEnabled: boolean;
  rewardsEnabled: boolean;
  cceRewardsEnabled: boolean;
  burnEnabled: boolean;
  rules: EconomyRules;
  version: number;
}

const CACHE_TTL_MS = 10_000;

let cache: { value: EconomyConfigState; at: number } | null = null;

/**
 * Stage floor from the environment. The database can never declare a stage
 * higher than the operator has deliberately set here, so a compromised admin
 * account cannot turn on real money by editing a row.
 */
function envStageCeiling(): number {
  const raw = parseInt(process.env.ECONOMY_STAGE || "1", 10);
  return Number.isFinite(raw) && raw >= 1 && raw <= 6 ? raw : 1;
}

/** Stage 5 is the first stage at which real value may move (ECONOMY.md §23). */
export const REAL_MONEY_STAGE = 5;

export const DEFAULT_CONFIG_STATE: EconomyConfigState = {
  stage: 1,
  withdrawalsEnabled: false,
  purchasesEnabled: false,
  rewardsEnabled: true,
  cceRewardsEnabled: true,
  burnEnabled: false,
  rules: DEFAULT_RULES,
  version: 0,
};

export function invalidateConfigCache(): void {
  cache = null;
}

export async function getEconomyConfig(prisma: PrismaClient): Promise<EconomyConfigState> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.value;

  let row: {
    stage: number;
    withdrawalsEnabled: boolean;
    purchasesEnabled: boolean;
    rewardsEnabled: boolean;
    cceRewardsEnabled: boolean;
    burnEnabled: boolean;
    rules: unknown;
    version: number;
  } | null = null;

  try {
    row = await prisma.economyRuntimeConfig.findUnique({ where: { id: 1 } });
  } catch (err) {
    // A database blip must not make the economy behave differently; fall back
    // to safe defaults (rewards on, real money off) and log loudly.
    logger.error({ err }, "economy.config_load_failed — using defaults");
  }

  const ceiling = envStageCeiling();
  const stage = Math.min(row?.stage ?? 1, ceiling);

  const value: EconomyConfigState = {
    stage,
    // Real-money switches require BOTH the flag and a high enough stage.
    withdrawalsEnabled: (row?.withdrawalsEnabled ?? false) && stage >= REAL_MONEY_STAGE,
    purchasesEnabled: (row?.purchasesEnabled ?? false) && stage >= REAL_MONEY_STAGE,
    rewardsEnabled: row?.rewardsEnabled ?? true,
    cceRewardsEnabled: row?.cceRewardsEnabled ?? true,
    burnEnabled: (row?.burnEnabled ?? false) && stage >= 3,
    rules: mergeRules(row?.rules),
    version: row?.version ?? 0,
  };

  cache = { value, at: now };
  return value;
}

/** Convenience: just the rules. */
export async function getRules(prisma: PrismaClient): Promise<EconomyRules> {
  return (await getEconomyConfig(prisma)).rules;
}

/** True when the process is in demo mode — demo grants zero GEEK. */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

/**
 * The public, safe-to-serve slice of configuration. This is what the website
 * reads so the homepage can never drift from the running game (ECONOMY.md §19.4).
 */
export function publicConfigView(state: EconomyConfigState) {
  const { rules } = state;
  return {
    stage: state.stage,
    stageLabel: STAGE_LABELS[state.stage] ?? `Stage ${state.stage}`,
    alpha: state.stage < REAL_MONEY_STAGE,
    withdrawalsEnabled: state.withdrawalsEnabled,
    purchasesEnabled: state.purchasesEnabled,
    rewardsEnabled: state.rewardsEnabled,
    onChainSettlementEnabled: false,
    gauntlet: {
      questionSeconds: rules.gauntlet.questionSeconds,
      questionsPerRound: rules.gauntlet.questionsPerRound,
      maxRewardPerRunGeek: rules.gauntlet.maxRewardPerRunGeek,
      rounds: rules.gauntlet.rounds.map((r) => ({
        ...r,
        maxRoundReward: r.rewardPerCorrect * rules.gauntlet.questionsPerRound,
        // How many correct answers repay the entry fee.
        breakEvenCorrect:
          r.fee === 0 ? 0 : Math.ceil(r.fee / Math.max(r.rewardPerCorrect, 1)),
      })),
      modifiers: rules.gauntlet.modifiers,
    },
    dailyQuiz: {
      questionCount: rules.dailyQuiz.questionCount,
      questionSeconds: rules.dailyQuiz.questionSeconds,
      minCorrectForReward: rules.dailyQuiz.minCorrectForReward,
      baseRewardPerCorrect: rules.dailyQuiz.baseRewardPerCorrect,
      perUserDailyCapGeek: rules.dailyQuiz.perUserDailyCapGeek,
      rewardedPlaysPerDay: rules.dailyQuiz.rewardedPlaysPerDay,
      streakBonusMaxPct: rules.dailyQuiz.streakBonusMaxPct,
      pendingHoldHours: rules.dailyQuiz.pendingHoldHours,
    },
    cce: {
      approvalRewardGeek: rules.cce.approvalRewardGeek,
      royaltyPerServeGeek: rules.cce.royaltyPerServeGeek,
      royaltyLifetimeCapPerQuestionGeek: rules.cce.royaltyLifetimeCapPerQuestionGeek,
      reviewRewardGeek: rules.cce.reviewRewardGeek,
      reviewDailyCap: rules.cce.reviewDailyCap,
      maxSubmissionsPerDay: rules.cce.maxSubmissionsPerDay,
      // The site must present these as tunable Alpha values, never promises.
      provisional: true,
      disclaimer:
        "Qualified creators and accurate reviewers can earn configurable Alpha rewards. Rates and limits are being tested and may change before Beta.",
    },
    powerUps: rules.powerUps,
    stickers: rules.stickers,
    withdrawal: {
      enabled: state.withdrawalsEnabled,
      minGeek: rules.withdrawal.minGeek,
      maxGeek: rules.withdrawal.maxGeek,
      dailyLimitGeek: rules.withdrawal.dailyLimitGeek,
      feePct: rules.withdrawal.feePct,
      kycThresholdGeek: rules.withdrawal.kycThresholdGeek,
    },
    version: state.version,
  };
}

export const STAGE_LABELS: Record<number, string> = {
  1: "Alpha — internal balances only",
  2: "Closed Alpha",
  3: "Small test treasury",
  4: "External review",
  5: "Limited public Beta",
  6: "Scaling",
};
