import { FastifyInstance } from "fastify";
import { z } from "zod";
import { SERIES_CATALOGUE } from "./stickers";

// ── In-memory liquidity pool (resets on restart; swap for Redis/DB in prod) ──
interface PoolState {
  kasReserve: number;   // KAS in pool
  geekReserve: number;  // GEEK in pool
  totalLpShares: number;
}

const pool: PoolState = {
  kasReserve: 10_000,
  geekReserve: 250_000,
  totalLpShares: 50_000,
};

// ── Order book (in-memory ring buffer, last 50 trades) ──
interface Trade {
  id: string;
  type: "buy" | "sell" | "sticker";
  kasAmount?: number;
  geekAmount: number;
  stickerName?: string;
  price: number; // GEEK per KAS
  timestamp: number;
}

const recentTrades: Trade[] = [];
function pushTrade(t: Trade) {
  recentTrades.unshift(t);
  if (recentTrades.length > 50) recentTrades.pop();
}

// ── AMM helpers (constant-product x*y=k) ──
function kasToGeek(kasIn: number): number {
  const fee = kasIn * 0.003; // 0.3% fee
  const kasWithFee = kasIn - fee;
  const geekOut = (pool.geekReserve * kasWithFee) / (pool.kasReserve + kasWithFee);
  return Math.floor(geekOut * 100) / 100;
}

function geekToKas(geekIn: number): number {
  const fee = geekIn * 0.003;
  const geekWithFee = geekIn - fee;
  const kasOut = (pool.kasReserve * geekWithFee) / (pool.geekReserve + geekWithFee);
  return Math.floor(kasOut * 100) / 100;
}

function spotPrice(): number {
  return pool.geekReserve / pool.kasReserve;
}

// ── Sticker rarity → GEEK value ──
const RARITY_GEEK: Record<string, number> = {
  Common: 10, Uncommon: 25, Rare: 75, Epic: 200, Legendary: 500,
};

function stickerById(id: number) {
  for (const s of SERIES_CATALOGUE) {
    const found = s.stickers.find((st) => st.id === id);
    if (found) return found;
  }
  return null;
}

// ── Route plugin ──────────────────────────────────────────────────────────────

export async function tokenRoutes(fastify: FastifyInstance) {

  // GET /api/token/pool  — live pool state + spot price
  fastify.get("/pool", async (_req, reply) => {
    return reply.send({
      success: true,
      data: {
        kasReserve: pool.kasReserve,
        geekReserve: pool.geekReserve,
        totalLpShares: pool.totalLpShares,
        spotPrice: spotPrice(),
        recentTrades: recentTrades.slice(0, 20),
      },
    });
  });

  // GET /api/token/quote?kas=<amount>  — price quote before buying
  fastify.get<{ Querystring: { kas?: string; geek?: string } }>("/quote", async (req, reply) => {
    const kasIn = parseFloat(req.query.kas ?? "0");
    const geekIn = parseFloat(req.query.geek ?? "0");
    if (kasIn > 0) {
      return reply.send({ success: true, data: { geekOut: kasToGeek(kasIn), spotPrice: spotPrice() } });
    }
    if (geekIn > 0) {
      return reply.send({ success: true, data: { kasOut: geekToKas(geekIn), spotPrice: spotPrice() } });
    }
    return reply.code(400).send({ success: false, error: "Provide kas or geek query param" });
  });

  // POST /api/token/buy  — buy GEEK with KAS (demo: credits user balance)
  fastify.post<{ Body: { kasAmount: number } }>(
    "/buy",
    { preHandler: fastify.authenticate },
    async (req, reply) => {
      const parse = z.object({ kasAmount: z.number().positive().max(100_000) }).safeParse(req.body);
      if (!parse.success) return reply.code(400).send({ success: false, error: "Invalid amount" });

      const { kasAmount } = parse.data;
      const geekOut = kasToGeek(kasAmount);

      if (geekOut <= 0) return reply.code(400).send({ success: false, error: "Insufficient liquidity" });

      // Update pool reserves (AMM)
      pool.kasReserve += kasAmount;
      pool.geekReserve -= geekOut;

      // Credit user
      const userId = req.jwtUser!.userId;
      const user = await fastify.prisma.user.update({
        where: { id: userId },
        data: { geekBalance: { increment: geekOut } },
        select: { geekBalance: true },
      });

      const trade: Trade = {
        id: `buy-${Date.now()}-${userId}`,
        type: "buy",
        kasAmount,
        geekAmount: geekOut,
        price: spotPrice(),
        timestamp: Date.now(),
      };
      pushTrade(trade);

      return reply.send({
        success: true,
        data: { geekReceived: geekOut, newBalance: user.geekBalance, spotPrice: spotPrice() },
      });
    }
  );

  // POST /api/token/sell  — sell GEEK for KAS
  fastify.post<{ Body: { geekAmount: number } }>(
    "/sell",
    { preHandler: fastify.authenticate },
    async (req, reply) => {
      const parse = z.object({ geekAmount: z.number().positive().max(1_000_000) }).safeParse(req.body);
      if (!parse.success) return reply.code(400).send({ success: false, error: "Invalid amount" });

      const { geekAmount } = parse.data;
      const userId = req.jwtUser!.userId;

      const user = await fastify.prisma.user.findUnique({ where: { id: userId }, select: { geekBalance: true } });
      if (!user || user.geekBalance.toNumber() < geekAmount) {
        return reply.code(400).send({ success: false, error: "Insufficient GEEK balance" });
      }

      const kasOut = geekToKas(geekAmount);
      if (kasOut <= 0) return reply.code(400).send({ success: false, error: "Insufficient liquidity" });

      pool.geekReserve += geekAmount;
      pool.kasReserve -= kasOut;

      const updated = await fastify.prisma.user.update({
        where: { id: userId },
        data: { geekBalance: { decrement: geekAmount } },
        select: { geekBalance: true },
      });

      pushTrade({ id: `sell-${Date.now()}-${userId}`, type: "sell", geekAmount, kasAmount: kasOut, price: spotPrice(), timestamp: Date.now() });

      return reply.send({
        success: true,
        data: { kasReceived: kasOut, newBalance: updated.geekBalance, spotPrice: spotPrice() },
      });
    }
  );

  // POST /api/token/trade-sticker  — exchange a sticker for GEEK
  fastify.post<{ Body: { userStickerId: number } }>(
    "/trade-sticker",
    { preHandler: fastify.authenticate },
    async (req, reply) => {
      const parse = z.object({ userStickerId: z.number().int().positive() }).safeParse(req.body);
      if (!parse.success) return reply.code(400).send({ success: false, error: "Invalid sticker id" });

      const userId = req.jwtUser!.userId;
      const { userStickerId } = parse.data;

      // Verify ownership
      const userSticker = await fastify.prisma.userSticker.findFirst({
        where: { id: userStickerId, userId },
        include: { sticker: true },
      });
      if (!userSticker) return reply.code(404).send({ success: false, error: "Sticker not found or not owned" });

      const geekValue = RARITY_GEEK[userSticker.sticker.rarity] ?? 10;

      // Remove sticker + credit GEEK atomically
      await fastify.prisma.$transaction([
        fastify.prisma.userSticker.delete({ where: { id: userStickerId } }),
        fastify.prisma.user.update({
          where: { id: userId },
          data: { geekBalance: { increment: geekValue } },
        }),
      ]);

      const sticker = stickerById(userSticker.stickerId);
      pushTrade({
        id: `sticker-${Date.now()}-${userId}`,
        type: "sticker",
        geekAmount: geekValue,
        stickerName: sticker?.name ?? userSticker.sticker.name,
        price: spotPrice(),
        timestamp: Date.now(),
      });

      const updated = await fastify.prisma.user.findUnique({ where: { id: userId }, select: { geekBalance: true } });

      return reply.send({
        success: true,
        data: { geekReceived: geekValue, stickerName: sticker?.name, newBalance: updated?.geekBalance },
      });
    }
  );

  // POST /api/token/add-liquidity  — add KAS+GEEK to pool, receive LP shares
  fastify.post<{ Body: { kasAmount: number } }>(
    "/add-liquidity",
    { preHandler: fastify.authenticate },
    async (req, reply) => {
      const parse = z.object({ kasAmount: z.number().positive().max(100_000) }).safeParse(req.body);
      if (!parse.success) return reply.code(400).send({ success: false, error: "Invalid amount" });

      const { kasAmount } = parse.data;
      const ratio = pool.geekReserve / pool.kasReserve;
      const geekRequired = kasAmount * ratio;

      const userId = req.jwtUser!.userId;
      const user = await fastify.prisma.user.findUnique({ where: { id: userId }, select: { geekBalance: true } });
      if (!user || user.geekBalance.toNumber() < geekRequired) {
        return reply.code(400).send({ success: false, error: `Need ${geekRequired.toFixed(2)} GEEK to match` });
      }

      const lpShares = (kasAmount / pool.kasReserve) * pool.totalLpShares;
      pool.kasReserve += kasAmount;
      pool.geekReserve += geekRequired;
      pool.totalLpShares += lpShares;

      await fastify.prisma.user.update({
        where: { id: userId },
        data: { geekBalance: { decrement: geekRequired } },
      });

      return reply.send({
        success: true,
        data: { lpSharesReceived: Math.floor(lpShares * 100) / 100, kasAdded: kasAmount, geekAdded: geekRequired, spotPrice: spotPrice() },
      });
    }
  );
}
