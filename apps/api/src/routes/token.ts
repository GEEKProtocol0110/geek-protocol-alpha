/**
 * Token / liquidity-pool routes.
 *
 * WHAT CHANGED AND WHY
 *
 * This module used to run an in-memory constant-product AMM whose `buy`
 * endpoint credited a user's GEEK balance without any KAS ever being received,
 * and whose `sell` endpoint debited GEEK and returned a KAS figure nobody ever
 * paid. The pool state lived in a process variable and reset on every restart.
 *
 * That is the exact failure ECONOMY.md exists to prevent: it creates unfunded
 * GEEK. A user could mint spendable balance out of a simulated trade and take it
 * straight into the Gauntlet.
 *
 * So the mutating endpoints are now DISABLED and return 503 with an honest
 * explanation. The read-only quote endpoints remain, explicitly labelled as a
 * simulation, because the token page uses them for illustration.
 *
 * A real swap requires: an on-chain liquidity pool or a custodial desk with
 * funded reserves, a KAS settlement path, and treasury accounting for both
 * sides. None of that exists yet, and pretending otherwise on a live endpoint
 * is how insolvency happens.
 */

import { FastifyInstance } from "fastify";
import { getEconomyConfig } from "../services/economy";

/**
 * Illustrative reserves. These describe a hypothetical pool for the token page
 * and back no real liquidity — nothing reads them for accounting.
 */
const SIMULATED_POOL = {
  kasReserve: 10_000,
  geekReserve: 250_000,
  totalLpShares: 50_000,
} as const;

const SIMULATION_NOTICE =
  "These figures are an illustration of how a GEEK/KAS pool would price a swap. " +
  "There is no live liquidity pool, no KAS is held or paid, and no swap is executed.";

const DISABLED_NOTICE =
  "GEEK swaps are not available. The previous implementation credited GEEK without receiving KAS, " +
  "which creates unfunded balance, so it has been disabled. Swaps will return only when a funded " +
  "liquidity venue and on-chain KRC-20 settlement are implemented and audited.";

function kasToGeek(kasIn: number): number {
  const kasWithFee = kasIn - kasIn * 0.003;
  const geekOut = (SIMULATED_POOL.geekReserve * kasWithFee) / (SIMULATED_POOL.kasReserve + kasWithFee);
  return Math.floor(geekOut * 100) / 100;
}

function geekToKas(geekIn: number): number {
  const geekWithFee = geekIn - geekIn * 0.003;
  const kasOut = (SIMULATED_POOL.kasReserve * geekWithFee) / (SIMULATED_POOL.geekReserve + geekWithFee);
  return Math.floor(kasOut * 100) / 100;
}

function spotPrice(): number {
  return SIMULATED_POOL.geekReserve / SIMULATED_POOL.kasReserve;
}

export async function tokenRoutes(fastify: FastifyInstance) {
  /** Every mutating endpoint answers the same way, with the same explanation. */
  const refuse = (reply: import("fastify").FastifyReply, feature: string) =>
    reply.code(503).send({
      success: false,
      error: DISABLED_NOTICE,
      code: "SWAPS_DISABLED",
      data: { feature },
    });

  // GET /api/token/pool — simulated pool state, clearly labelled
  fastify.get("/pool", async (_req, reply) => {
    const config = await getEconomyConfig(fastify.prisma);
    return reply.send({
      success: true,
      data: {
        simulated: true,
        notice: SIMULATION_NOTICE,
        kasReserve: SIMULATED_POOL.kasReserve,
        geekReserve: SIMULATED_POOL.geekReserve,
        totalLpShares: SIMULATED_POOL.totalLpShares,
        spotPrice: spotPrice(),
        // No fabricated trade history: an empty list is the truth.
        recentTrades: [],
        swapsEnabled: false,
        stage: config.stage,
      },
    });
  });

  // GET /api/token/quote — illustrative pricing only
  fastify.get<{ Querystring: { kas?: string; geek?: string } }>("/quote", async (req, reply) => {
    const kasIn = parseFloat(req.query.kas ?? "0");
    const geekIn = parseFloat(req.query.geek ?? "0");

    if (kasIn > 0) {
      return reply.send({
        success: true,
        data: { simulated: true, notice: SIMULATION_NOTICE, geekOut: kasToGeek(kasIn), spotPrice: spotPrice() },
      });
    }
    if (geekIn > 0) {
      return reply.send({
        success: true,
        data: { simulated: true, notice: SIMULATION_NOTICE, kasOut: geekToKas(geekIn), spotPrice: spotPrice() },
      });
    }
    return reply.code(400).send({ success: false, error: "Provide kas or geek query param" });
  });

  // The mutating endpoints. Kept so clients get a clear answer rather than a 404.
  fastify.post("/buy", { preHandler: fastify.authenticate }, async (_req, reply) => refuse(reply, "buy"));
  fastify.post("/sell", { preHandler: fastify.authenticate }, async (_req, reply) => refuse(reply, "sell"));
  fastify.post("/add-liquidity", { preHandler: fastify.authenticate }, async (_req, reply) =>
    refuse(reply, "add-liquidity")
  );

  // Selling a sticker back to the house is a treasury outflow with no budget
  // behind it. It belongs in the marketplace (peer-to-peer, fee-recycled), not
  // as an unfunded buyback.
  fastify.post("/trade-sticker", { preHandler: fastify.authenticate }, async (_req, reply) =>
    reply.code(503).send({
      success: false,
      error:
        "Selling stickers back to the protocol is disabled. It paid GEEK from no funded source. " +
        "Trade stickers with other players in the marketplace, or convert duplicates to Geek Dust.",
      code: "STICKER_BUYBACK_DISABLED",
    })
  );
}
