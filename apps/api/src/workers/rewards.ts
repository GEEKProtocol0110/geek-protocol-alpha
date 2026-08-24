/**
 * Payout worker.
 *
 * WHAT CHANGED AND WHY
 *
 * This worker used to credit `user.geekBalance` directly for quiz rewards and
 * purchases, and — in demo mode — mark withdrawals "completed" with a
 * fabricated txid of the form `withdraw_tx_<timestamp>`. Three problems:
 *
 *   1. It wrote balances outside EconomyService, so nothing reconciled.
 *   2. Quiz rewards are now credited synchronously at submit time, so a job
 *      arriving here would have been a SECOND credit for the same attempt.
 *   3. A fake transaction id is a lie told to a user about their money.
 *
 * Now: quiz and purchase jobs are drained as no-ops (legacy jobs still in the
 * queue from before the change), and withdrawals go through WithdrawalService,
 * which will not settle without a real commit and reveal txid.
 *
 * The worker also publishes the economy heartbeat, so the ALL circuit breaker
 * trips if this process dies.
 */

import { assertProductionConfig } from "../lib/config";
assertProductionConfig();

import Redis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { Worker, Job } from "bullmq";
import { logger } from "../lib/logger";
import { decryptPrivateKey } from "../lib/security";
import { sendKrc20Tokens } from "../lib/kaspa";
import {
  allLaneNames,
  LEGACY_PAYOUT_QUEUE,
  PAYOUT_CONCURRENCY,
  PAYOUT_LANES,
  type PayoutJob,
} from "../lib/payoutQueue";
import { WithdrawalService } from "../services/economy/withdrawals";
import { getEconomyConfig, REAL_MONEY_STAGE } from "../services/economy/config";
import { recordWorkerHeartbeat } from "../services/economy/breakers";
import { toBigInt, fromAtomic } from "../services/economy/units";

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const DEMO_MODE = process.env.DEMO_MODE === "true";
const ENABLE_REWARDS = (process.env.ENABLE_REWARDS || "false").toLowerCase() === "true";

const withdrawals = new WithdrawalService(prisma);

async function handlePayout(job: Job) {
  const { attemptId, userId, type, toAddress } = job.data as PayoutJob;
  logger.info({ jobId: job.id, queue: job.queueName, type, attemptId }, "Processing payout job");

  // Idempotency guard. Held for 24h and NOT released on success — releasing it
  // on completion meant a duplicate enqueue or a BullMQ retry after a partial
  // failure could pay the same job twice. Released only when the job throws.
  const lockKey = `lock:reward:${type}:${attemptId}`;
  const lockAcquired = await redis.set(lockKey, String(Date.now()), "EX", 86400, "NX");
  if (!lockAcquired) {
    logger.info({ attemptId, type }, "Payout already processed, skipping duplicate");
    return;
  }

  try {
    switch (type) {
      case "quiz_reward":
        // Quiz rewards are credited synchronously through EconomyService when
        // the attempt is submitted. Any job of this type is a leftover from
        // before that change; processing it would double-credit the player.
        logger.warn(
          { attemptId },
          "Draining legacy quiz_reward job — quiz rewards are now settled inline by EconomyService"
        );
        return;

      case "purchase_reward":
        // Purchases are credited by the Stripe webhook, into pending balance
        // with a settlement hold. Same reasoning as above.
        logger.warn(
          { attemptId },
          "Draining legacy purchase_reward job — purchases are settled by the Stripe webhook"
        );
        return;

      case "withdrawal": {
        if (!toAddress) {
          throw new Error(`Withdrawal job ${attemptId} is missing a destination address`);
        }
        await processWithdrawal(userId, toAddress, attemptId);
        return;
      }

      default:
        logger.warn({ jobId: job.id, type }, "Unknown payout type, dropping");
    }
  } catch (error) {
    // Release so a retry can re-acquire; the ledger's unique idempotency keys
    // still prevent a double credit if the failure was partial.
    await redis.del(lockKey);
    logger.error({ error, jobId: job.id }, "Failed to process payout job");
    throw error;
  }
}

/**
 * Send a withdrawal on-chain and settle it.
 *
 * There is no demo path that "completes" a withdrawal. If transfers are not
 * available, the withdrawal is released back to the user's available balance
 * with an honest reason — a user's money is never marked sent when it was not.
 */
async function processWithdrawal(userId: number, toAddress: string, withdrawalId: string): Promise<void> {
  const id = parseInt(withdrawalId, 10);
  const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
  if (!withdrawal) throw new Error(`Unknown withdrawal ${withdrawalId}`);
  if (withdrawal.status === "completed") return;

  const config = await getEconomyConfig(prisma);
  if (!config.withdrawalsEnabled || config.stage < REAL_MONEY_STAGE) {
    await withdrawals.releaseWithdrawal(
      id,
      "Withdrawals are not enabled at this rollout stage. Your GEEK has been returned to your available balance."
    );
    return;
  }

  if (!ENABLE_REWARDS || DEMO_MODE) {
    await withdrawals.releaseWithdrawal(
      id,
      "On-chain transfers are not available in this environment. Your GEEK has been returned to your available balance."
    );
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.encryptedPrivKey) {
    await withdrawals.releaseWithdrawal(id, "No custodial wallet key is available for this account.");
    return;
  }

  await prisma.withdrawal.update({ where: { id }, data: { status: "processing" } });

  const ticker = process.env.GEEK_TOKEN_TICKER;
  if (!ticker) {
    await withdrawals.releaseWithdrawal(id, "No KRC-20 ticker is configured for payouts.");
    return;
  }

  try {
    // Send the NET amount; the fee stays with the protocol and is recycled.
    const net = toBigInt(withdrawal.netAtomic);
    const decryptedPrivateKey = decryptPrivateKey(user.encryptedPrivKey);

    const result = await sendKrc20Tokens(decryptedPrivateKey, toAddress, ticker, net.toString());

    // sendKrc20Tokens must return real commit and reveal ids. Anything else is
    // treated as a failure rather than recorded as a successful payout.
    const { commitTxid, revealTxid } = normalizeTransferResult(result);
    if (!commitTxid || !revealTxid) {
      throw new Error(
        "KRC-20 transfer did not return both a commit and a reveal transaction id. " +
          "Refusing to mark this withdrawal settled."
      );
    }

    await withdrawals.recordBroadcast(id, commitTxid, revealTxid);

    // Confirmation is the indexer's job. Until an indexer confirms it, the
    // withdrawal stays "broadcast" and the funds stay locked.
    logger.info(
      { withdrawalId: id, commitTxid, revealTxid, amount: fromAtomic(net) },
      "Withdrawal broadcast — awaiting indexer confirmation"
    );
  } catch (err) {
    logger.error({ err, withdrawalId: id }, "Withdrawal transfer failed");
    await withdrawals.releaseWithdrawal(
      id,
      err instanceof Error ? err.message : "On-chain transfer failed"
    );
  }
}

/**
 * The transfer helper's return shape has changed over time (a bare string in
 * older revisions). Accept both, and demand both ids before settling.
 */
function normalizeTransferResult(
  result: unknown
): { commitTxid: string | null; revealTxid: string | null } {
  if (typeof result === "string") {
    // A single id cannot distinguish commit from reveal, so it is not enough.
    return { commitTxid: null, revealTxid: null };
  }
  if (result && typeof result === "object") {
    const r = result as Record<string, unknown>;
    return {
      commitTxid: typeof r.commitTxid === "string" ? r.commitTxid : null,
      revealTxid: typeof r.revealTxid === "string" ? r.revealTxid : null,
    };
  }
  return { commitTxid: null, revealTxid: null };
}

// One worker per lane. Each lane runs PAYOUT_CONCURRENCY jobs at once.
const workers: Worker[] = allLaneNames().map(
  (name) =>
    new Worker(name, handlePayout, {
      connection: redis as never,
      concurrency: PAYOUT_CONCURRENCY,
    })
);

// Drain anything still sitting in the pre-shard queue from before the sharding
// change, including the legacy quiz/purchase jobs handled as no-ops above.
workers.push(
  new Worker(LEGACY_PAYOUT_QUEUE, handlePayout, {
    connection: redis as never,
    concurrency: PAYOUT_CONCURRENCY,
  })
);

for (const w of workers) {
  w.on("completed", (job) => logger.info({ jobId: job.id, queue: w.name }, "Payout job completed"));
  w.on("failed", (job, err) => logger.error({ jobId: job?.id, queue: w.name, err }, "Payout job failed"));
}

// Liveness signal for the ALL circuit breaker.
const heartbeat = setInterval(() => {
  recordWorkerHeartbeat(redis).catch((err) =>
    logger.error({ err }, "economy.heartbeat_failed")
  );
}, 30_000);
void recordWorkerHeartbeat(redis);

const shutdown = async () => {
  logger.info("Payout workers shutting down...");
  clearInterval(heartbeat);
  await Promise.all(workers.map((w) => w.close()));
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

logger.info(
  {
    lanes: PAYOUT_LANES,
    concurrencyPerLane: PAYOUT_CONCURRENCY,
    maxParallel: PAYOUT_LANES * PAYOUT_CONCURRENCY,
    rewardsEnabled: ENABLE_REWARDS,
    demoMode: DEMO_MODE,
  },
  "Payout workers started"
);
