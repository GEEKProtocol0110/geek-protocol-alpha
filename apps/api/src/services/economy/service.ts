/**
 * EconomyService — the single chokepoint for every GEEK movement.
 *
 * ECONOMY.md §0: the Gauntlet, Daily Quiz, CCE, stickers, power-ups,
 * marketplace, purchases and withdrawals do not touch balances. They call these
 * methods. `npm run lint:economy` fails the build if anything else writes a
 * balance column.
 *
 * Every public method here either completes entirely or leaves nothing changed:
 * they all run through `withEconomyTransaction`, which is Serializable and
 * retries write conflicts.
 */

import type { PrismaClient } from "@prisma/client";
import {
  applyMovement,
  lockUser,
  reverseMovement,
  withEconomyTransaction,
  InsufficientBalanceError,
  TreasuryExhaustedError,
  type MovementResult,
  type Tx,
} from "./ledger";
import {
  treasuryBucket,
  GRANT_MESSAGES,
  type GrantResult,
  type ReferenceType,
  type TransactionType,
  type TreasuryAccountName,
} from "./types";
import {
  clampPositive,
  fromAtomic,
  minBig,
  recycleAndBurn,
  toAtomic,
  toBigInt,
} from "./units";
import {
  consumeBudget,
  consumeUserCap,
  consumeUserCount,
  releaseBudget,
  utcDayKey,
  type BudgetName,
} from "./budget";
import { isBreakerOpen, type BreakerName } from "./breakers";
import { getEconomyConfig, isDemoMode } from "./config";
import { logger } from "../../lib/logger";

export { InsufficientBalanceError, TreasuryExhaustedError };

export interface Balances {
  pending: bigint;
  available: bigint;
  locked: bigint;
  withdrawn: bigint;
  /** pending + available + locked — what the protocol owes this user. */
  total: bigint;
}

export interface GrantRewardInput {
  userId: number;
  type: TransactionType;
  /** Requested amount in atomic units. */
  amount: bigint;
  budget: BudgetName;
  breaker: BreakerName;
  idempotencyKey: string;
  referenceType?: ReferenceType;
  referenceId?: string;
  /** Treasury account funding this reward. Defaults to the budget's account. */
  source?: TreasuryAccountName;
  /** Land in pendingBalance (default) or straight into available. */
  pending?: boolean;
  /** How long a pending credit is held before it can clear. */
  holdHours?: number;
  /** Per-user cap: name + limit. Skipped when limit is 0n. */
  userCap?: { name: string; periodKey: string; limit: bigint };
  /** Anti-cheat verdict — a flagged reward can never clear to available. */
  flagged?: boolean;
  flagReason?: string;
  metadata?: Record<string, unknown>;
}

export class EconomyService {
  constructor(private readonly prisma: PrismaClient) {}

  // -------------------------------------------------------------------------
  // Reads
  // -------------------------------------------------------------------------

  async getBalances(userId: number): Promise<Balances> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        pendingBalance: true,
        availableBalance: true,
        lockedBalance: true,
        withdrawnBalance: true,
      },
    });
    if (!user) throw new Error(`User ${userId} not found`);

    const pending = toBigInt(user.pendingBalance);
    const available = toBigInt(user.availableBalance);
    const locked = toBigInt(user.lockedBalance);
    const withdrawn = toBigInt(user.withdrawnBalance);

    return { pending, available, locked, withdrawn, total: pending + available + locked };
  }

  /** Display-ready balances for an API response. */
  async getBalanceView(userId: number) {
    const b = await this.getBalances(userId);
    return {
      pending: fromAtomic(b.pending),
      available: fromAtomic(b.available),
      locked: fromAtomic(b.locked),
      withdrawn: fromAtomic(b.withdrawn),
      total: fromAtomic(b.total),
      atomic: {
        pending: b.pending.toString(),
        available: b.available.toString(),
        locked: b.locked.toString(),
        withdrawn: b.withdrawn.toString(),
      },
    };
  }

  async getLedger(userId: number, { limit = 50, cursor }: { limit?: number; cursor?: string } = {}) {
    return this.prisma.economyTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200),
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  // -------------------------------------------------------------------------
  // Granting rewards
  // -------------------------------------------------------------------------

  /**
   * Grant a reward, subject to every gate: demo mode, account suspension,
   * circuit breakers, per-user caps, budgets, and treasury capacity.
   *
   * Returns how much was ACTUALLY granted. Callers must show the player the
   * returned `message` when `granted < requested` — silently paying less than
   * the UI promised is worse than saying why.
   */
  async grantReward(input: GrantRewardInput): Promise<GrantResult> {
    const requested = input.amount;
    const deny = (reason: NonNullable<GrantResult["reason"]>): GrantResult => ({
      granted: 0n,
      requested,
      reason,
      message: GRANT_MESSAGES[reason],
      pending: false,
    });

    if (requested <= 0n) return deny("BELOW_THRESHOLD");

    // Demo mode awards XP only. A demo player must never create a claim on the
    // treasury — that was the "reward claims from demo mode" abuse vector.
    if (isDemoMode()) return deny("DEMO_MODE");

    const config = await getEconomyConfig(this.prisma);
    if (!config.rewardsEnabled) return deny("REWARDS_DISABLED");
    if (input.budget.startsWith("CCE") && !config.cceRewardsEnabled) return deny("REWARDS_DISABLED");

    if (!(await isBreakerOpen(this.prisma, input.breaker))) return deny("BREAKER_TRIPPED");

    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: { economySuspended: true },
    });
    if (!user) throw new Error(`User ${input.userId} not found`);
    if (user.economySuspended) return deny("USER_SUSPENDED");

    const budgetRow = await this.prisma.rewardBudget.findUnique({ where: { name: input.budget } });
    const sourceAccount = (input.source ??
      (budgetRow?.treasuryAccount as TreasuryAccountName | undefined) ??
      "REWARD_RESERVE") as TreasuryAccountName;

    const isPending = input.pending ?? true;
    const holdHours = input.holdHours ?? 0;

    try {
      return await withEconomyTransaction(this.prisma, async (tx) => {
        // 1. Per-user cap first — cheapest rejection, and it should not consume
        //    global budget on a user who was going to be capped anyway.
        let allowed = requested;
        let capped = false;
        if (input.userCap && input.userCap.limit > 0n) {
          const cap = await consumeUserCap(
            tx,
            input.userId,
            input.userCap.name,
            input.userCap.periodKey,
            allowed,
            input.userCap.limit
          );
          allowed = cap.allowed;
          capped = cap.capped;
          if (allowed <= 0n) return deny("USER_CAP_REACHED");
        }

        // 2. Global budget.
        const budget = await consumeBudget(tx, input.budget, allowed);
        if (budget.granted <= 0n) {
          // Hand the user cap back — it was not actually spent.
          if (input.userCap) {
            await this.refundUserCap(tx, input.userId, input.userCap.name, input.userCap.periodKey, allowed);
          }
          return deny("BUDGET_EXHAUSTED");
        }
        if (budget.granted < allowed && input.userCap) {
          await this.refundUserCap(
            tx,
            input.userId,
            input.userCap.name,
            input.userCap.periodKey,
            allowed - budget.granted
          );
        }
        const granted = budget.granted;

        // 3. Treasury capacity. A budget can say yes while the reserve is empty;
        //    the reserve is the real constraint.
        const account = await tx.treasuryAccount.findUnique({ where: { account: sourceAccount } });
        const held = account ? toBigInt(account.balanceAtomic) : 0n;
        if (held < granted) {
          await releaseBudget(tx, input.budget, granted);
          if (input.userCap) {
            await this.refundUserCap(tx, input.userId, input.userCap.name, input.userCap.periodKey, granted);
          }
          return deny("TREASURY_EXHAUSTED");
        }

        // 4. Move it.
        const clearsAt =
          isPending && holdHours > 0 ? new Date(Date.now() + holdHours * 3_600_000) : isPending ? new Date() : null;

        const result = await applyMovement(tx, {
          userId: input.userId,
          type: input.type,
          amount: granted,
          from: treasuryBucket(sourceAccount),
          to: isPending ? "PENDING" : "AVAILABLE",
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          idempotencyKey: input.idempotencyKey,
          flagged: input.flagged,
          flagReason: input.flagReason,
          clearsAt,
          metadata: { ...input.metadata, budget: input.budget, requested: requested.toString() },
        });

        // A replay means the reward was already paid. Give back the budget and
        // cap we just consumed, or a retry slowly drains the day's allowance.
        if (!result.applied) {
          await releaseBudget(tx, input.budget, granted);
          if (input.userCap) {
            await this.refundUserCap(tx, input.userId, input.userCap.name, input.userCap.periodKey, granted);
          }
          return {
            granted: 0n,
            requested,
            reason: null,
            message: "Reward already credited.",
            transactionId: result.transactionId,
            pending: isPending,
          };
        }

        await tx.user.update({
          where: { id: input.userId },
          data: { totalEarnedGeek: { increment: fromAtomic(granted) } },
        });

        return {
          granted,
          requested,
          reason: capped || budget.exhausted ? "BUDGET_EXHAUSTED" : null,
          message:
            granted < requested
              ? `Partial reward: ${fromAtomic(granted)} GEEK of ${fromAtomic(requested)} GEEK. ${GRANT_MESSAGES.BUDGET_EXHAUSTED}`
              : `Credited ${fromAtomic(granted)} GEEK.`,
          transactionId: result.transactionId,
          pending: isPending,
        };
      });
    } catch (err) {
      if (err instanceof TreasuryExhaustedError) return deny("TREASURY_EXHAUSTED");
      throw err;
    }
  }

  private async refundUserCap(
    tx: Tx,
    userId: number,
    capName: string,
    periodKey: string,
    amount: bigint
  ): Promise<void> {
    if (amount <= 0n) return;
    const row = await tx.userRewardCap.findUnique({
      where: { userId_capName_periodKey: { userId, capName, periodKey } },
    });
    if (!row) return;
    const consumed = toBigInt(row.consumedAtomic);
    await tx.userRewardCap.update({
      where: { id: row.id },
      data: { consumedAtomic: (consumed > amount ? consumed - amount : 0n).toString() },
    });
  }

  // -------------------------------------------------------------------------
  // Spending
  // -------------------------------------------------------------------------

  /**
   * Charge a fee from available balance and recycle it 70/30 immediately.
   * Used for power-ups, sticker packs, listing fees, crafting fees.
   */
  async chargeFee(input: {
    userId: number;
    type: TransactionType;
    amount: bigint;
    idempotencyKey: string;
    referenceType?: ReferenceType;
    referenceId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ charged: bigint; recycled: bigint; burned: bigint; transactionId: string }> {
    if (input.amount <= 0n) throw new RangeError("Fee must be positive");

    return withEconomyTransaction(this.prisma, async (tx) => {
      await lockUser(tx, input.userId);

      const { recycle, burn } = recycleAndBurn(input.amount);

      // Both legs debit AVAILABLE, so the user pays exactly `amount` and the
      // two treasury credits sum to exactly `amount` — no dust either way.
      const recycled = await applyMovement(tx, {
        userId: input.userId,
        type: input.type,
        amount: recycle,
        from: "AVAILABLE",
        to: treasuryBucket("REWARD_RESERVE"),
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        idempotencyKey: `${input.idempotencyKey}:recycle`,
        metadata: { ...input.metadata, leg: "recycle", grossAmount: input.amount.toString() },
      });

      await applyMovement(tx, {
        userId: input.userId,
        type: "BURN_PENDING",
        amount: burn,
        from: "AVAILABLE",
        to: treasuryBucket("BURN_PENDING"),
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        idempotencyKey: `${input.idempotencyKey}:burn`,
        metadata: { ...input.metadata, leg: "burn", grossAmount: input.amount.toString() },
      });

      return {
        charged: recycled.applied ? input.amount : 0n,
        recycled: recycle,
        burned: burn,
        transactionId: recycled.transactionId,
      };
    });
  }

  /** Move available → locked. The commit step of any check-then-act flow. */
  async lockFunds(input: {
    userId: number;
    type: TransactionType;
    amount: bigint;
    idempotencyKey: string;
    referenceType?: ReferenceType;
    referenceId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<MovementResult> {
    return withEconomyTransaction(this.prisma, async (tx) => {
      await lockUser(tx, input.userId);
      return applyMovement(tx, {
        userId: input.userId,
        type: input.type,
        amount: input.amount,
        from: "AVAILABLE",
        to: "LOCKED",
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        idempotencyKey: input.idempotencyKey,
        metadata: input.metadata,
      });
    });
  }

  /** Consume locked funds as a platform fee, applying the 70/30 rule. */
  async consumeLocked(input: {
    userId: number;
    type: TransactionType;
    amount: bigint;
    idempotencyKey: string;
    referenceType?: ReferenceType;
    referenceId?: string;
    metadata?: Record<string, unknown>;
    tx?: Tx;
  }): Promise<{ recycled: bigint; burned: bigint }> {
    const run = async (tx: Tx) => {
      const { recycle, burn } = recycleAndBurn(input.amount);

      await applyMovement(tx, {
        userId: input.userId,
        type: "REWARD_POOL_RECYCLE",
        amount: recycle,
        from: "LOCKED",
        to: treasuryBucket("REWARD_RESERVE"),
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        idempotencyKey: `${input.idempotencyKey}:recycle`,
        metadata: { ...input.metadata, sourceType: input.type, grossAmount: input.amount.toString() },
      });

      await applyMovement(tx, {
        userId: input.userId,
        type: "BURN_PENDING",
        amount: burn,
        from: "LOCKED",
        to: treasuryBucket("BURN_PENDING"),
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        idempotencyKey: `${input.idempotencyKey}:burn`,
        metadata: { ...input.metadata, sourceType: input.type, grossAmount: input.amount.toString() },
      });

      return { recycled: recycle, burned: burn };
    };

    return input.tx ? run(input.tx) : withEconomyTransaction(this.prisma, run);
  }

  /** Return locked funds to available (refund, cancellation, release). */
  async releaseLocked(input: {
    userId: number;
    type: TransactionType;
    amount: bigint;
    idempotencyKey: string;
    referenceType?: ReferenceType;
    referenceId?: string;
    metadata?: Record<string, unknown>;
    tx?: Tx;
  }): Promise<MovementResult> {
    const run = (tx: Tx) =>
      applyMovement(tx, {
        userId: input.userId,
        type: input.type,
        amount: input.amount,
        from: "LOCKED",
        to: "AVAILABLE",
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        idempotencyKey: input.idempotencyKey,
        metadata: input.metadata,
      });

    return input.tx ? run(input.tx) : withEconomyTransaction(this.prisma, run);
  }

  /**
   * Peer-to-peer transfer with a platform fee (marketplace sale).
   * Buyer pays P; seller receives P − fee; the fee is recycled 70/30.
   */
  async marketplaceSettle(input: {
    buyerId: number;
    sellerId: number;
    price: bigint;
    feePct: number;
    idempotencyKey: string;
    referenceId?: string;
    /** Flagged trades settle into the seller's pending balance for review. */
    flagged?: boolean;
    flagReason?: string;
  }): Promise<{ sellerReceived: bigint; fee: bigint; recycled: bigint; burned: bigint }> {
    const feeBps = BigInt(Math.round(input.feePct * 100));
    const fee = (input.price * feeBps) / 10_000n;
    const sellerReceives = input.price - fee;

    return withEconomyTransaction(this.prisma, async (tx) => {
      // Lock both users in a stable order so two mirrored trades cannot deadlock.
      const [first, second] = [input.buyerId, input.sellerId].sort((a, b) => a - b);
      await lockUser(tx, first);
      await lockUser(tx, second);

      // Buyer's payment to the seller.
      await applyMovement(tx, {
        userId: input.buyerId,
        type: "MARKETPLACE_PURCHASE",
        amount: sellerReceives,
        from: "AVAILABLE",
        to: treasuryBucket("OPERATIONS_TREASURY"),
        referenceType: "MARKETPLACE_LISTING",
        referenceId: input.referenceId,
        idempotencyKey: `${input.idempotencyKey}:buyer`,
        metadata: { sellerId: input.sellerId, price: input.price.toString() },
      });

      await applyMovement(tx, {
        userId: input.sellerId,
        type: "MARKETPLACE_SALE",
        amount: sellerReceives,
        from: treasuryBucket("OPERATIONS_TREASURY"),
        to: input.flagged ? "PENDING" : "AVAILABLE",
        referenceType: "MARKETPLACE_LISTING",
        referenceId: input.referenceId,
        idempotencyKey: `${input.idempotencyKey}:seller`,
        flagged: input.flagged,
        flagReason: input.flagReason,
        clearsAt: input.flagged ? null : undefined,
        metadata: { buyerId: input.buyerId, price: input.price.toString() },
      });

      let recycled = 0n;
      let burned = 0n;
      if (fee > 0n) {
        const split = recycleAndBurn(fee);
        recycled = split.recycle;
        burned = split.burn;

        await applyMovement(tx, {
          userId: input.buyerId,
          type: "MARKETPLACE_FEE",
          amount: split.recycle,
          from: "AVAILABLE",
          to: treasuryBucket("REWARD_RESERVE"),
          referenceType: "MARKETPLACE_LISTING",
          referenceId: input.referenceId,
          idempotencyKey: `${input.idempotencyKey}:fee:recycle`,
        });

        await applyMovement(tx, {
          userId: input.buyerId,
          type: "BURN_PENDING",
          amount: split.burn,
          from: "AVAILABLE",
          to: treasuryBucket("BURN_PENDING"),
          referenceType: "MARKETPLACE_LISTING",
          referenceId: input.referenceId,
          idempotencyKey: `${input.idempotencyKey}:fee:burn`,
        });
      }

      return { sellerReceived: sellerReceives, fee, recycled, burned };
    });
  }

  // -------------------------------------------------------------------------
  // Power-ups
  // -------------------------------------------------------------------------

  /**
   * Buy a power-up: enforces the daily limit, charges the price, records the
   * purchase, and marks the context assisted where the rules say so.
   */
  async purchasePowerUp(input: {
    userId: number;
    powerUp: string;
    mode: "daily" | "gauntlet";
    contextType?: string;
    contextId?: string;
    /** Current round fee, for multiplier-priced power-ups. */
    roundFeeAtomic?: bigint;
    idempotencyKey: string;
  }): Promise<
    | { ok: true; price: bigint; marksAssisted: boolean; remaining: number; purchaseId: number }
    | { ok: false; error: string }
  > {
    const config = await getEconomyConfig(this.prisma);
    const spec = config.rules.powerUps[input.powerUp];
    if (!spec) return { ok: false, error: `Unknown power-up: ${input.powerUp}` };
    if (!spec.modes.includes(input.mode)) {
      return { ok: false, error: `${spec.label} is not available in ${input.mode} mode.` };
    }

    const price =
      spec.priceGeek != null
        ? toAtomic(spec.priceGeek)
        : spec.priceRoundFeeMultiplier != null && input.roundFeeAtomic != null
          ? (input.roundFeeAtomic * BigInt(Math.round(spec.priceRoundFeeMultiplier * 10_000))) / 10_000n
          : null;

    if (price == null) return { ok: false, error: `${spec.label} has no usable price in this context.` };
    if (price <= 0n) return { ok: false, error: `${spec.label} is not purchasable right now.` };

    try {
      return await withEconomyTransaction(this.prisma, async (tx) => {
        await lockUser(tx, input.userId);

        const dayKey = utcDayKey();
        const limit = await consumeUserCount(
          tx,
          input.userId,
          `powerup:${input.powerUp}`,
          dayKey,
          spec.dailyLimit
        );
        if (!limit.allowed) {
          return {
            ok: false as const,
            error: `Daily limit reached for ${spec.label} (${spec.dailyLimit}/day). Resets at 00:00 UTC.`,
          };
        }

        const { recycle, burn } = recycleAndBurn(price);
        await applyMovement(tx, {
          userId: input.userId,
          type: "POWERUP_PURCHASE",
          amount: recycle,
          from: "AVAILABLE",
          to: treasuryBucket("REWARD_RESERVE"),
          referenceType: "POWERUP",
          referenceId: input.contextId,
          idempotencyKey: `${input.idempotencyKey}:recycle`,
          metadata: { powerUp: input.powerUp, price: price.toString() },
        });
        await applyMovement(tx, {
          userId: input.userId,
          type: "BURN_PENDING",
          amount: burn,
          from: "AVAILABLE",
          to: treasuryBucket("BURN_PENDING"),
          referenceType: "POWERUP",
          referenceId: input.contextId,
          idempotencyKey: `${input.idempotencyKey}:burn`,
          metadata: { powerUp: input.powerUp, price: price.toString() },
        });

        const purchase = await tx.powerUpPurchase.create({
          data: {
            userId: input.userId,
            powerUp: input.powerUp,
            priceAtomic: price.toString(),
            mode: input.mode,
            contextType: input.contextType ?? null,
            contextId: input.contextId ?? null,
          },
        });

        // Assisted runs are ranked separately — this is the anti-pay-to-win line.
        if (spec.marksAssisted && input.contextType === "GAUNTLET_RUN" && input.contextId) {
          await tx.gauntletRun.update({
            where: { id: Number(input.contextId) },
            data: { assisted: true },
          });
        }

        return {
          ok: true as const,
          price,
          marksAssisted: spec.marksAssisted,
          remaining: limit.remaining,
          purchaseId: purchase.id,
        };
      });
    } catch (err) {
      if (err instanceof InsufficientBalanceError) {
        return { ok: false, error: `Not enough GEEK. ${spec.label} costs ${fromAtomic(price)} GEEK.` };
      }
      throw err;
    }
  }

  // -------------------------------------------------------------------------
  // Clearing pending → available
  // -------------------------------------------------------------------------

  /**
   * Clear matured, unflagged pending credits into available balance.
   * Run by the clearing worker. Returns how many rows cleared.
   *
   * The flag is re-checked HERE, not at grant time: an account flagged after a
   * reward was granted must not have that reward clear.
   */
  async clearMaturedPending(limit = 500): Promise<{ cleared: number; amount: bigint }> {
    const due = await this.prisma.economyTransaction.findMany({
      where: {
        balanceBucketTo: "PENDING",
        status: "CONFIRMED",
        flagged: false,
        clearsAt: { lte: new Date() },
        userId: { not: null },
      },
      orderBy: { clearsAt: "asc" },
      take: limit,
    });

    let cleared = 0;
    let total = 0n;

    for (const row of due) {
      const amount = toBigInt(row.amountAtomic);
      try {
        await withEconomyTransaction(this.prisma, async (tx) => {
          const user = await tx.user.findUnique({
            where: { id: row.userId! },
            select: { economySuspended: true, pendingBalance: true },
          });
          // Suspended accounts keep their pending balance frozen.
          if (!user || user.economySuspended) return;
          // Never clear more than the user actually holds in pending: a prior
          // reversal may already have taken it back.
          const movable = minBig(amount, toBigInt(user.pendingBalance));
          if (movable <= 0n) return;

          const result = await applyMovement(tx, {
            userId: row.userId!,
            type: "PENDING_CLEARED",
            amount: movable,
            from: "PENDING",
            to: "AVAILABLE",
            referenceType: (row.referenceType ?? undefined) as ReferenceType | undefined,
            referenceId: row.referenceId ?? undefined,
            idempotencyKey: `clear:${row.id}`,
            metadata: { clearedTransaction: row.id, originalType: row.transactionType },
          });

          if (result.applied) {
            cleared++;
            total += movable;
          }

          // Mark the original so it is not scanned again.
          await tx.economyTransaction.update({
            where: { id: row.id },
            data: { clearsAt: null, metadata: { ...(row.metadata as object), clearedBy: result.transactionId } },
          });
        });
      } catch (err) {
        logger.error({ err, transactionId: row.id }, "economy.clear_failed");
      }
    }

    return { cleared, amount: total };
  }

  // -------------------------------------------------------------------------
  // Reversals and admin
  // -------------------------------------------------------------------------

  /** Reverse a transaction and hand its budget back. */
  async reverse(transactionId: string, reason: string, budget?: BudgetName): Promise<MovementResult> {
    return withEconomyTransaction(this.prisma, async (tx) => {
      const original = await tx.economyTransaction.findUnique({ where: { id: transactionId } });
      if (!original) throw new Error(`Unknown transaction ${transactionId}`);
      if (original.userId) await lockUser(tx, original.userId);

      const result = await reverseMovement(tx, transactionId, reason);
      if (result.applied && budget) {
        await releaseBudget(tx, budget, toBigInt(original.amountAtomic));
      }
      return result;
    });
  }

  /** Flag a pending reward so it can never clear. */
  async flagTransaction(transactionId: string, reason: string): Promise<void> {
    await this.prisma.economyTransaction.update({
      where: { id: transactionId },
      data: { flagged: true, flagReason: reason },
    });
  }

  /** Clear a flag after review, restoring the clearing timer. */
  async unflagTransaction(transactionId: string, clearsAt = new Date()): Promise<void> {
    await this.prisma.economyTransaction.update({
      where: { id: transactionId },
      data: { flagged: false, flagReason: null, clearsAt },
    });
  }

  /**
   * Audited manual adjustment. Both directions go through the ledger, so an
   * admin credit is as visible and as reconcilable as a gameplay reward.
   */
  async adminAdjust(input: {
    userId: number;
    amount: bigint;
    direction: "CREDIT" | "DEBIT";
    reason: string;
    actorId: number;
    actorName?: string;
    idempotencyKey: string;
  }): Promise<MovementResult> {
    return withEconomyTransaction(this.prisma, async (tx) => {
      await lockUser(tx, input.userId);

      const result = await applyMovement(tx, {
        userId: input.userId,
        type: "ADMIN_ADJUSTMENT",
        amount: input.amount,
        from: input.direction === "CREDIT" ? treasuryBucket("OPERATIONS_TREASURY") : "AVAILABLE",
        to: input.direction === "CREDIT" ? "AVAILABLE" : treasuryBucket("OPERATIONS_TREASURY"),
        referenceType: "ADMIN",
        referenceId: String(input.actorId),
        idempotencyKey: input.idempotencyKey,
        metadata: { reason: input.reason, actorId: input.actorId },
      });

      await tx.adminAuditLog.create({
        data: {
          actorId: input.actorId,
          actorName: input.actorName ?? null,
          action: `ECONOMY_${input.direction}`,
          targetType: "USER",
          targetId: String(input.userId),
          afterValue: { amount: fromAtomic(input.amount), transactionId: result.transactionId },
          reason: input.reason,
        },
      });

      return result;
    });
  }

  /** Suspend an account's economy: pending freezes, rewards stop. */
  async suspendUser(userId: number, reason: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { economySuspended: true, economySuspendedReason: reason },
    });
    await this.prisma.abuseSignal.create({
      data: { userId, signalType: "ECONOMY_SUSPENSION", severity: 5, detail: reason },
    });
  }

  async unsuspendUser(userId: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { economySuspended: false, economySuspendedReason: null },
    });
  }

  /** Can this user afford `amount` from available balance right now? */
  async canAfford(userId: number, amount: bigint): Promise<boolean> {
    const b = await this.getBalances(userId);
    return b.available >= amount;
  }

  /** Remaining headroom under a per-user cap, for UI. */
  async capRemaining(userId: number, capName: string, periodKey: string, limit: bigint): Promise<bigint> {
    const row = await this.prisma.userRewardCap.findUnique({
      where: { userId_capName_periodKey: { userId, capName, periodKey } },
    });
    return clampPositive(limit - (row ? toBigInt(row.consumedAtomic) : 0n));
  }
}

/** Process-wide singleton, created on first use. */
let instance: EconomyService | null = null;

export function economyService(prisma: PrismaClient): EconomyService {
  if (!instance) instance = new EconomyService(prisma);
  return instance;
}
