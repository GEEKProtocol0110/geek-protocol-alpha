/**
 * The ledger primitive.
 *
 * `applyMovement` is the ONLY function in the codebase that changes a balance.
 * It always does three things together, inside one database transaction:
 *
 *   1. inserts an immutable `EconomyTransaction` row keyed by `idempotencyKey`
 *   2. decrements the source bucket (conditionally — a debit that would go
 *      negative fails the whole transaction)
 *   3. increments the destination bucket
 *
 * Because the insert carries a UNIQUE constraint on the idempotency key, a
 * retry — a BullMQ redelivery, a double-clicked button, a Stripe webhook sent
 * twice — collides on insert and returns the ORIGINAL transaction without
 * moving anything. That property is what makes the whole economy safe to retry.
 */

import { Prisma, type PrismaClient } from "@prisma/client";
import {
  assertLegalTransition,
  isTreasuryBucket,
  isUserBucket,
  treasuryAccountOf,
  type MovementSpec,
} from "./types";
import { toDecimal, toLegacyGeek, toBigInt, fromAtomic } from "./units";
import { logger } from "../../lib/logger";

/** Prisma transaction client — everything here must run inside `$transaction`. */
export type Tx = Prisma.TransactionClient;

export class InsufficientBalanceError extends Error {
  constructor(
    readonly userId: number,
    readonly bucket: string,
    readonly requested: bigint,
    readonly available: bigint
  ) {
    super(
      `Insufficient ${bucket} balance for user ${userId}: ` +
        `need ${fromAtomic(requested)} GEEK, have ${fromAtomic(available)} GEEK`
    );
    this.name = "InsufficientBalanceError";
  }
}

export class TreasuryExhaustedError extends Error {
  constructor(readonly account: string, readonly requested: bigint, readonly available: bigint) {
    super(
      `Treasury account ${account} cannot fund ${fromAtomic(requested)} GEEK ` +
        `(holds ${fromAtomic(available)} GEEK)`
    );
    this.name = "TreasuryExhaustedError";
  }
}

export interface MovementResult {
  transactionId: string;
  /** False when the idempotency key already existed — nothing moved this time. */
  applied: boolean;
  amount: bigint;
}

const USER_BUCKET_COLUMN: Record<string, string> = {
  PENDING: "pendingBalance",
  AVAILABLE: "availableBalance",
  LOCKED: "lockedBalance",
  WITHDRAWN: "withdrawnBalance",
};

/**
 * Take a Postgres transaction-scoped advisory lock on a user.
 *
 * This is what makes "read the balance, decide, then debit" safe. Without it,
 * two simultaneous Gauntlet entries can both read a balance of 100, both decide
 * they can afford a fee of 100, and both proceed. The conditional debit below
 * would still catch it — but the lock means the second request waits and gets a
 * clean "insufficient funds" rather than a serialization failure.
 *
 * Released automatically when the transaction ends. Never held across an await
 * on anything external.
 */
export async function lockUser(tx: Tx, userId: number): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`geek:user:${userId}`}))`;
}

/** Advisory lock on a named global resource (a budget, a treasury account). */
export async function lockResource(tx: Tx, name: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`geek:res:${name}`}))`;
}

/**
 * Apply one balance movement. MUST be called inside `prisma.$transaction`.
 *
 * Throws `InsufficientBalanceError` / `TreasuryExhaustedError` rather than
 * allowing a negative balance — the caller's transaction rolls back whole.
 */
export async function applyMovement(tx: Tx, spec: MovementSpec): Promise<MovementResult> {
  const { amount, from, to, userId } = spec;

  if (amount <= 0n) {
    throw new RangeError(
      `Movement amount must be positive, got ${amount}. ` +
        `Direction is expressed by the from/to buckets, never by a negative amount.`
    );
  }
  if (!spec.idempotencyKey) {
    throw new Error("Every movement needs an idempotencyKey — see ECONOMY.md §14.3");
  }
  assertLegalTransition(from, to);

  if ((isUserBucket(from) || isUserBucket(to)) && userId == null) {
    throw new Error(`Movement ${from} → ${to} touches a user bucket but has no userId`);
  }

  // 1. Claim the idempotency key first. If this collides, nothing else runs.
  let created;
  try {
    created = await tx.economyTransaction.create({
      data: {
        userId: userId ?? null,
        transactionType: spec.type,
        amountAtomic: toDecimal(amount),
        balanceBucketFrom: from,
        balanceBucketTo: to,
        referenceType: spec.referenceType ?? null,
        referenceId: spec.referenceId ?? null,
        status: spec.status ?? "CONFIRMED",
        idempotencyKey: spec.idempotencyKey,
        onChainCommitTxid: spec.onChainCommitTxid ?? null,
        onChainRevealTxid: spec.onChainRevealTxid ?? null,
        metadata: (spec.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        flagged: spec.flagged ?? false,
        flagReason: spec.flagReason ?? null,
        clearsAt: spec.clearsAt ?? null,
        confirmedAt: (spec.status ?? "CONFIRMED") === "CONFIRMED" ? new Date() : null,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const existing = await tx.economyTransaction.findUnique({
        where: { idempotencyKey: spec.idempotencyKey },
      });
      if (existing) {
        logger.debug(
          { idempotencyKey: spec.idempotencyKey, transactionId: existing.id },
          "economy.idempotent_replay — no balance moved"
        );
        return { transactionId: existing.id, applied: false, amount: toBigInt(existing.amountAtomic) };
      }
    }
    throw err;
  }

  // 2. Debit the source.
  if (isUserBucket(from)) {
    await debitUserBucket(tx, userId!, from, amount);
  } else if (isTreasuryBucket(from)) {
    await debitTreasury(tx, treasuryAccountOf(from), amount);
  }
  // "EXTERNAL" as a source means genesis/on-chain inflow: nothing to debit.

  // 3. Credit the destination.
  if (isUserBucket(to)) {
    await creditUserBucket(tx, userId!, to, amount);
  } else if (isTreasuryBucket(to)) {
    await creditTreasury(tx, treasuryAccountOf(to), amount);
  }

  return { transactionId: created.id, applied: true, amount };
}

/**
 * Conditional debit. The `WHERE balance >= amount` clause is the real guard:
 * even if every check above were bypassed, a balance cannot go negative,
 * because a zero-row update raises here and rolls the transaction back.
 */
async function debitUserBucket(
  tx: Tx,
  userId: number,
  bucket: string,
  amount: bigint
): Promise<void> {
  const column = USER_BUCKET_COLUMN[bucket];
  if (!column) throw new Error(`Unknown user bucket: ${bucket}`);

  const amountStr = amount.toString();
  const affected = await tx.$executeRawUnsafe(
    `UPDATE "users"
       SET "${column}" = "${column}" - $1::numeric
     WHERE "id" = $2 AND "${column}" >= $1::numeric`,
    amountStr,
    userId
  );

  if (affected === 0) {
    const current = await tx.user.findUnique({
      where: { id: userId },
      select: { pendingBalance: true, availableBalance: true, lockedBalance: true, withdrawnBalance: true },
    });
    const have = current ? toBigInt((current as Record<string, Prisma.Decimal>)[column]) : 0n;
    throw new InsufficientBalanceError(userId, bucket, amount, have);
  }

  if (bucket === "AVAILABLE") await syncLegacyShadow(tx, userId);
}

async function creditUserBucket(
  tx: Tx,
  userId: number,
  bucket: string,
  amount: bigint
): Promise<void> {
  const column = USER_BUCKET_COLUMN[bucket];
  if (!column) throw new Error(`Unknown user bucket: ${bucket}`);

  const affected = await tx.$executeRawUnsafe(
    `UPDATE "users" SET "${column}" = "${column}" + $1::numeric WHERE "id" = $2`,
    amount.toString(),
    userId
  );
  if (affected === 0) throw new Error(`Cannot credit ${bucket}: user ${userId} not found`);

  if (bucket === "AVAILABLE") await syncLegacyShadow(tx, userId);
}

/**
 * Keep the deprecated `geekBalance` column equal to `availableBalance`.
 *
 * During the migration window this is the tripwire: reconciliation compares the
 * two, so any caller still writing the old column directly shows up as drift
 * instead of quietly corrupting the books. Dropped with the column (§20.1).
 */
async function syncLegacyShadow(tx: Tx, userId: number): Promise<void> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { availableBalance: true },
  });
  if (!user) return;
  await tx.user.update({
    where: { id: userId },
    data: { geekBalance: toLegacyGeek(toBigInt(user.availableBalance)) },
  });
}

async function debitTreasury(tx: Tx, account: string, amount: bigint): Promise<void> {
  const affected = await tx.$executeRaw`
    UPDATE "treasury_accounts"
       SET "balanceAtomic" = "balanceAtomic" - ${amount.toString()}::numeric,
           "updatedAt" = NOW()
     WHERE "account" = ${account}
       AND "balanceAtomic" >= ${amount.toString()}::numeric`;

  if (affected === 0) {
    const row = await tx.treasuryAccount.findUnique({ where: { account } });
    throw new TreasuryExhaustedError(account, amount, row ? toBigInt(row.balanceAtomic) : 0n);
  }
}

async function creditTreasury(tx: Tx, account: string, amount: bigint): Promise<void> {
  // Upsert so a treasury account missing from a fresh database self-heals
  // rather than dropping the credit on the floor.
  await tx.treasuryAccount.upsert({
    where: { account },
    create: { account, balanceAtomic: toDecimal(amount) },
    update: { balanceAtomic: { increment: toDecimal(amount) } },
  });
}

/**
 * Reverse a previously applied transaction by writing the mirror-image movement.
 * The original row is never mutated except to mark it REVERSED — the ledger
 * stays append-only and the history stays readable.
 */
export async function reverseMovement(
  tx: Tx,
  originalId: string,
  reason: string,
  type: "FRAUD_REVERSAL" | "REFUND" | "ADMIN_ADJUSTMENT" = "FRAUD_REVERSAL"
): Promise<MovementResult> {
  const original = await tx.economyTransaction.findUnique({ where: { id: originalId } });
  if (!original) throw new Error(`Cannot reverse unknown transaction ${originalId}`);
  if (original.status === "REVERSED") {
    throw new Error(`Transaction ${originalId} is already reversed`);
  }

  const result = await applyMovement(tx, {
    userId: original.userId,
    type,
    amount: toBigInt(original.amountAtomic),
    // Mirror image: what went A → B goes B → A.
    from: original.balanceBucketTo as MovementSpec["from"],
    to: original.balanceBucketFrom as MovementSpec["to"],
    referenceType: (original.referenceType ?? undefined) as MovementSpec["referenceType"],
    referenceId: original.referenceId ?? undefined,
    idempotencyKey: `reversal:${originalId}`,
    metadata: { reason, reversalOf: originalId },
  });

  if (result.applied) {
    await tx.economyTransaction.update({
      where: { id: originalId },
      data: { status: "REVERSED", reversedAt: new Date() },
    });
    await tx.economyTransaction.update({
      where: { id: result.transactionId },
      data: { reversalOfId: originalId },
    });
  }

  return result;
}

/**
 * Run a function inside a Serializable transaction, retrying serialization
 * failures. Postgres raises 40001 when two Serializable transactions cannot be
 * ordered; the correct response is always to retry, not to weaken isolation.
 */
export async function withEconomyTransaction<T>(
  prisma: PrismaClient,
  fn: (tx: Tx) => Promise<T>,
  { retries = 3, timeoutMs = 15_000 }: { retries?: number; timeoutMs?: number } = {}
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: timeoutMs,
        maxWait: 10_000,
      });
    } catch (err) {
      lastError = err;
      if (!isRetryableSerializationError(err) || attempt === retries) throw err;
      // Jittered backoff: lockstep retries would just collide again.
      const delay = 20 * 2 ** attempt + Math.floor(Math.random() * 40);
      logger.warn({ attempt, delay }, "economy.serialization_retry");
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError;
}

function isRetryableSerializationError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2034 = "write conflict or deadlock, please retry"
    if (err.code === "P2034") return true;
    const meta = err.meta as { code?: string } | undefined;
    if (meta?.code === "40001" || meta?.code === "40P01") return true;
  }
  const message = err instanceof Error ? err.message : String(err);
  return /could not serialize access|deadlock detected|40001|40P01/i.test(message);
}
