/**
 * Withdrawal routes.
 *
 * Withdrawals are DISABLED during Alpha. The service refuses at the top unless
 * the runtime config enables them AND the rollout stage is at least 5, so this
 * route cannot be turned on by a flag alone (ECONOMY.md §12, §23).
 *
 * The endpoints exist and are complete so the flow can be tested and audited —
 * but nothing here fabricates a transaction id, and nothing settles without a
 * real on-chain reveal txid.
 */

import { FastifyInstance } from "fastify";
import { z } from "zod";
import { logger } from "../lib/logger";
import { getGeekBalance } from "../lib/geekBalance";
import { enqueuePayout } from "../lib/payoutQueue";
import {
  economyService,
  getEconomyConfig,
  WithdrawalService,
  ALPHA_DISABLED_MESSAGE,
  REAL_MONEY_STAGE,
  fromAtomic,
} from "../services/economy";

const WithdrawSchema = z.object({
  toAddress: z.string().min(10).max(200),
  // A string keeps the amount exact all the way to atomic units; a JSON number
  // would already have lost precision by the time it arrived.
  amount: z.union([z.string(), z.number()]),
});

export async function withdrawalRoutes(fastify: FastifyInstance) {
  const economy = economyService(fastify.prisma);
  const withdrawals = new WithdrawalService(fastify.prisma);

  // GET /api/wallet/withdraw/status — can I withdraw, and if not, why not?
  fastify.get("/withdraw/status", { preHandler: fastify.authenticate }, async (req, reply) => {
    const config = await getEconomyConfig(fastify.prisma);
    const userId = req.jwtUser!.userId;
    const balances = await economy.getBalanceView(userId);

    return reply.send({
      success: true,
      data: {
        enabled: config.withdrawalsEnabled,
        stage: config.stage,
        reason: config.withdrawalsEnabled ? null : ALPHA_DISABLED_MESSAGE,
        limits: {
          minGeek: config.rules.withdrawal.minGeek,
          maxGeek: config.rules.withdrawal.maxGeek,
          dailyLimitGeek: config.rules.withdrawal.dailyLimitGeek,
          feePct: config.rules.withdrawal.feePct,
          kycThresholdGeek: config.rules.withdrawal.kycThresholdGeek,
        },
        withdrawnToday: fromAtomic(await withdrawals.dailyWithdrawnAtomic(userId)),
        balances,
      },
    });
  });

  // POST /api/wallet/withdraw — request a withdrawal
  fastify.post("/withdraw", { preHandler: fastify.authenticate }, async (req, reply) => {
    const parse = WithdrawSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.code(400).send({ success: false, error: parse.error.flatten() });
    }

    const config = await getEconomyConfig(fastify.prisma);
    if (!config.withdrawalsEnabled || config.stage < REAL_MONEY_STAGE) {
      // 503, not 400: the request is valid, the capability is not available.
      return reply.code(503).send({
        success: false,
        error: ALPHA_DISABLED_MESSAGE,
        code: "WITHDRAWALS_DISABLED",
        data: { stage: config.stage, requiredStage: REAL_MONEY_STAGE },
      });
    }

    const result = await withdrawals.requestWithdrawal({
      userId: req.jwtUser!.userId,
      toAddress: parse.data.toAddress,
      amountGeek: parse.data.amount,
    });

    if (!result.ok) {
      const status = result.refusal === "INSUFFICIENT_BALANCE" ? 400 : 422;
      return reply.code(status).send({ success: false, error: result.message, code: result.refusal });
    }

    // Hand the reservation to the payout worker. Without this the funds stay
    // locked forever and nothing ever attempts the transfer. Enqueued only
    // AFTER the reservation committed, so a queue failure cannot process a
    // withdrawal whose funds were never locked.
    try {
      await enqueuePayout({
        attemptId: String(result.withdrawalId),
        userId: req.jwtUser!.userId,
        toAddress: parse.data.toAddress,
        rewardAmount: Number(fromAtomic(result.net!)),
        type: "withdrawal",
      });
      await fastify.prisma.withdrawal.update({
        where: { id: result.withdrawalId! },
        data: { status: "queued" },
      });
    } catch (err) {
      // Queueing failed: give the money back rather than leaving it locked
      // against a job that will never run.
      logger.error({ err, withdrawalId: result.withdrawalId }, "withdrawal.enqueue_failed");
      await withdrawals.releaseWithdrawal(
        result.withdrawalId!,
        "Could not queue the withdrawal for processing. Your GEEK has been returned."
      );
      return reply.code(503).send({
        success: false,
        error: "Could not queue the withdrawal. Your GEEK has been returned to your available balance.",
        code: "QUEUE_UNAVAILABLE",
      });
    }

    return reply.send({
      success: true,
      data: {
        withdrawalId: result.withdrawalId,
        status: "pending",
        amount: fromAtomic(result.amount!),
        fee: fromAtomic(result.fee!),
        net: fromAtomic(result.net!),
        message: result.message,
      },
    });
  });

  // GET /api/wallet/withdrawals — the caller's withdrawal history
  fastify.get("/withdrawals", { preHandler: fastify.authenticate }, async (req, reply) => {
    const rows = await fastify.prisma.withdrawal.findMany({
      where: { userId: req.jwtUser!.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return reply.send({
      success: true,
      data: rows.map((w) => ({
        id: w.id,
        toAddress: w.toAddress,
        amount: fromAtomic(w.amountAtomic),
        fee: fromAtomic(w.feeAtomic),
        net: fromAtomic(w.netAtomic),
        status: w.status,
        // Only ever a real on-chain id, or null. Never a placeholder.
        commitTxid: w.commitTxid,
        revealTxid: w.revealTxid,
        confirmations: w.confirmations,
        failureReason: w.failureReason,
        createdAt: w.createdAt,
        confirmedAt: w.confirmedAt,
      })),
    });
  });

  // GET /api/wallet/balance — the four internal balances, plus on-chain if known
  fastify.get("/balance", { preHandler: fastify.authenticate }, async (req, reply) => {
    const userId = req.jwtUser!.userId;
    const config = await getEconomyConfig(fastify.prisma);

    const user = await fastify.prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true },
    });
    if (!user) return reply.code(404).send({ success: false, error: "User not found" });

    const balances = await economy.getBalanceView(userId);

    // The on-chain figure is a genuinely different number from the Alpha
    // balance, and the response says so rather than blurring the two.
    let onChainBalance = "0";
    if (user.walletAddress) {
      try {
        onChainBalance = await getGeekBalance(user.walletAddress);
      } catch (err) {
        logger.error({ err }, "Failed to fetch on-chain balance");
      }
    }

    return reply.send({
      success: true,
      data: {
        alphaBalance: balances,
        // Kept for older clients; equals the available bucket.
        custodialBalance: Number(balances.available),
        onChainBalance,
        onChainNote:
          "The on-chain figure is the KRC-20 balance held by your wallet address. It is separate from your internal Alpha balance and is not affected by gameplay.",
        withdrawable: config.withdrawalsEnabled,
        disclaimer:
          config.stage < REAL_MONEY_STAGE
            ? "Your GEEK balance is an internal Alpha balance held in the GEEK Protocol database. On-chain KRC-20 withdrawals are not enabled yet."
            : null,
      },
    });
  });
}
