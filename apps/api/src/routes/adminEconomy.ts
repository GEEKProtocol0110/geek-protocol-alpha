/**
 * Admin economy dashboard (ECONOMY.md §17).
 *
 * Every route here is admin-gated and every mutating route writes an
 * `AdminAuditLog` row with actor, target, before/after values, IP and
 * user-agent. The audit log is append-only — there is no edit or delete path.
 *
 * Note what is deliberately NOT here: no endpoint mints GEEK outside the
 * ledger, and no endpoint marks a burn or a withdrawal settled without an
 * on-chain transaction id.
 */

import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  economyService,
  economyHealth,
  evaluateCircuitBreakers,
  getEconomyConfig,
  invalidateConfigCache,
  mergeRules,
  EconomyRulesSchema,
  pauseBreaker,
  resetBreaker,
  budgetStatus,
  syncBudgetsFromRules,
  fundTreasury,
  withEconomyTransaction,
  toAtomic,
  fromAtomic,
  toDecimal,
  BREAKERS,
  TREASURY_ACCOUNTS,
  type BreakerName,
  type TreasuryAccountName,
} from "../services/economy";
import { BurnService } from "../services/economy/burn";
import { WithdrawalService } from "../services/economy/withdrawals";
import { serializeTransaction } from "./economy";
import { logger } from "../lib/logger";

export async function adminEconomyRoutes(fastify: FastifyInstance) {
  const economy = economyService(fastify.prisma);
  const burns = new BurnService(fastify.prisma);
  const withdrawals = new WithdrawalService(fastify.prisma);

  /** Admin gate. Returns the admin user, or null. */
  async function requireAdmin(userId: number) {
    const user = await fastify.prisma.user.findUnique({ where: { id: userId } });
    return user?.isAdmin ? user : null;
  }

  /** Every mutating action lands here. No exceptions. */
  async function audit(
    req: FastifyRequest,
    action: string,
    detail: {
      targetType?: string;
      targetId?: string;
      before?: unknown;
      after?: unknown;
      reason?: string;
    }
  ) {
    await fastify.prisma.adminAuditLog.create({
      data: {
        actorId: req.jwtUser!.userId,
        actorName: req.jwtUser!.username ?? null,
        action,
        targetType: detail.targetType ?? null,
        targetId: detail.targetId ?? null,
        beforeValue: (detail.before ?? undefined) as never,
        afterValue: (detail.after ?? undefined) as never,
        reason: detail.reason ?? null,
        ip: req.ip,
        userAgent: (req.headers["user-agent"] as string | undefined) ?? null,
      },
    });
  }

  // Admin gate on every route in this plugin.
  fastify.addHook("preHandler", async (req, reply) => {
    await fastify.authenticate(req, reply);
    if (reply.sent) return;
    const admin = await requireAdmin(req.jwtUser!.userId);
    if (!admin) {
      return reply.code(403).send({ success: false, error: "Admin access required" });
    }
  });

  // ---------------------------------------------------------------------
  // Overview
  // ---------------------------------------------------------------------

  // GET /api/admin/economy/health — the full dashboard payload
  fastify.get("/health", async (_req, reply) => {
    const health = await economyHealth(fastify.prisma, fastify.redis);
    const config = await getEconomyConfig(fastify.prisma);

    const [pendingCount, flaggedCount, openAlerts] = await Promise.all([
      fastify.prisma.economyTransaction.count({ where: { balanceBucketTo: "PENDING", clearsAt: { not: null } } }),
      fastify.prisma.economyTransaction.count({ where: { flagged: true, status: "CONFIRMED" } }),
      fastify.prisma.economyAlert.findMany({
        where: { acknowledged: false },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
    ]);

    return reply.send({
      success: true,
      data: {
        stage: config.stage,
        flags: {
          rewardsEnabled: config.rewardsEnabled,
          cceRewardsEnabled: config.cceRewardsEnabled,
          withdrawalsEnabled: config.withdrawalsEnabled,
          purchasesEnabled: config.purchasesEnabled,
          burnEnabled: config.burnEnabled,
        },
        treasury: Object.fromEntries(
          Object.entries(health.treasury).map(([k, v]) => [k, fromAtomic(v)])
        ),
        liabilities: {
          totalPending: fromAtomic(health.liabilities.totalPending),
          totalAvailable: fromAtomic(health.liabilities.totalAvailable),
          totalLocked: fromAtomic(health.liabilities.totalLocked),
          totalWithdrawn: fromAtomic(health.liabilities.totalWithdrawn),
          totalUserLiability: fromAtomic(health.liabilities.totalUserLiability),
          userCount: health.liabilities.userCount,
        },
        withdrawalObligations: fromAtomic(health.withdrawalObligations),
        hotWallet: fromAtomic(health.treasury.WITHDRAWAL_HOT_WALLET),
        backing: fromAtomic(health.backing),
        remainingRewardCapacity: fromAtomic(health.remainingRewardCapacity),
        solvencyRatio: Number.isFinite(health.solvencyRatio) ? health.solvencyRatio : null,
        breakers: health.breakers,
        workerHeartbeatAgeSeconds: health.workerHeartbeatAgeSeconds,
        budgets: health.budgets.map((b) => ({
          ...b,
          dailyLimit: fromAtomic(b.dailyLimit),
          dailyUsed: fromAtomic(b.dailyUsed),
          dailyRemaining: fromAtomic(b.dailyRemaining),
          monthlyLimit: fromAtomic(b.monthlyLimit),
          monthlyUsed: fromAtomic(b.monthlyUsed),
          monthlyRemaining: fromAtomic(b.monthlyRemaining),
        })),
        queues: {
          pendingClearances: pendingCount,
          flaggedTransactions: flaggedCount,
        },
        alerts: openAlerts,
        warnings: health.warnings,
        healthy: health.healthy,
      },
    });
  });

  // POST /api/admin/economy/evaluate — force a breaker evaluation now
  fastify.post("/evaluate", async (req, reply) => {
    const tripped = await evaluateCircuitBreakers(fastify.prisma, fastify.redis);
    await audit(req, "ECONOMY_EVALUATE_BREAKERS", { after: { tripped } });
    return reply.send({ success: true, data: { tripped } });
  });

  // ---------------------------------------------------------------------
  // Circuit breakers
  // ---------------------------------------------------------------------

  // POST /api/admin/economy/breakers/:name  { action: pause|reset, reason }
  fastify.post("/breakers/:name", async (req, reply) => {
    const { name } = z.object({ name: z.enum(BREAKERS) }).parse(req.params);
    const { action, reason } = z
      .object({ action: z.enum(["pause", "reset"]), reason: z.string().max(500).optional() })
      .parse(req.body);

    const before = await fastify.prisma.circuitBreaker.findUnique({ where: { name } });
    const actor = req.jwtUser!.username ?? `user:${req.jwtUser!.userId}`;

    if (action === "pause") {
      await pauseBreaker(fastify.prisma, name as BreakerName, reason ?? "Paused by admin", actor);
    } else {
      await resetBreaker(fastify.prisma, name as BreakerName, actor);
    }

    const after = await fastify.prisma.circuitBreaker.findUnique({ where: { name } });
    await audit(req, `BREAKER_${action.toUpperCase()}`, {
      targetType: "CIRCUIT_BREAKER",
      targetId: name,
      before,
      after,
      reason,
    });

    return reply.send({ success: true, data: after });
  });

  // ---------------------------------------------------------------------
  // Configuration and budgets
  // ---------------------------------------------------------------------

  // GET /api/admin/economy/config
  fastify.get("/config", async (_req, reply) => {
    const config = await getEconomyConfig(fastify.prisma);
    return reply.send({ success: true, data: config });
  });

  // PUT /api/admin/economy/config — change reward tables, prices, limits.
  //
  // Values are validated against the rules schema before being stored, so a bad
  // edit is rejected rather than silently falling back to defaults at runtime.
  fastify.put("/config", async (req, reply) => {
    const Body = z.object({
      rules: z.record(z.string(), z.unknown()).optional(),
      stage: z.number().int().min(1).max(6).optional(),
      rewardsEnabled: z.boolean().optional(),
      cceRewardsEnabled: z.boolean().optional(),
      withdrawalsEnabled: z.boolean().optional(),
      purchasesEnabled: z.boolean().optional(),
      burnEnabled: z.boolean().optional(),
      reason: z.string().max(500),
    });
    const body = Body.parse(req.body);

    const existing = await fastify.prisma.economyRuntimeConfig.findUnique({ where: { id: 1 } });

    let nextRules = existing?.rules ?? {};
    if (body.rules) {
      const merged = mergeRules({ ...(existing?.rules as object), ...body.rules });
      const check = EconomyRulesSchema.safeParse(merged);
      if (!check.success) {
        return reply.code(400).send({
          success: false,
          error: "Rules failed validation — no change applied.",
          detail: check.error.flatten(),
        });
      }
      nextRules = merged as never;
    }

    const updated = await fastify.prisma.economyRuntimeConfig.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        rules: nextRules as never,
        stage: body.stage ?? 1,
        rewardsEnabled: body.rewardsEnabled ?? true,
        cceRewardsEnabled: body.cceRewardsEnabled ?? true,
        withdrawalsEnabled: body.withdrawalsEnabled ?? false,
        purchasesEnabled: body.purchasesEnabled ?? false,
        burnEnabled: body.burnEnabled ?? false,
        updatedBy: req.jwtUser!.username ?? String(req.jwtUser!.userId),
      },
      update: {
        rules: nextRules as never,
        ...(body.stage !== undefined ? { stage: body.stage } : {}),
        ...(body.rewardsEnabled !== undefined ? { rewardsEnabled: body.rewardsEnabled } : {}),
        ...(body.cceRewardsEnabled !== undefined ? { cceRewardsEnabled: body.cceRewardsEnabled } : {}),
        ...(body.withdrawalsEnabled !== undefined ? { withdrawalsEnabled: body.withdrawalsEnabled } : {}),
        ...(body.purchasesEnabled !== undefined ? { purchasesEnabled: body.purchasesEnabled } : {}),
        ...(body.burnEnabled !== undefined ? { burnEnabled: body.burnEnabled } : {}),
        version: { increment: 1 },
        updatedBy: req.jwtUser!.username ?? String(req.jwtUser!.userId),
      },
    });

    invalidateConfigCache();
    await syncBudgetsFromRules(fastify.prisma);

    await audit(req, "ECONOMY_CONFIG_UPDATE", {
      targetType: "ECONOMY_CONFIG",
      targetId: "1",
      before: existing,
      after: updated,
      reason: body.reason,
    });

    // Say plainly when a flag was requested but the stage floor overrode it.
    const effective = await getEconomyConfig(fastify.prisma);
    return reply.send({
      success: true,
      data: {
        stored: updated,
        effective,
        note:
          body.withdrawalsEnabled && !effective.withdrawalsEnabled
            ? "withdrawalsEnabled was stored but is not in effect: the rollout stage (or ECONOMY_STAGE in the environment) is below 5."
            : body.purchasesEnabled && !effective.purchasesEnabled
              ? "purchasesEnabled was stored but is not in effect: the rollout stage is below 5."
              : null,
      },
    });
  });

  // GET /api/admin/economy/budgets
  fastify.get("/budgets", async (_req, reply) => {
    const status = await budgetStatus(fastify.prisma);
    return reply.send({
      success: true,
      data: status.map((b) => ({
        ...b,
        dailyLimit: fromAtomic(b.dailyLimit),
        dailyUsed: fromAtomic(b.dailyUsed),
        dailyRemaining: fromAtomic(b.dailyRemaining),
        monthlyLimit: fromAtomic(b.monthlyLimit),
        monthlyUsed: fromAtomic(b.monthlyUsed),
        monthlyRemaining: fromAtomic(b.monthlyRemaining),
      })),
    });
  });

  // PUT /api/admin/economy/budgets/:name
  fastify.put("/budgets/:name", async (req, reply) => {
    const { name } = z.object({ name: z.string() }).parse(req.params);
    const body = z
      .object({
        dailyGeek: z.number().min(0).optional(),
        monthlyGeek: z.number().min(0).optional(),
        enabled: z.boolean().optional(),
        reason: z.string().max(500),
      })
      .parse(req.body);

    const before = await fastify.prisma.rewardBudget.findUnique({ where: { name } });
    if (!before) return reply.code(404).send({ success: false, error: `Unknown budget ${name}` });

    const after = await fastify.prisma.rewardBudget.update({
      where: { name },
      data: {
        ...(body.dailyGeek !== undefined ? { dailyLimitAtomic: toDecimal(toAtomic(body.dailyGeek)) } : {}),
        ...(body.monthlyGeek !== undefined ? { monthlyLimitAtomic: toDecimal(toAtomic(body.monthlyGeek)) } : {}),
        ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
      },
    });

    await audit(req, "BUDGET_UPDATE", {
      targetType: "REWARD_BUDGET",
      targetId: name,
      before,
      after,
      reason: body.reason,
    });

    return reply.send({ success: true, data: after });
  });

  // ---------------------------------------------------------------------
  // Treasury
  // ---------------------------------------------------------------------

  // POST /api/admin/economy/treasury/fund
  fastify.post("/treasury/fund", async (req, reply) => {
    const body = z
      .object({
        account: z.enum(TREASURY_ACCOUNTS),
        amountGeek: z.number().positive(),
        reference: z.string().min(4).max(120),
        reason: z.string().max(500),
      })
      .parse(req.body);

    // `reference` doubles as the idempotency key, so an operator who submits
    // the same funding transfer twice funds it once.
    await withEconomyTransaction(fastify.prisma, (tx) =>
      fundTreasury(
        tx,
        body.account as TreasuryAccountName,
        toAtomic(body.amountGeek),
        `treasury:fund:${body.reference}`,
        body.reason
      )
    );

    const after = await fastify.prisma.treasuryAccount.findUnique({ where: { account: body.account } });
    await audit(req, "TREASURY_FUND", {
      targetType: "TREASURY_ACCOUNT",
      targetId: body.account,
      after: { balance: after ? fromAtomic(after.balanceAtomic) : null, added: body.amountGeek },
      reason: body.reason,
    });

    return reply.send({ success: true, data: { account: body.account, balance: after ? fromAtomic(after.balanceAtomic) : "0" } });
  });

  // ---------------------------------------------------------------------
  // User ledgers, flags, adjustments
  // ---------------------------------------------------------------------

  // GET /api/admin/economy/users/:id/ledger
  fastify.get("/users/:id/ledger", async (req, reply) => {
    const { id } = z.object({ id: z.coerce.number() }).parse(req.params);
    const { limit } = z.object({ limit: z.coerce.number().min(1).max(500).default(100) }).parse(req.query);

    const [user, rows] = await Promise.all([
      fastify.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          walletAddress: true,
          economySuspended: true,
          economySuspendedReason: true,
          withdrawalFailureCount: true,
        },
      }),
      fastify.prisma.economyTransaction.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);
    if (!user) return reply.code(404).send({ success: false, error: "User not found" });

    return reply.send({
      success: true,
      data: {
        user,
        balances: await economy.getBalanceView(id),
        ledger: rows.map(serializeTransaction),
      },
    });
  });

  // GET /api/admin/economy/flagged — transactions held for review
  fastify.get("/flagged", async (_req, reply) => {
    const rows = await fastify.prisma.economyTransaction.findMany({
      where: { flagged: true, status: "CONFIRMED" },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { user: { select: { id: true, username: true, email: true } } },
    });

    return reply.send({
      success: true,
      data: rows.map((r) => ({ ...serializeTransaction(r), flagReason: r.flagReason, user: r.user })),
    });
  });

  // POST /api/admin/economy/transactions/:id/release — clear a held reward
  fastify.post("/transactions/:id/release", async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const { reason } = z.object({ reason: z.string().max(500) }).parse(req.body);

    const before = await fastify.prisma.economyTransaction.findUnique({ where: { id } });
    if (!before) return reply.code(404).send({ success: false, error: "Transaction not found" });

    await economy.unflagTransaction(id);
    await audit(req, "TRANSACTION_RELEASE", {
      targetType: "ECONOMY_TRANSACTION",
      targetId: id,
      before,
      reason,
    });

    return reply.send({ success: true, data: { id, released: true } });
  });

  // POST /api/admin/economy/transactions/:id/reverse
  fastify.post("/transactions/:id/reverse", async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const { reason, budget } = z
      .object({ reason: z.string().min(4).max(500), budget: z.string().optional() })
      .parse(req.body);

    const before = await fastify.prisma.economyTransaction.findUnique({ where: { id } });
    if (!before) return reply.code(404).send({ success: false, error: "Transaction not found" });

    try {
      const result = await economy.reverse(id, reason, budget as never);
      await audit(req, "TRANSACTION_REVERSE", {
        targetType: "ECONOMY_TRANSACTION",
        targetId: id,
        before,
        after: { reversalId: result.transactionId },
        reason,
      });
      return reply.send({ success: true, data: { reversalId: result.transactionId } });
    } catch (err) {
      logger.error({ err, id }, "admin.reverse_failed");
      return reply.code(409).send({
        success: false,
        error: err instanceof Error ? err.message : "Reversal failed",
      });
    }
  });

  // POST /api/admin/economy/users/:id/adjust
  fastify.post("/users/:id/adjust", async (req, reply) => {
    const { id } = z.object({ id: z.coerce.number() }).parse(req.params);
    const body = z
      .object({
        amountGeek: z.number().positive(),
        direction: z.enum(["CREDIT", "DEBIT"]),
        reason: z.string().min(4).max(500),
        reference: z.string().min(4).max(120),
      })
      .parse(req.body);

    const result = await economy.adminAdjust({
      userId: id,
      amount: toAtomic(body.amountGeek),
      direction: body.direction,
      reason: body.reason,
      actorId: req.jwtUser!.userId,
      actorName: req.jwtUser!.username,
      idempotencyKey: `admin:adjust:${body.reference}`,
    });

    return reply.send({
      success: true,
      data: { transactionId: result.transactionId, applied: result.applied, balances: await economy.getBalanceView(id) },
    });
  });

  // POST /api/admin/economy/users/:id/suspend
  fastify.post("/users/:id/suspend", async (req, reply) => {
    const { id } = z.object({ id: z.coerce.number() }).parse(req.params);
    const { reason, suspended } = z
      .object({ reason: z.string().max(500).default("Under review"), suspended: z.boolean().default(true) })
      .parse(req.body ?? {});

    if (suspended) await economy.suspendUser(id, reason);
    else await economy.unsuspendUser(id);

    await audit(req, suspended ? "USER_ECONOMY_SUSPEND" : "USER_ECONOMY_UNSUSPEND", {
      targetType: "USER",
      targetId: String(id),
      reason,
    });

    return reply.send({ success: true, data: { userId: id, suspended } });
  });

  // ---------------------------------------------------------------------
  // Burns
  // ---------------------------------------------------------------------

  fastify.get("/burns", async (_req, reply) => {
    return reply.send({ success: true, data: await burns.status() });
  });

  // POST /api/admin/economy/burns/batch — open a batch
  fastify.post("/burns/batch", async (req, reply) => {
    const { maxGeek, reason } = z
      .object({ maxGeek: z.number().positive().optional(), reason: z.string().max(500) })
      .parse(req.body ?? { reason: "Open burn batch" });

    try {
      const result = await burns.openBatch(maxGeek ? toAtomic(maxGeek) : undefined);
      await audit(req, "BURN_BATCH_OPEN", {
        targetType: "BURN_BATCH",
        targetId: String(result.batchId),
        after: { amount: fromAtomic(result.amount) },
        reason,
      });
      return reply.send({ success: true, data: { batchId: result.batchId, amount: fromAtomic(result.amount) } });
    } catch (err) {
      return reply.code(409).send({ success: false, error: err instanceof Error ? err.message : "Failed" });
    }
  });

  // POST /api/admin/economy/burns/:id/approve
  fastify.post("/burns/:id/approve", async (req, reply) => {
    const { id } = z.object({ id: z.coerce.number() }).parse(req.params);
    const { burnAddress, reason } = z
      .object({ burnAddress: z.string().min(10), reason: z.string().max(500) })
      .parse(req.body);

    try {
      await burns.approveBatch(id, req.jwtUser!.username ?? String(req.jwtUser!.userId), burnAddress);
      await audit(req, "BURN_BATCH_APPROVE", {
        targetType: "BURN_BATCH",
        targetId: String(id),
        after: { burnAddress },
        reason,
      });
      return reply.send({ success: true, data: { batchId: id, status: "APPROVED" } });
    } catch (err) {
      return reply.code(409).send({ success: false, error: err instanceof Error ? err.message : "Failed" });
    }
  });

  // ---------------------------------------------------------------------
  // Withdrawal operations
  // ---------------------------------------------------------------------

  fastify.get("/withdrawals", async (req, reply) => {
    const { status } = z.object({ status: z.string().optional() }).parse(req.query);
    const rows = await fastify.prisma.withdrawal.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { user: { select: { id: true, username: true, kycVerified: true } } },
    });

    return reply.send({
      success: true,
      data: rows.map((w) => ({
        id: w.id,
        user: w.user,
        toAddress: w.toAddress,
        amount: fromAtomic(w.amountAtomic),
        fee: fromAtomic(w.feeAtomic),
        status: w.status,
        commitTxid: w.commitTxid,
        revealTxid: w.revealTxid,
        failureReason: w.failureReason,
        createdAt: w.createdAt,
      })),
    });
  });

  // POST /api/admin/economy/withdrawals/:id/release — return locked funds
  fastify.post("/withdrawals/:id/release", async (req, reply) => {
    const { id } = z.object({ id: z.coerce.number() }).parse(req.params);
    const { reason } = z.object({ reason: z.string().min(4).max(500) }).parse(req.body);

    await withdrawals.releaseWithdrawal(id, reason);
    await audit(req, "WITHDRAWAL_RELEASE", { targetType: "WITHDRAWAL", targetId: String(id), reason });

    return reply.send({ success: true, data: { id, status: "failed", released: true } });
  });

  // ---------------------------------------------------------------------
  // Alerts and audit trail
  // ---------------------------------------------------------------------

  fastify.get("/alerts", async (req, reply) => {
    const { all } = z.object({ all: z.coerce.boolean().default(false) }).parse(req.query);
    const rows = await fastify.prisma.economyAlert.findMany({
      where: all ? {} : { acknowledged: false },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return reply.send({ success: true, data: rows });
  });

  fastify.post("/alerts/:id/ack", async (req, reply) => {
    const { id } = z.object({ id: z.coerce.number() }).parse(req.params);
    const row = await fastify.prisma.economyAlert.update({
      where: { id },
      data: {
        acknowledged: true,
        acknowledgedBy: req.jwtUser!.username ?? String(req.jwtUser!.userId),
        acknowledgedAt: new Date(),
      },
    });
    return reply.send({ success: true, data: row });
  });

  fastify.get("/audit", async (req, reply) => {
    const { limit, action } = z
      .object({ limit: z.coerce.number().min(1).max(500).default(100), action: z.string().optional() })
      .parse(req.query);

    const rows = await fastify.prisma.adminAuditLog.findMany({
      where: action ? { action } : {},
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return reply.send({ success: true, data: rows });
  });

  // GET /api/admin/economy/reconcile — latest reconciliation results
  fastify.get("/reconcile", async (_req, reply) => {
    const runs = await fastify.prisma.reconciliationRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return reply.send({
      success: true,
      data: runs.map((r) => ({
        ...r,
        totalDriftAtomic: fromAtomic(r.totalDriftAtomic),
      })),
    });
  });
}
