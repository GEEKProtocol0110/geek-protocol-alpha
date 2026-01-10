import Redis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { logger } from "../lib/logger";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
});
const prisma = new PrismaClient();

const MIN_SCORE_FOR_REWARD = parseInt(process.env.MIN_SCORE_FOR_REWARD || "70");
const ENABLE_REWARDS = (process.env.ENABLE_REWARDS || "false").toLowerCase() === "true";

async function processRewardJob(job: { attemptId: string }) {
  const { attemptId } = job;
  const lockKey = `lock:reward:${attemptId}`;
  const gotLock = await (redis as any).set(lockKey, "1", "EX", 300, "NX"); // 5 min lock
  if (!gotLock) {
    logger.warn({ attemptId }, "Reward lock exists, skipping");
    return;
  }

  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt) return;

  // Idempotency: If reward already exists, return
  const existing = await prisma.reward.findUnique({ where: { attemptId } });
  if (existing) {
    logger.info({ attemptId }, "Reward already exists");
    return;
  }

  // Eligibility checks (simplified): score threshold
  if (attempt.scorePct < MIN_SCORE_FOR_REWARD) {
    logger.info({ attemptId }, "Attempt below threshold, no reward");
    return;
  }

  // TODO: Check wallet verification and $GEEK hold via Kasplex
  // For MVP worker, create a reward row and simulate payout
  const userId = attempt.userId;

  const reward = await prisma.reward.create({
    data: {
      attemptId,
      userId,
      amount: BigInt(1000), // demo amount
      status: "PENDING",
    },
  });

  if (!ENABLE_REWARDS) {
    logger.info({ attemptId }, "Rewards disabled, keeping PENDING");
    return;
  }

  // Simulate broadcast
  const txid = `TESTNET_TX_${Math.random().toString(36).slice(2)}`;
  await prisma.reward.update({
    where: { id: reward.id },
    data: { status: "SENT", txid },
  });

  // Simulate confirmation
  setTimeout(async () => {
    await prisma.reward.update({
      where: { id: reward.id },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    });
    logger.info({ attemptId, txid }, "Reward confirmed");
  }, 2000);
}

export async function startRewardWorker() {
  logger.info("Reward worker started");
  // Heartbeat updater
  const heartbeatKey = "worker:rewards:heartbeat";
  const updateHeartbeat = async () => {
    try {
      const payload = JSON.stringify({ ts: Date.now() });
      await (redis as any).set(heartbeatKey, payload, "EX", 60);
    } catch (err) {
      logger.warn({ err }, "Failed to update worker heartbeat");
    }
  };
  setInterval(updateHeartbeat, 15000);
  await updateHeartbeat();

  while (true) {
    try {
      const data = await redis.brpop("reward_queue", 5); // block pop
      if (data && data[1]) {
        const job = JSON.parse(String(data[1]));
        await processRewardJob(job);
      }
    } catch (err: any) {
      logger.error(err, "Worker error");
      await new Promise((res) => setTimeout(res, 1000));
    }
  }
}

if (require.main === module) {
  startRewardWorker();
}
