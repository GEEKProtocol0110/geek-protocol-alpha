/**
 * Economy vocabulary: buckets, transaction types, transition legality.
 *
 * The transition table below is the whole safety model in one place. If a
 * movement is not listed there, `assertLegalTransition` rejects it — which is
 * how a typo like "credit AVAILABLE from nowhere" becomes a thrown error
 * instead of minted GEEK.
 */

/** User-side balance buckets. */
export const USER_BUCKETS = ["PENDING", "AVAILABLE", "LOCKED", "WITHDRAWN"] as const;
export type UserBucket = (typeof USER_BUCKETS)[number];

/** Treasury accounts (ECONOMY.md §3). */
export const TREASURY_ACCOUNTS = [
  "REWARD_RESERVE",
  "CREATOR_REWARD_POOL",
  "TOURNAMENT_POOL",
  "OPERATIONS_TREASURY",
  "BURN_PENDING",
  "BURN_CONFIRMED",
  "WITHDRAWAL_HOT_WALLET",
  "EMERGENCY_RESERVE",
] as const;
export type TreasuryAccountName = (typeof TREASURY_ACCOUNTS)[number];

/** A bucket reference as it appears in the ledger's from/to columns. */
export type Bucket = UserBucket | `TREASURY_${TreasuryAccountName}` | "EXTERNAL";

export function treasuryBucket(account: TreasuryAccountName): Bucket {
  return `TREASURY_${account}` as Bucket;
}

export function isTreasuryBucket(b: string): b is `TREASURY_${TreasuryAccountName}` {
  return b.startsWith("TREASURY_");
}

export function treasuryAccountOf(bucket: string): TreasuryAccountName {
  const name = bucket.replace(/^TREASURY_/, "") as TreasuryAccountName;
  if (!TREASURY_ACCOUNTS.includes(name)) {
    throw new Error(`Not a treasury bucket: ${bucket}`);
  }
  return name;
}

export function isUserBucket(b: string): b is UserBucket {
  return (USER_BUCKETS as readonly string[]).includes(b);
}

/** Every transaction type the ledger recognises (ECONOMY.md §14.2). */
export const TRANSACTION_TYPES = [
  "DAILY_REWARD",
  "GAUNTLET_ENTRY",
  "GAUNTLET_REWARD",
  "GAUNTLET_CASHOUT",
  "GAUNTLET_REFUND",
  "GAUNTLET_FEE_CONSUMED",
  "CCE_CREATOR_REWARD",
  "CCE_REVIEW_REWARD",
  "CREATOR_ROYALTY",
  "POWERUP_PURCHASE",
  "STICKER_PACK_PURCHASE",
  "STICKER_CRAFT_FEE",
  "MARKETPLACE_SALE",
  "MARKETPLACE_PURCHASE",
  "MARKETPLACE_FEE",
  "MARKETPLACE_LISTING_FEE",
  "TOURNAMENT_ENTRY",
  "TOURNAMENT_REWARD",
  "REWARD_POOL_RECYCLE",
  "BURN_PENDING",
  "BURN_CONFIRMED",
  "WITHDRAWAL_LOCK",
  "WITHDRAWAL_CONFIRMED",
  "WITHDRAWAL_RELEASE",
  "PURCHASE_PENDING",
  "PURCHASE_CONFIRMED",
  "REFUND",
  "PENDING_CLEARED",
  "ADMIN_ADJUSTMENT",
  "FRAUD_REVERSAL",
  "TREASURY_FUNDING",
  "ACHIEVEMENT_REWARD",
  "STREAK_REWARD",
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export type TransactionStatus = "PENDING" | "CONFIRMED" | "REVERSED" | "FAILED";

/**
 * Legal bucket transitions (ECONOMY.md §2.2).
 *
 * Read as: from-bucket-kind → allowed to-bucket-kinds. "TREASURY" matches any
 * treasury account; the service checks account-level rules separately.
 */
const LEGAL_TRANSITIONS: Record<string, string[]> = {
  // Rewards enter as pending or, when already validated, straight to available.
  TREASURY: ["PENDING", "AVAILABLE", "TREASURY", "EXTERNAL"],
  PENDING: ["AVAILABLE", "TREASURY"],
  AVAILABLE: ["LOCKED", "TREASURY"],
  LOCKED: ["AVAILABLE", "WITHDRAWN", "TREASURY"],
  // withdrawn is terminal — it is a lifetime counter, money is off-platform.
  WITHDRAWN: [],
  // Genesis funding and on-chain settlement.
  EXTERNAL: ["TREASURY"],
};

function kindOf(bucket: string): string {
  return isTreasuryBucket(bucket) ? "TREASURY" : bucket;
}

export class IllegalTransitionError extends Error {
  constructor(from: string, to: string) {
    super(
      `Illegal balance transition ${from} → ${to}. ` +
        `See ECONOMY.md §2.2 for the permitted set.`
    );
    this.name = "IllegalTransitionError";
  }
}

export function assertLegalTransition(from: string, to: string): void {
  if (from === to) throw new IllegalTransitionError(from, to);
  const allowed = LEGAL_TRANSITIONS[kindOf(from)];
  if (!allowed || !allowed.includes(kindOf(to))) {
    throw new IllegalTransitionError(from, to);
  }
}

/** Reference kinds, for tracing a ledger row back to what caused it. */
export type ReferenceType =
  | "QUIZ_ATTEMPT"
  | "GAUNTLET_RUN"
  | "GAUNTLET_ROUND"
  | "QUESTION"
  | "REVIEW"
  | "POWERUP"
  | "STICKER_PACK"
  | "MARKETPLACE_LISTING"
  | "WITHDRAWAL"
  | "PURCHASE"
  | "BURN_BATCH"
  | "TOURNAMENT"
  | "MIGRATION"
  | "ADMIN"
  | "ACHIEVEMENT";

/** One leg of a movement, as handed to the service. */
export interface MovementSpec {
  userId?: number | null;
  type: TransactionType;
  amount: bigint;
  from: Bucket;
  to: Bucket;
  referenceType?: ReferenceType;
  referenceId?: string;
  /** REQUIRED and unique. Deterministic in what happened, never in the clock. */
  idempotencyKey: string;
  status?: TransactionStatus;
  metadata?: Record<string, unknown>;
  /** Mark the credit unclearable until reviewed. */
  flagged?: boolean;
  flagReason?: string;
  /** For PENDING credits: when they become eligible to clear. */
  clearsAt?: Date | null;
  onChainCommitTxid?: string | null;
  onChainRevealTxid?: string | null;
}

/** What a reward grant returns — callers must handle `granted < requested`. */
export interface GrantResult {
  granted: bigint;
  requested: bigint;
  /** null when the full amount was granted. */
  reason:
    | null
    | "BUDGET_EXHAUSTED"
    | "USER_CAP_REACHED"
    | "BREAKER_TRIPPED"
    | "TREASURY_EXHAUSTED"
    | "REWARDS_DISABLED"
    | "USER_SUSPENDED"
    | "DEMO_MODE"
    | "BELOW_THRESHOLD";
  /** Human-readable, safe to show a player. */
  message: string;
  transactionId?: string;
  /** True when the reward landed in pendingBalance rather than available. */
  pending: boolean;
}

export const GRANT_MESSAGES: Record<NonNullable<GrantResult["reason"]>, string> = {
  BUDGET_EXHAUSTED:
    "Today's reward budget is fully allocated. You can keep playing for XP — GEEK rewards resume at 00:00 UTC.",
  USER_CAP_REACHED:
    "You've reached your GEEK reward cap for today. Keep playing for XP — your cap resets at 00:00 UTC.",
  BREAKER_TRIPPED:
    "GEEK rewards are paused while we check the protocol's health. Gameplay and XP continue as normal.",
  TREASURY_EXHAUSTED:
    "The reward reserve is fully committed. Play continues for XP while the treasury is topped up.",
  REWARDS_DISABLED: "GEEK rewards are currently disabled. Gameplay still earns XP.",
  USER_SUSPENDED:
    "GEEK rewards are on hold for this account pending review. Contact support if you think this is wrong.",
  DEMO_MODE: "Demo mode awards XP only — no GEEK is credited.",
  BELOW_THRESHOLD: "No GEEK reward for this attempt.",
};
