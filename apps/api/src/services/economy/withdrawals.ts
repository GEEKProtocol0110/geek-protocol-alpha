/**
 * Withdrawal reservation system (ECONOMY.md §12).
 *
 * Withdrawals are DISABLED in Alpha. This module is complete and tested so it
 * can be switched on after a real KRC-20 transfer implementation is audited —
 * but `requestWithdrawal` refuses at the top unless the runtime config says
 * withdrawals are enabled AND the rollout stage is at least 5.
 *
 * The rule that matters most here: a user must never be able to submit two
 * withdrawals against the same available balance. That is enforced three ways —
 * a single-flight database check, a per-user advisory lock, and the conditional
 * debit in `applyMovement` that cannot produce a negative balance.
 */

import type { PrismaClient } from "@prisma/client";
import { applyMovement, lockUser, withEconomyTransaction, InsufficientBalanceError } from "./ledger";
import { treasuryBucket } from "./types";
import { toAtomic, toBigInt, fromAtomic, recycleAndBurn, minBig } from "./units";
import { getEconomyConfig, REAL_MONEY_STAGE } from "./config";
import { isBreakerOpen } from "./breakers";
import { utcDayKey } from "./budget";
import { decodeKaspaAddress, networkPrefix } from "../../lib/kaspaAddress";
import { logger } from "../../lib/logger";

/**
 * Address validation with a network check.
 *
 * Sending mainnet-destined tokens to a testnet address (or the reverse) is an
 * unrecoverable loss, so the prefix must match the network this deployment is
 * configured for — a checksum-valid address is not sufficient.
 */
function validateKaspaAddress(
  address: string,
  network: string
): { valid: true } | { valid: false; reason: "format" | "network"; message: string } {
  const decoded = decodeKaspaAddress(address);
  if (!decoded) {
    return {
      valid: false,
      reason: "format",
      message: "That is not a valid Kaspa address. Check for a missing character or a typo.",
    };
  }
  const expected = networkPrefix(network);
  if (decoded.prefix !== expected) {
    return {
      valid: false,
      reason: "network",
      message: `That address is for a different Kaspa network (${decoded.prefix}). This deployment settles on ${expected}.`,
    };
  }
  return { valid: true };
}

export type WithdrawalRefusal =
  | "DISABLED"
  | "BREAKER_TRIPPED"
  | "INVALID_ADDRESS"
  | "WRONG_NETWORK"
  | "BELOW_MINIMUM"
  | "ABOVE_MAXIMUM"
  | "DAILY_LIMIT"
  | "INSUFFICIENT_BALANCE"
  | "KYC_REQUIRED"
  | "ALREADY_IN_FLIGHT"
  | "ACCOUNT_SUSPENDED"
  | "TOO_MANY_FAILURES";

export interface WithdrawalRequestResult {
  ok: boolean;
  refusal?: WithdrawalRefusal;
  message: string;
  withdrawalId?: number;
  amount?: bigint;
  fee?: bigint;
  net?: bigint;
}

const IN_FLIGHT_STATUSES = ["pending", "queued", "processing", "broadcast"];

export const ALPHA_DISABLED_MESSAGE =
  "Withdrawals are not enabled during Alpha. Your GEEK balance is an internal Alpha balance; " +
  "on-chain KRC-20 transfers are still in development and will be enabled only after an external audit.";

export class WithdrawalService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Reserve funds for a withdrawal. Moves available → locked atomically; the
   * on-chain send happens later, from the queue.
   */
  async requestWithdrawal(input: {
    userId: number;
    toAddress: string;
    amountGeek: string | number;
  }): Promise<WithdrawalRequestResult> {
    const config = await getEconomyConfig(this.prisma);

    // Gate 1: the feature flag AND the rollout stage. A flag alone can never
    // turn on real money (ECONOMY.md §23).
    if (!config.withdrawalsEnabled || config.stage < REAL_MONEY_STAGE) {
      return { ok: false, refusal: "DISABLED", message: ALPHA_DISABLED_MESSAGE };
    }

    if (!(await isBreakerOpen(this.prisma, "WITHDRAWALS"))) {
      return {
        ok: false,
        refusal: "BREAKER_TRIPPED",
        message: "Withdrawals are paused while we verify treasury health. Your balance is unaffected.",
      };
    }

    const rules = config.rules.withdrawal;
    const amount = toAtomic(String(input.amountGeek));

    // Gate 2: address validity and network match.
    const expectedNetwork = process.env.KASPA_NETWORK === "mainnet" ? "mainnet" : "testnet";
    const address = validateKaspaAddress(input.toAddress, expectedNetwork);
    if (!address.valid) {
      return {
        ok: false,
        refusal: address.reason === "network" ? "WRONG_NETWORK" : "INVALID_ADDRESS",
        message: address.message,
      };
    }

    // Gate 3: amount bounds.
    if (amount < toAtomic(rules.minGeek)) {
      return {
        ok: false,
        refusal: "BELOW_MINIMUM",
        message: `Minimum withdrawal is ${rules.minGeek} GEEK.`,
      };
    }
    if (amount > toAtomic(rules.maxGeek)) {
      return {
        ok: false,
        refusal: "ABOVE_MAXIMUM",
        message: `Maximum withdrawal is ${rules.maxGeek} GEEK per request.`,
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: { kycVerified: true, economySuspended: true, withdrawalFailureCount: true },
    });
    if (!user) return { ok: false, refusal: "INSUFFICIENT_BALANCE", message: "User not found." };

    if (user.economySuspended) {
      return {
        ok: false,
        refusal: "ACCOUNT_SUSPENDED",
        message: "Withdrawals are on hold for this account pending review.",
      };
    }
    if (user.withdrawalFailureCount >= rules.maxFailuresBeforeSuspend) {
      return {
        ok: false,
        refusal: "TOO_MANY_FAILURES",
        message: "Too many failed withdrawals. Contact support to re-enable withdrawals.",
      };
    }
    if (amount >= toAtomic(rules.kycThresholdGeek) && !user.kycVerified) {
      return {
        ok: false,
        refusal: "KYC_REQUIRED",
        message: `KYC verification is required for withdrawals of ${rules.kycThresholdGeek} GEEK or more.`,
      };
    }

    // Fee: percentage with a floor, capped so it can never exceed the amount.
    const pctFee = (amount * BigInt(Math.round(rules.feePct * 100))) / 10_000n;
    const fee = minBig(maxOf(pctFee, toAtomic(rules.minFeeGeek)), amount);
    const net = amount - fee;

    try {
      return await withEconomyTransaction(this.prisma, async (tx) => {
        await lockUser(tx, input.userId);

        // Gate 4: single flight. Checked INSIDE the lock, so two requests
        // arriving together cannot both see "nothing in flight".
        const inFlight = await tx.withdrawal.count({
          where: { userId: input.userId, status: { in: IN_FLIGHT_STATUSES } },
        });
        if (inFlight > 0) {
          return {
            ok: false as const,
            refusal: "ALREADY_IN_FLIGHT" as const,
            message: "You already have a withdrawal in progress. Wait for it to settle before starting another.",
          };
        }

        // Gate 5: rolling 24h daily limit.
        const since = new Date(Date.now() - 86_400_000);
        const todays = await tx.withdrawal.aggregate({
          where: { userId: input.userId, createdAt: { gte: since }, status: { notIn: ["failed", "cancelled"] } },
          _sum: { amountAtomic: true },
        });
        if (toBigInt(todays._sum.amountAtomic ?? 0) + amount > toAtomic(rules.dailyLimitGeek)) {
          return {
            ok: false as const,
            refusal: "DAILY_LIMIT" as const,
            message: `Daily withdrawal limit of ${rules.dailyLimitGeek} GEEK would be exceeded.`,
          };
        }

        const withdrawal = await tx.withdrawal.create({
          data: {
            userId: input.userId,
            toAddress: input.toAddress,
            amount: fromAtomic(amount),
            amountAtomic: amount.toString(),
            feeAtomic: fee.toString(),
            netAtomic: net.toString(),
            network: expectedNetwork,
            status: "pending",
            lockedAt: new Date(),
          },
        });

        // The reservation itself. If the balance is short this throws and the
        // whole request rolls back, withdrawal row included.
        await applyMovement(tx, {
          userId: input.userId,
          type: "WITHDRAWAL_LOCK",
          amount,
          from: "AVAILABLE",
          to: "LOCKED",
          referenceType: "WITHDRAWAL",
          referenceId: String(withdrawal.id),
          idempotencyKey: `withdrawal:lock:${withdrawal.id}`,
          metadata: { toAddress: input.toAddress, fee: fee.toString(), net: net.toString() },
        });

        return {
          ok: true as const,
          message: `Reserved ${fromAtomic(amount)} GEEK. You will receive ${fromAtomic(net)} GEEK after a ${fromAtomic(fee)} GEEK fee.`,
          withdrawalId: withdrawal.id,
          amount,
          fee,
          net,
        };
      });
    } catch (err) {
      if (err instanceof InsufficientBalanceError) {
        return {
          ok: false,
          refusal: "INSUFFICIENT_BALANCE",
          message: `Not enough available GEEK. You have ${fromAtomic(err.available)} GEEK available.`,
        };
      }
      throw err;
    }
  }

  /** Record the commit/reveal txids once the transfer is broadcast. */
  async recordBroadcast(withdrawalId: number, commitTxid: string, revealTxid: string): Promise<void> {
    if (!commitTxid || !revealTxid) {
      throw new Error("Refusing to record a broadcast without both commit and reveal txids");
    }
    await this.prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: "broadcast", commitTxid, revealTxid, txid: revealTxid },
    });
  }

  /**
   * Settle a confirmed withdrawal: locked → withdrawn, fee recycled 70/30.
   * Only ever called with a real, indexer-confirmed reveal txid.
   */
  async confirmWithdrawal(withdrawalId: number, revealTxid: string, confirmations: number): Promise<void> {
    if (!revealTxid) {
      throw new Error("Refusing to confirm a withdrawal without an on-chain reveal txid");
    }

    await withEconomyTransaction(this.prisma, async (tx) => {
      const w = await tx.withdrawal.findUnique({ where: { id: withdrawalId } });
      if (!w) throw new Error(`Unknown withdrawal ${withdrawalId}`);
      if (w.status === "completed") return;

      await lockUser(tx, w.userId);

      const amount = toBigInt(w.amountAtomic);
      const fee = toBigInt(w.feeAtomic);
      const net = amount - fee;

      // The net leaves the platform.
      await applyMovement(tx, {
        userId: w.userId,
        type: "WITHDRAWAL_CONFIRMED",
        amount: net,
        from: "LOCKED",
        to: "WITHDRAWN",
        referenceType: "WITHDRAWAL",
        referenceId: String(withdrawalId),
        idempotencyKey: `withdrawal:confirm:${withdrawalId}`,
        onChainRevealTxid: revealTxid,
        onChainCommitTxid: w.commitTxid,
        metadata: { confirmations, toAddress: w.toAddress },
      });

      // The fee stays and is recycled like any other platform fee.
      if (fee > 0n) {
        const { recycle, burn } = recycleAndBurn(fee);
        await applyMovement(tx, {
          userId: w.userId,
          type: "REWARD_POOL_RECYCLE",
          amount: recycle,
          from: "LOCKED",
          to: treasuryBucket("REWARD_RESERVE"),
          referenceType: "WITHDRAWAL",
          referenceId: String(withdrawalId),
          idempotencyKey: `withdrawal:fee:recycle:${withdrawalId}`,
        });
        await applyMovement(tx, {
          userId: w.userId,
          type: "BURN_PENDING",
          amount: burn,
          from: "LOCKED",
          to: treasuryBucket("BURN_PENDING"),
          referenceType: "WITHDRAWAL",
          referenceId: String(withdrawalId),
          idempotencyKey: `withdrawal:fee:burn:${withdrawalId}`,
        });
      }

      await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: "completed",
          txid: revealTxid,
          revealTxid,
          confirmations,
          confirmedAt: new Date(),
        },
      });
    });

    logger.info({ withdrawalId, revealTxid }, "economy.withdrawal_confirmed");
  }

  /** Permanent failure: give the money back and count the failure. */
  async releaseWithdrawal(withdrawalId: number, reason: string): Promise<void> {
    await withEconomyTransaction(this.prisma, async (tx) => {
      const w = await tx.withdrawal.findUnique({ where: { id: withdrawalId } });
      if (!w) throw new Error(`Unknown withdrawal ${withdrawalId}`);
      if (w.status === "failed" || w.status === "completed") return;

      await lockUser(tx, w.userId);

      await applyMovement(tx, {
        userId: w.userId,
        type: "WITHDRAWAL_RELEASE",
        amount: toBigInt(w.amountAtomic),
        from: "LOCKED",
        to: "AVAILABLE",
        referenceType: "WITHDRAWAL",
        referenceId: String(withdrawalId),
        idempotencyKey: `withdrawal:release:${withdrawalId}`,
        metadata: { reason },
      });

      await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: { status: "failed", failureReason: reason, releasedAt: new Date() },
      });

      await tx.user.update({
        where: { id: w.userId },
        data: { withdrawalFailureCount: { increment: 1 } },
      });
    });

    logger.warn({ withdrawalId, reason }, "economy.withdrawal_released");
  }

  /** How much a user has withdrawn in the current UTC day. */
  async dailyWithdrawnAtomic(userId: number): Promise<bigint> {
    const since = new Date(`${utcDayKey()}T00:00:00.000Z`);
    const agg = await this.prisma.withdrawal.aggregate({
      where: { userId, createdAt: { gte: since }, status: { notIn: ["failed", "cancelled"] } },
      _sum: { amountAtomic: true },
    });
    return toBigInt(agg._sum.amountAtomic ?? 0);
  }
}

function maxOf(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}
