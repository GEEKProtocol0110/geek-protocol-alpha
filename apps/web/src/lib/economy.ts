/**
 * Economy client.
 *
 * ECONOMY.md §19.4: the site reads its economic numbers from the API. No round
 * fee, reward value, timer or CCE rate is hardcoded in the web app — that is
 * what stopped the published Gauntlet table (75/125/200/350/500/750/1000) from
 * drifting away from the values the backend actually charged and paid
 * (80/150/280/450/700/1100/1800), and the advertised 15-second timer from
 * disagreeing with the 20 seconds the game enforced.
 *
 * Every fetch has a truthful fallback: when the API is unreachable the site
 * shows the shape of the data with an "unavailable" marker, never invented
 * numbers and never a row of zeros.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export interface GauntletRound {
  round: number;
  fee: number;
  rewardPerCorrect: number;
  difficulty: string;
  label: string;
  maxRoundReward: number;
  breakEvenCorrect: number;
}

export interface PublicEconomyConfig {
  stage: number;
  stageLabel: string;
  alpha: boolean;
  withdrawalsEnabled: boolean;
  purchasesEnabled: boolean;
  rewardsEnabled: boolean;
  onChainSettlementEnabled: boolean;
  gauntlet: {
    questionSeconds: number;
    questionsPerRound: number;
    maxRewardPerRunGeek: number;
    rounds: GauntletRound[];
    modifiers: Record<string, Record<string, number>>;
  };
  dailyQuiz: {
    questionCount: number;
    questionSeconds: number;
    minCorrectForReward: number;
    baseRewardPerCorrect: number;
    perUserDailyCapGeek: number;
    rewardedPlaysPerDay: number;
    streakBonusMaxPct: number;
    pendingHoldHours: number;
  };
  cce: {
    approvalRewardGeek: number;
    royaltyPerServeGeek: number;
    royaltyLifetimeCapPerQuestionGeek: number;
    reviewRewardGeek: number;
    reviewDailyCap: number;
    maxSubmissionsPerDay: number;
    provisional: boolean;
    disclaimer: string;
  };
  powerUps: Record<string, { priceGeek?: number; priceRoundFeeMultiplier?: number; label: string; dailyLimit: number; marksAssisted: boolean }>;
  stickers: Record<string, number>;
  withdrawal: {
    enabled: boolean;
    minGeek: number;
    maxGeek: number;
    dailyLimitGeek: number;
    feePct: number;
    kycThresholdGeek: number;
  };
  banner: { level: string; title: string; body: string };
  version: number;
}

export interface EconomyHealth {
  stage: number;
  stageLabel: string;
  treasury: Record<string, string>;
  liabilities: {
    totalPending: string;
    totalAvailable: string;
    totalLocked: string;
    totalWithdrawn: string;
    totalUserLiability: string;
    userCount: number;
  };
  burns: { pending: string; confirmed: string; note: string };
  remainingRewardCapacity: string;
  solvencyRatio: number | null;
  circuitBreakers: Record<string, string>;
  warnings: string[];
  healthy: boolean;
}

/**
 * The banner text also lives here as a constant, so a server-rendered page can
 * show it before any fetch resolves. The API is authoritative; this is the
 * no-JavaScript fallback, and it says the same thing.
 */
export const ALPHA_BANNER = {
  title: "Public Alpha",
  body:
    "Core gameplay, profiles, leaderboards and the Community Content Engine are in active testing. " +
    "Rewards currently appear as internal Alpha balances. Real KRC-20 payouts and withdrawals are not " +
    "enabled. Economic parameters may change before Beta.",
};

async function getJson<T>(path: string, revalidateSeconds = 60): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      next: { revalidate: revalidateSeconds },
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { success?: boolean; data?: T };
    return json?.success && json.data ? json.data : null;
  } catch {
    // Network failure on a marketing page is not worth an error boundary; the
    // caller renders an honest "unavailable" state instead.
    return null;
  }
}

export function fetchPublicEconomyConfig(): Promise<PublicEconomyConfig | null> {
  return getJson<PublicEconomyConfig>("/api/economy/public-config", 60);
}

export function fetchEconomyHealth(): Promise<EconomyHealth | null> {
  return getJson<EconomyHealth>("/api/economy/health", 60);
}

export interface PlatformStats {
  categories: number;
  questions: number;
  players: number;
}

/**
 * Live counters, with a fallback that is honest rather than zero.
 *
 * The public page rendered "0 categories", "0 questions" and "0-second timer"
 * to search engines, accessibility tools and any visitor without JavaScript,
 * because the animated counters started at zero. `null` here means "not
 * available", and the component renders a dash — not a zero that reads as a
 * factual claim that the platform is empty.
 */
export async function fetchPlatformStats(): Promise<Partial<PlatformStats>> {
  const data = await getJson<PlatformStats>("/api/stats/platform", 300);
  return data ?? {};
}

/** Format a count for display, distinguishing "zero" from "unknown". */
export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString();
}
