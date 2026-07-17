import Redis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { Worker } from "bullmq";
import { logger } from "../lib/logger";
import { decryptPrivateKey } from "../lib/security";
import { sendKrc20Tokens } from "../lib/kaspa";
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const DEMO_MODE = process.env.DEMO_MODE === "true";
const MIN_SCORE_FOR_REWARD = parseInt(process.env.MIN_SCORE_FOR_REWARD || "70", 10);
const ENABLE_REWARDS = (process.env.ENABLE_REWARDS || "false").toLowerCase() === "true";
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY || "";
// Reward worker
const worker = new Worker("reward-processing", async (job) => {
    logger.info({ jobId: job.id, data: job.data }, "Processing reward job");
    const { attemptId, userId, rewardAmount, type, toAddress } = job.data;
    // Check idempotency
    const lockKey = `lock:reward:${attemptId}`;
    const lockAcquired = await redis.set(lockKey, "1", "EX", 300, "NX");
    if (!lockAcquired) {
        logger.info({ attemptId }, "Reward job already processed, skipping");
        return;
    }
    try {
        if (type === "quiz_reward") {
            await processQuizReward(job, attemptId, userId, rewardAmount);
        }
        else if (type === "purchase_reward") {
            await processPurchaseReward(job, userId, rewardAmount, attemptId);
        }
        else if (type === "withdrawal") {
            await processWithdrawal(job, userId, toAddress, rewardAmount, attemptId);
        }
    }
    catch (error) {
        logger.error({ error, jobId: job.id }, "Failed to process reward job");
        throw error;
    }
    finally {
        await redis.del(lockKey);
    }
}, { connection: redis });
// Process quiz reward
async function processQuizReward(job, attemptId, userId, rewardAmount) {
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
        await prisma.reward.update({
            where: { id: reward.id },
            data: { status: "confirmed", confirmedAt: new Date() },
        });
        await prisma.quizAttempt.update({
            where: { attemptId },
            data: { status: "paid" },
        });
        await prisma.user.update({
            where: { id: userId },
            data: {
                geekBalance: { increment: rewardAmount },
                totalEarnedGeek: { increment: rewardAmount },
            },
        });
        // Add treasury ledger entry
        await prisma.treasuryLedger.create({
            data: {
                amount: -rewardAmount,
                reason: "quiz_reward",
                recipient: user.walletAddress || "",
                triggeringId: attemptId,
            },
        });
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
    const txid = await sendKrc20Tokens(treasuryPrivateKey, user.walletAddress || "", GEEK_TOKEN_ID, atomicAmount);
    await prisma.reward.update({
        where: { id: reward.id },
        data: { status: "sent", txid },
    });
    // Simulate confirmation delay
    await new Promise(resolve => setTimeout(resolve, 5000));
    await prisma.reward.update({
        where: { id: reward.id },
        data: { status: "confirmed", confirmedAt: new Date() },
    });
    await prisma.quizAttempt.update({
        where: { attemptId },
        data: { status: "paid" },
    });
    // Update user balance
    await prisma.user.update({
        where: { id: userId },
        data: {
            geekBalance: { increment: rewardAmount },
            totalEarnedGeek: { increment: rewardAmount },
        },
    });
    // Add treasury ledger entry
    await prisma.treasuryLedger.create({
        data: {
            amount: -rewardAmount,
            reason: "quiz_reward",
            recipient: user.walletAddress || "",
            triggeringId: attemptId,
        },
    });
    logger.info({ attemptId, txid }, "Reward processed successfully");
}
// Process purchase reward
async function processPurchaseReward(job, userId, rewardAmount, purchaseId) {
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
async function processWithdrawal(job, userId, toAddress, amount, withdrawalId) {
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
    const decryptedPrivateKey = decryptPrivateKey(user.encryptedPrivKey);
    // GEEK token ID - replace with actual token ID
    const GEEK_TOKEN_ID = "GEEK";
    // Convert amount to atomic units (assuming 8 decimals)
    const atomicAmount = (amount * 1e8).toString();
    const txid = await sendKrc20Tokens(decryptedPrivateKey, toAddress, GEEK_TOKEN_ID, atomicAmount);
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
worker.on("completed", (job) => {
    logger.info({ jobId: job.id }, "Reward job completed");
});
worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err }, "Reward job failed");
});
// Start worker
logger.info("Reward worker started");
