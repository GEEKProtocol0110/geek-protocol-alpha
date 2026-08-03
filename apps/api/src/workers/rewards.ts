// The worker signs nothing but does decrypt custodial keys and move funds, so it
// gets the same fail-fast treatment as the API.
import { assertProductionConfig } from "../lib/config";
assertProductionConfig();

import Redis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { Worker, Job } from "bullmq";
import { logger } from "../lib/logger";
import { decryptPrivateKey } from "../lib/security";
import { sendKrc20Tokens, createWalletFromPrivateKey } from "../lib/kaspa";
import {
  allLaneNames,
  LEGACY_PAYOUT_QUEUE,
  PAYOUT_CONCURRENCY,
  PAYOUT_LANES,
  type PayoutJob,
} from "../lib/payoutQueue";

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const DEMO_MODE = process.env.DEMO_MODE === "true";
const MIN_SCORE_FOR_REWARD = parseInt(process.env.MIN_SCORE_FOR_REWARD || "70", 10);
const ENABLE_REWARDS = (process.env.ENABLE_REWARDS || "false").toLowerCase() === "true";
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY || "";

async function handlePayout(job: Job) {
  logger.info({ jobId: job.id, queue: job.queueName, data: job.data }, "Processing reward job");
  const { attemptId, userId, rewardAmount, type, toAddress } = job.data as PayoutJob;

  // Idempotency guard. The key is held for 24h and is NOT released on success —
  // releasing it on completion (the old behaviour) meant a duplicate enqueue or a
  // BullMQ retry after a partial failure could pay the same attempt twice.
  // It is only released when the job throws, so genuine retries can run again.
  const lockKey = `lock:reward:${type}:${attemptId}`;
  const lockAcquired = await redis.set(lockKey, String(Date.now()), "EX", 86400, "NX");
  if (!lockAcquired) {
    logger.info({ attemptId, type }, "Reward already processed, skipping duplicate");
    return;
  }

  try {
    if (type === "quiz_reward") {
      await processQuizReward(job, attemptId, userId, rewardAmount);
    } else if (type === "purchase_reward") {
      await processPurchaseReward(job, userId, rewardAmount, attemptId);
    } else if (type === "withdrawal") {
      // Guard rather than trust: without this a malformed job would call
      // sendKrc20Tokens with an undefined destination. Throwing keeps the
      // withdrawal in the failed set for inspection instead of burning tokens.
      if (!toAddress) {
        throw new Error(`Withdrawal job ${attemptId} is missing a destination address`);
      }
      await processWithdrawal(job, userId, toAddress, rewardAmount, attemptId);
    } else {
      logger.warn({ jobId: job.id, type }, "Unknown payout type, dropping");
    }
  } catch (error) {
    // Release so the retry can re-acquire; the DB-level unique constraints on
    // attemptId still prevent a double-credit if the failure was partial.
    await redis.del(lockKey);
    logger.error({ error, jobId: job.id }, "Failed to process reward job");
    throw error;
  }
}

// One worker per lane. Each lane runs PAYOUT_CONCURRENCY jobs at once, so the
// pipeline sustains PAYOUT_LANES * PAYOUT_CONCURRENCY simultaneous payouts.
const workers: Worker[] = allLaneNames().map(
  (name) =>
    new Worker(name, handlePayout, {
      connection: redis as never,
      concurrency: PAYOUT_CONCURRENCY,
    })
);

// Drain anything still sitting in the pre-shard queue from before this change.
workers.push(
  new Worker(LEGACY_PAYOUT_QUEUE, handlePayout, {
    connection: redis as never,
    concurrency: PAYOUT_CONCURRENCY,
  })
);

// Process quiz reward
async function processQuizReward(job: Job, attemptId: string, userId: number, rewardAmount: number) {
  // Get user
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }

  // Create reward record
  let reward = await prisma.reward.findUnique({ where: { attemptId } });
  if (!reward) {
    reward = await prisma.reward.create({
      data: {
        attemptId,
        userId,
        amount: rewardAmount,
        status: "pending",
      },
    });
  }

  // Update quiz attempt status
  await prisma.quizAttempt.update({
    where: { attemptId },
    data: { status: "settling" },
  });

  if (!ENABLE_REWARDS || DEMO_MODE) {
    logger.info({ attemptId }, "Rewards disabled or demo mode, marking as confirmed");
    // One transaction: a crash between these writes must not leave a confirmed
    // reward with no balance credit (or vice versa).
    await prisma.$transaction([
      prisma.reward.update({
        where: { id: reward.id },
        data: { status: "confirmed", confirmedAt: new Date() },
      }),
      prisma.quizAttempt.update({
        where: { attemptId },
        data: { status: "paid" },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          geekBalance: { increment: rewardAmount },
          totalEarnedGeek: { increment: rewardAmount },
        },
      }),
      prisma.treasuryLedger.create({
        data: {
          amount: -rewardAmount,
          reason: "quiz_reward",
          recipient: user.walletAddress || "",
          triggeringId: attemptId,
        },
      }),
    ]);
    return;
  }

  // Send KRC-20 tokens from treasury wallet
  const treasuryPrivateKey = process.env.TREASURY_PRIVATE_KEY;
  if (!treasuryPrivateKey) {
    throw new Error("Treasury private key not found");
  }
  
  // GEEK token ID - replace with actual token ID
  const GEEK_TOKEN_ID = "GEEK";
  // Convert amount to atomic units (assuming 8 decimals)
  const atomicAmount = (rewardAmount * 1e8).toString();
  
  const txid = await sendKrc20Tokens(
    treasuryPrivateKey,
    user.walletAddress || "",
    GEEK_TOKEN_ID,
    atomicAmount
  );

  // The send returned a txid, so the payout is committed on-chain. Settle
  // immediately — the old code slept 5s here to "simulate" confirmation, which
  // pinned a worker slot for 5 seconds per payout and was the single biggest
  // throughput limit in the pipeline.
  await prisma.$transaction([
    prisma.reward.update({
      where: { id: reward.id },
      data: { status: "confirmed", txid, confirmedAt: new Date() },
    }),
    prisma.quizAttempt.update({
      where: { attemptId },
      data: { status: "paid" },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        geekBalance: { increment: rewardAmount },
        totalEarnedGeek: { increment: rewardAmount },
      },
    }),
    prisma.treasuryLedger.create({
      data: {
        amount: -rewardAmount,
        reason: "quiz_reward",
        recipient: user.walletAddress || "",
        triggeringId: attemptId,
      },
    }),
  ]);

  logger.info({ attemptId, txid }, "Reward processed successfully");
}

// Process purchase reward
async function processPurchaseReward(job: Job, userId: number, rewardAmount: number, purchaseId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }

  // Update user balance
  await prisma.user.update({
    where: { id: userId },
    data: {
      geekBalance: { increment: rewardAmount },
      totalEarnedGeek: { increment: rewardAmount },
    },
  });

  // Update purchase status
  await prisma.purchase.update({
    where: { stripeSessionId: purchaseId },
    data: { status: "completed" },
  });

  // Add treasury ledger entry
  await prisma.treasuryLedger.create({
    data: {
      amount: rewardAmount,
      reason: "purchase",
      recipient: user.walletAddress || "",
      triggeringId: purchaseId,
    },
  });

  logger.info({ purchaseId, rewardAmount }, "Purchase reward processed");
}

// Process withdrawal
async function processWithdrawal(job: Job, userId: number, toAddress: string, amount: number, withdrawalId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.encryptedPrivKey) {
    throw new Error("User or private key not found");
  }

  // Update withdrawal status
  await prisma.withdrawal.update({
    where: { id: parseInt(withdrawalId) },
    data: { status: "processing" },
  });

  if (!ENABLE_REWARDS || DEMO_MODE) {
    logger.info({ withdrawalId }, "Rewards disabled or demo mode, marking as completed");
    const txid = `withdraw_tx_${Date.now()}`;
    await prisma.withdrawal.update({
      where: { id: parseInt(withdrawalId) },
      data: { status: "completed", txid },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { geekBalance: { decrement: amount } },
    });
    await prisma.treasuryLedger.create({
      data: {
        amount: amount,
        reason: "withdrawal",
        recipient: toAddress,
        triggeringId: withdrawalId,
      },
    });
    return;
  }

  // Send KRC-20 tokens from user's custodial wallet
  const decryptedPrivateKey = decryptPrivateKey(user.encryptedPrivKey as string);
  
  // GEEK token ID - replace with actual token ID
  const GEEK_TOKEN_ID = "GEEK";
  // Convert amount to atomic units (assuming 8 decimals)
  const atomicAmount = (amount * 1e8).toString();
  
  const txid = await sendKrc20Tokens(
    decryptedPrivateKey,
    toAddress,
    GEEK_TOKEN_ID,
    atomicAmount
  );

  await prisma.withdrawal.update({
    where: { id: parseInt(withdrawalId) },
    data: { status: "completed", txid },
  });
  await prisma.user.update({
    where: { id: userId },
    data: { geekBalance: { decrement: amount } },
  });
  await prisma.treasuryLedger.create({
    data: {
      amount: amount,
      reason: "withdrawal",
      recipient: toAddress,
      triggeringId: withdrawalId,
    },
  });

  logger.info({ withdrawalId, txid }, "Withdrawal processed successfully");
}

// Event handlers
for (const w of workers) {
  w.on("completed", (job) => {
    logger.info({ jobId: job.id, queue: w.name }, "Reward job completed");
  });

  w.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, queue: w.name, err }, "Reward job failed");
  });
}

const shutdown = async () => {
  logger.info("Reward workers shutting down...");
  await Promise.all(workers.map((w) => w.close()));
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

logger.info(
  { lanes: PAYOUT_LANES, concurrencyPerLane: PAYOUT_CONCURRENCY, maxParallel: PAYOUT_LANES * PAYOUT_CONCURRENCY },
  "Reward workers started"
);
