/**
 * Burn batches (ECONOMY.md §4.1).
 *
 * The 30% burn share accrues in the BURN_PENDING treasury account as fees are
 * consumed. Nothing is broadcast during Alpha. When burning is enabled, an
 * admin opens a batch, approves it, a worker broadcasts it, and only an
 * indexer-confirmed reveal txid may move BURN_PENDING → BURN_CONFIRMED.
 *
 * The single hard rule: **a burn is never marked confirmed without a real
 * on-chain reveal transaction id.** `confirmBurnBatch` throws otherwise, and
 * there is no code path that fabricates one.
 */

import type { PrismaClient } from "@prisma/client";
import { applyMovement, withEconomyTransaction, lockResource } from "./ledger";
import { treasuryBucket } from "./types";
import { toBigInt, fromAtomic, minBig } from "./units";
import { getEconomyConfig } from "./config";
import { logger } from "../../lib/logger";

export class BurnService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Open a batch for up to `maxAmount` of the currently pending burn.
   * Opening a batch moves no tokens — it only earmarks an amount for approval.
   */
  async openBatch(maxAmount?: bigint): Promise<{ batchId: number; amount: bigint }> {
    return withEconomyTransaction(this.prisma, async (tx) => {
      await lockResource(tx, "burn:batch");

      const open = await tx.burnBatch.findFirst({ where: { status: { in: ["OPEN", "APPROVED", "BROADCAST"] } } });
      if (open) {
        throw new Error(`Burn batch ${open.id} is already ${open.status}. Settle it before opening another.`);
      }

      const account = await tx.treasuryAccount.findUnique({ where: { account: "BURN_PENDING" } });
      const pending = account ? toBigInt(account.balanceAtomic) : 0n;
      const amount = maxAmount ? minBig(pending, maxAmount) : pending;

      if (amount <= 0n) throw new Error("There is no pending burn to batch.");

      const batch = await tx.burnBatch.create({
        data: { amountAtomic: amount.toString(), status: "OPEN" },
      });

      return { batchId: batch.id, amount };
    });
  }

  /** Freeze the amount and mark it ready for broadcast. Audited by the caller. */
  async approveBatch(batchId: number, approvedBy: string, burnAddress: string): Promise<void> {
    const config = await getEconomyConfig(this.prisma);
    if (!config.burnEnabled) {
      throw new Error(
        "Burning is not enabled at this rollout stage. The burn share continues to accrue in BURN_PENDING."
      );
    }
    if (!burnAddress) throw new Error("A burn batch needs an approved burn address.");

    const batch = await this.prisma.burnBatch.findUnique({ where: { id: batchId } });
    if (!batch) throw new Error(`Unknown burn batch ${batchId}`);
    if (batch.status !== "OPEN") throw new Error(`Batch ${batchId} is ${batch.status}, not OPEN`);

    await this.prisma.burnBatch.update({
      where: { id: batchId },
      data: { status: "APPROVED", approvedBy, approvedAt: new Date(), burnAddress },
    });
  }

  /** Record the on-chain broadcast. Both txids are required. */
  async recordBroadcast(batchId: number, commitTxid: string, revealTxid: string): Promise<void> {
    if (!commitTxid || !revealTxid) {
      throw new Error("Refusing to record a burn broadcast without both commit and reveal txids");
    }
    await this.prisma.burnBatch.update({
      where: { id: batchId },
      data: { status: "BROADCAST", commitTxid, revealTxid, broadcastAt: new Date() },
    });
  }

  /**
   * Move BURN_PENDING → BURN_CONFIRMED. Requires a real reveal txid; this is
   * the only place `BURN_CONFIRMED` is ever credited (invariant I7).
   */
  async confirmBatch(batchId: number, revealTxid: string): Promise<void> {
    if (!revealTxid || revealTxid.length < 16) {
      throw new Error(
        "Refusing to confirm a burn without a real on-chain reveal transaction id. " +
          "See ECONOMY.md §4.1 — a burn is never confirmed off-chain."
      );
    }

    await withEconomyTransaction(this.prisma, async (tx) => {
      const batch = await tx.burnBatch.findUnique({ where: { id: batchId } });
      if (!batch) throw new Error(`Unknown burn batch ${batchId}`);
      if (batch.status === "CONFIRMED") return;
      if (batch.status !== "BROADCAST") {
        throw new Error(`Batch ${batchId} is ${batch.status} — only a BROADCAST batch can confirm`);
      }
      if (batch.revealTxid && batch.revealTxid !== revealTxid) {
        throw new Error(`Reveal txid mismatch for batch ${batchId}`);
      }

      const amount = toBigInt(batch.amountAtomic);
      await applyMovement(tx, {
        type: "BURN_CONFIRMED",
        amount,
        from: treasuryBucket("BURN_PENDING"),
        to: treasuryBucket("BURN_CONFIRMED"),
        referenceType: "BURN_BATCH",
        referenceId: String(batchId),
        idempotencyKey: `burn:confirm:${batchId}`,
        onChainCommitTxid: batch.commitTxid,
        onChainRevealTxid: revealTxid,
        metadata: { burnAddress: batch.burnAddress },
      });

      await tx.burnBatch.update({
        where: { id: batchId },
        data: { status: "CONFIRMED", revealTxid, confirmedAt: new Date() },
      });
    });

    logger.info({ batchId, revealTxid }, "economy.burn_confirmed");
  }

  async failBatch(batchId: number, reason: string): Promise<void> {
    await this.prisma.burnBatch.update({
      where: { id: batchId },
      data: { status: "FAILED", failureReason: reason },
    });
    logger.error({ batchId, reason }, "economy.burn_failed");
  }

  async status() {
    const [account, batches] = await Promise.all([
      this.prisma.treasuryAccount.findMany({ where: { account: { in: ["BURN_PENDING", "BURN_CONFIRMED"] } } }),
      this.prisma.burnBatch.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    ]);

    const byName = Object.fromEntries(account.map((a) => [a.account, toBigInt(a.balanceAtomic)]));

    return {
      pending: fromAtomic(byName.BURN_PENDING ?? 0n),
      confirmed: fromAtomic(byName.BURN_CONFIRMED ?? 0n),
      // Alpha truth: nothing has been broadcast, so nothing is really burned.
      note:
        "During Alpha the burn share accrues internally. No tokens have been sent to a burn address; " +
        "confirmed burns require a real on-chain reveal transaction.",
      batches: batches.map((b) => ({
        id: b.id,
        amount: fromAtomic(b.amountAtomic),
        status: b.status,
        commitTxid: b.commitTxid,
        revealTxid: b.revealTxid,
        createdAt: b.createdAt,
        confirmedAt: b.confirmedAt,
      })),
    };
  }
}
