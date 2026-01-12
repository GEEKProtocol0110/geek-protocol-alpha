import Redis from "ioredis";
import { PrismaClient, Prisma } from "@prisma/client";
import { logger } from "../lib/logger";

type RewardJob = { attemptId: string };
type AttemptWithRelations = Prisma.AttemptGetPayload<{ include: { user: true; reward: true } }>;

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
});
const prisma = new PrismaClient();

const MIN_SCORE_FOR_REWARD = parseInt(process.env.MIN_SCORE_FOR_REWARD || "70", 10);
const ENABLE_REWARDS = (process.env.ENABLE_REWARDS || "false").toLowerCase() === "true";
const CONFIRM_DELAY_MS = Math.max(parseInt(process.env.REWARD_CONFIRM_DELAY_MS || "3000", 10), 1000);
const REQUIRE_WALLET = (process.env.REWARD_REQUIRE_WALLET || "true").toLowerCase() === "true";
const REWARD_SATS_PER_CORRECT = readBigIntEnv("REWARD_SATS_PER_CORRECT", 1000n);

function readBigIntEnv(key: string, fallback: bigint): bigint {
  const raw = process.env[key];
  if (!raw) return fallback;
  try {
    return BigInt(raw);
  } catch (err) {
    logger.warn({ key, raw, err }, "Invalid bigint env; using fallback");
    return fallback;
  }
}

function calculateRewardAmount(correctAnswers: number): bigint {
  if (!Number.isFinite(correctAnswers) || correctAnswers <= 0) {
    return 0n;
  }
  return BigInt(correctAnswers) * REWARD_SATS_PER_CORRECT;
}

async function markFailedReward(attemptId: string, userId: string, reason: string) {
  try {
    await prisma.reward.upsert({
      where: { attemptId },
      create: {
        attemptId,
        userId,
        amount: 0n,
        status: "FAILED",
        error: reason.slice(0, 240),
      },
      update: {
        status: "FAILED",
        error: reason.slice(0, 240),
      },
    });
  } catch (err) {
    logger.error({ err, attemptId }, "Failed to persist failed reward state");
  }
}

function generateTxId(): string {
  return `SIM_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 10)}`;
}

function scheduleConfirmation(rewardId: string, attemptId: string, txid: string) {
  setTimeout(async () => {
    try {
      await prisma.reward.update({
        where: { id: rewardId },
        data: { status: "CONFIRMED", confirmedAt: new Date() },
      });
      logger.info({ attemptId, txid }, "Reward confirmed");
    } catch (err) {
      logger.error({ err, attemptId, txid }, "Failed to confirm reward");
    }
  }, CONFIRM_DELAY_MS);
}

async function processRewardJob(job: RewardJob) {
  if (!job?.attemptId) {
    logger.warn({ job }, "Invalid reward job payload");
    return;
  }

  const { attemptId } = job;
  const lockKey = `lock:reward:${attemptId}`;
  const gotLock = await redis.set(lockKey, "1", "EX", 300, "NX");
  if (!gotLock) {
    logger.warn({ attemptId }, "Reward lock exists, skipping");
    return;
  }

  let attempt: AttemptWithRelations | null = null;

  try {
    attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: { user: true, reward: true },
    });

    if (!attempt) {
      logger.error({ attemptId }, "Attempt not found for reward job");
      return;
    }

    const user = attempt.user;
    if (!user) {
      logger.error({ attemptId }, "Attempt missing user relation");
      return;
    }

    if (REQUIRE_WALLET && !user.walletAddress) {
      await markFailedReward(attempt.id, user.id, "Wallet not verified for rewards");
      logger.warn({ attemptId }, "User wallet missing; reward failed");
      return;
    }

    if (attempt.reward) {
      logger.info({ attemptId, status: attempt.reward.status }, "Reward already recorded");
      return;
    }

    if (attempt.scorePct < MIN_SCORE_FOR_REWARD) {
      await markFailedReward(
        attempt.id,
        user.id,
        `Score ${attempt.scorePct}% below threshold ${MIN_SCORE_FOR_REWARD}%`
      );
      logger.info({ attemptId }, "Attempt below reward threshold");
      return;
    }

    const amount = calculateRewardAmount(attempt.score);
    if (amount <= 0n) {
      await markFailedReward(attempt.id, user.id, "Attempt produced zero payout");
      logger.info({ attemptId }, "Attempt score yielded zero reward");
      return;
    }

    const reward = await prisma.reward.create({
      data: {
        attemptId: attempt.id,
        userId: user.id,
        amount,
        status: "PENDING",
      },
    });

    logger.info({ attemptId, amount: amount.toString() }, "Reward pending");

    if (!ENABLE_REWARDS) {
      logger.info({ attemptId }, "Rewards disabled; leaving reward pending");
      return;
    }

    const txid = generateTxId();
    await prisma.reward.update({
      where: { id: reward.id },
      data: { status: "SENT", txid },
    });
    logger.info({ attemptId, txid }, "Reward sent (simulated)");

    scheduleConfirmation(reward.id, attemptId, txid);
  } catch (err) {
    logger.error({ err, attemptId }, "Failed to process reward job");
    if (attempt?.user) {
      try {
        await markFailedReward(
          attempt.id,
          attempt.user.id,
          err instanceof Error ? err.message : "Unknown worker error"
        );
      } catch (markErr) {
        logger.error({ markErr, attemptId }, "Failed to mark reward failure");
      }
    }
  } finally {
    try {
      await redis.del(lockKey);
    } catch (lockErr) {
      logger.warn({ lockErr, attemptId }, "Failed to release reward lock");
    }
  }
}

export async function startRewardWorker() {
  logger.info("Reward worker started");
  const heartbeatKey = "worker:rewards:heartbeat";
  const updateHeartbeat = async () => {
    try {
      const payload = JSON.stringify({ ts: Date.now() });
      await redis.set(heartbeatKey, payload, "EX", 60);
    } catch (err) {
      logger.warn({ err }, "Failed to update worker heartbeat");
    }
  };
  setInterval(updateHeartbeat, 15000);
  await updateHeartbeat();

  while (true) {
    try {
      const data = await redis.brpop("reward_queue", 5);
      if (data && data[1]) {
        try {
          const jobCandidate = JSON.parse(String(data[1])) as unknown;
          if (isRewardJob(jobCandidate)) {
            await processRewardJob(jobCandidate);
          } else {
            logger.warn({ payload: jobCandidate }, "Ignoring invalid reward job structure");
          }
        } catch (parseErr) {
          logger.error({ parseErr, payload: data[1] }, "Invalid reward job payload");
        }
      }
    } catch (err) {
      logger.error({ err }, "Worker error");
      await new Promise((res) => setTimeout(res, 1000));
    }
  }
}

if (require.main === module) {
  void startRewardWorker();
}

function isRewardJob(candidate: unknown): candidate is RewardJob {
  return Boolean(candidate && typeof (candidate as { attemptId?: unknown }).attemptId === "string");
}
