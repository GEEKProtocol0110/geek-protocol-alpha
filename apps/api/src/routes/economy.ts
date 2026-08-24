/**
 * Public economy endpoints.
 *
 * `/public-config` is what makes the website honest: the homepage reads round
 * fees, rewards, timers and CCE rates from here instead of hardcoding them, so
 * the site and the game cannot drift apart (ECONOMY.md §19.4).
 *
 * `/health` is the solvency dashboard. It is public on purpose — a protocol
 * that asks people to hold a balance should let them see whether that balance
 * is backed.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  economyService,
  economyHealth,
  getEconomyConfig,
  publicConfigView,
  fromAtomic,
  STAGE_LABELS,
  REAL_MONEY_STAGE,
} from "../services/economy";
import { BurnService } from "../services/economy/burn";

/** The status banner text, served from one place so every surface matches. */
export const ALPHA_BANNER = {
  level: "alpha" as const,
  title: "Public Alpha",
  body:
    "Core gameplay, profiles, leaderboards and the Community Content Engine are in active testing. " +
    "Rewards currently appear as internal Alpha balances. Real KRC-20 payouts and withdrawals are not " +
    "enabled. Economic parameters may change before Beta.",
};

export async function economyRoutes(fastify: FastifyInstance) {
  const economy = economyService(fastify.prisma);

  // GET /api/economy/public-config — the site's single source of economic truth
  fastify.get("/public-config", async (_req, reply) => {
    const config = await getEconomyConfig(fastify.prisma);
    reply.header("Cache-Control", "public, max-age=30");
    return reply.send({
      success: true,
      data: {
        ...publicConfigView(config),
        banner: ALPHA_BANNER,
      },
    });
  });

  // GET /api/economy/health — treasury, liabilities, burns, breakers, budgets
  fastify.get("/health", async (_req, reply) => {
    const health = await economyHealth(fastify.prisma, fastify.redis);
    reply.header("Cache-Control", "public, max-age=30");

    return reply.send({
      success: true,
      data: {
        stage: health.stage,
        stageLabel: STAGE_LABELS[health.stage] ?? `Stage ${health.stage}`,
        treasury: mapAtomic(health.treasury),
        liabilities: {
          totalPending: fromAtomic(health.liabilities.totalPending),
          totalAvailable: fromAtomic(health.liabilities.totalAvailable),
          totalLocked: fromAtomic(health.liabilities.totalLocked),
          totalWithdrawn: fromAtomic(health.liabilities.totalWithdrawn),
          totalUserLiability: fromAtomic(health.liabilities.totalUserLiability),
          userCount: health.liabilities.userCount,
        },
        totalWithdrawalObligations: fromAtomic(health.withdrawalObligations),
        burns: {
          pending: fromAtomic(health.burns.pending),
          confirmed: fromAtomic(health.burns.confirmed),
          note: "Confirmed burns require a real on-chain reveal transaction. None have been broadcast during Alpha.",
        },
        backing: fromAtomic(health.backing),
        remainingRewardCapacity: fromAtomic(health.remainingRewardCapacity),
        solvencyRatio: Number.isFinite(health.solvencyRatio)
          ? Number(health.solvencyRatio.toFixed(4))
          : null,
        circuitBreakers: health.breakers,
        workerHeartbeatAgeSeconds: health.workerHeartbeatAgeSeconds,
        budgets: health.budgets.map((b) => ({
          name: b.name,
          enabled: b.enabled,
          dailyLimit: fromAtomic(b.dailyLimit),
          dailyUsed: fromAtomic(b.dailyUsed),
          dailyRemaining: fromAtomic(b.dailyRemaining),
          monthlyRemaining: fromAtomic(b.monthlyRemaining),
          exhausted: b.exhausted,
          grantsToday: b.grantsToday,
        })),
        warnings: health.warnings,
        healthy: health.healthy,
      },
    });
  });

  // GET /api/economy/burns — public burn accounting
  fastify.get("/burns", async (_req, reply) => {
    const burns = new BurnService(fastify.prisma);
    return reply.send({ success: true, data: await burns.status() });
  });

  // GET /api/economy/balance — the caller's four balances
  fastify.get("/balance", { preHandler: fastify.authenticate }, async (req, reply) => {
    const userId = req.jwtUser!.userId;
    const config = await getEconomyConfig(fastify.prisma);
    const balances = await economy.getBalanceView(userId);

    return reply.send({
      success: true,
      data: {
        ...balances,
        // Say plainly what this balance is, everywhere it is shown.
        kind: config.stage < REAL_MONEY_STAGE ? "internal_alpha_balance" : "settled",
        withdrawable: config.withdrawalsEnabled,
        disclaimer:
          config.stage < REAL_MONEY_STAGE
            ? "This is an internal Alpha balance held in the GEEK Protocol database. It is not an on-chain KRC-20 token balance and cannot be withdrawn yet."
            : null,
      },
    });
  });

  // GET /api/economy/ledger — the caller's own transaction history
  fastify.get("/ledger", { preHandler: fastify.authenticate }, async (req, reply) => {
    const { limit, cursor } = z
      .object({ limit: z.coerce.number().min(1).max(200).default(50), cursor: z.string().optional() })
      .parse(req.query);

    const rows = await economy.getLedger(req.jwtUser!.userId, { limit, cursor });

    return reply.send({
      success: true,
      data: rows.map(serializeTransaction),
      nextCursor: rows.length === limit ? rows[rows.length - 1].id : null,
    });
  });

  // GET /api/economy/banner — status banner text for any surface that shows it
  fastify.get("/banner", async (_req, reply) => {
    const config = await getEconomyConfig(fastify.prisma);
    reply.header("Cache-Control", "public, max-age=60");
    return reply.send({
      success: true,
      data: { ...ALPHA_BANNER, stage: config.stage, show: config.stage < REAL_MONEY_STAGE },
    });
  });
}

function mapAtomic(record: Record<string, bigint>): Record<string, string> {
  return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, fromAtomic(v)]));
}

export function serializeTransaction(row: {
  id: string;
  transactionType: string;
  amountAtomic: unknown;
  balanceBucketFrom: string;
  balanceBucketTo: string;
  referenceType: string | null;
  referenceId: string | null;
  status: string;
  flagged: boolean;
  clearsAt: Date | null;
  createdAt: Date;
  onChainRevealTxid: string | null;
}) {
  return {
    id: row.id,
    type: row.transactionType,
    amount: fromAtomic(row.amountAtomic as never),
    from: row.balanceBucketFrom,
    to: row.balanceBucketTo,
    referenceType: row.referenceType,
    referenceId: row.referenceId,
    status: row.status,
    flagged: row.flagged,
    clearsAt: row.clearsAt,
    createdAt: row.createdAt,
    onChainTxid: row.onChainRevealTxid,
  };
}
