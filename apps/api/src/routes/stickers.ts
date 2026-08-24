import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  economyService,
  getEconomyConfig,
  toAtomic,
  fromAtomic,
  InsufficientBalanceError,
} from "../services/economy";

// Static sticker catalogue — series + stickers defined here so no extra DB migration is needed
export const SERIES_CATALOGUE = [
  {
    id: 1,
    name: "Genesis",
    description: "The founding collection. Rare artefacts from the birth of Geek Protocol.",
    icon: "🌌",
    stickers: [
      { id: 1,  number: 1,  name: "Block Zero",      emoji: "🧱", rarity: "Common"    },
      { id: 2,  number: 2,  name: "First Signal",    emoji: "📡", rarity: "Common"    },
      { id: 3,  number: 3,  name: "Neon Dawn",       emoji: "🌅", rarity: "Uncommon"  },
      { id: 4,  number: 4,  name: "Proof Spark",     emoji: "⚡", rarity: "Uncommon"  },
      { id: 5,  number: 5,  name: "GIGA Origin",     emoji: "🤖", rarity: "Rare"      },
      { id: 6,  number: 6,  name: "A.C.E. Core",     emoji: "🧠", rarity: "Rare"      },
      { id: 7,  number: 7,  name: "Kaspa Key",       emoji: "🔑", rarity: "Epic"      },
      { id: 8,  number: 8,  name: "Omniscient Grid", emoji: "🕸️", rarity: "Legendary" },
    ],
  },
  {
    id: 2,
    name: "Cyberpunk",
    description: "Neon-soaked streets and rogue AIs. The underground collection.",
    icon: "🌆",
    stickers: [
      { id: 9,  number: 1,  name: "Street Node",     emoji: "🛣️", rarity: "Common"    },
      { id: 10, number: 2,  name: "Data Punk",       emoji: "💾", rarity: "Common"    },
      { id: 11, number: 3,  name: "Neon Blade",      emoji: "🗡️", rarity: "Uncommon"  },
      { id: 12, number: 4,  name: "Chrome Fist",     emoji: "✊", rarity: "Uncommon"  },
      { id: 13, number: 5,  name: "Rogue Signal",    emoji: "📶", rarity: "Rare"      },
      { id: 14, number: 6,  name: "Ghost Wire",      emoji: "👻", rarity: "Rare"      },
      { id: 15, number: 7,  name: "Neural Crown",    emoji: "👑", rarity: "Epic"      },
      { id: 16, number: 8,  name: "Zero Day",        emoji: "💀", rarity: "Legendary" },
    ],
  },
  {
    id: 3,
    name: "Space",
    description: "Beyond the grid. Cosmic knowledge from the outer reaches.",
    icon: "🚀",
    stickers: [
      { id: 17, number: 1,  name: "Orbit One",       emoji: "🛸", rarity: "Common"    },
      { id: 18, number: 2,  name: "Dust Cloud",      emoji: "☁️", rarity: "Common"    },
      { id: 19, number: 3,  name: "Pulsar",          emoji: "💫", rarity: "Uncommon"  },
      { id: 20, number: 4,  name: "Dark Matter",     emoji: "🌑", rarity: "Uncommon"  },
      { id: 21, number: 5,  name: "Warp Core",       emoji: "🌀", rarity: "Rare"      },
      { id: 22, number: 6,  name: "Nebula Eye",      emoji: "👁️", rarity: "Rare"      },
      { id: 23, number: 7,  name: "Singularity",     emoji: "⚫", rarity: "Epic"      },
      { id: 24, number: 8,  name: "Kaspa Star",      emoji: "⭐", rarity: "Legendary" },
    ],
  },
  {
    id: 4,
    name: "Retro",
    description: "Pixel-perfect nostalgia. Classic geek culture immortalised.",
    icon: "🕹️",
    stickers: [
      { id: 25, number: 1,  name: "8-Bit Hero",      emoji: "🎮", rarity: "Common"    },
      { id: 26, number: 2,  name: "Floppy Disk",     emoji: "💿", rarity: "Common"    },
      { id: 27, number: 3,  name: "CRT Glow",        emoji: "📺", rarity: "Uncommon"  },
      { id: 28, number: 4,  name: "Dial-Up",         emoji: "📞", rarity: "Uncommon"  },
      { id: 29, number: 5,  name: "Cheat Code",      emoji: "🎯", rarity: "Rare"      },
      { id: 30, number: 6,  name: "High Score",      emoji: "🏆", rarity: "Rare"      },
      { id: 31, number: 7,  name: "Insert Coin",     emoji: "🪙", rarity: "Epic"      },
      { id: 32, number: 8,  name: "Game Over",       emoji: "💥", rarity: "Legendary" },
    ],
  },
];

const RARITY_VALUE: Record<string, number> = {
  Common: 10,
  Uncommon: 25,
  Rare: 75,
  Epic: 200,
  Legendary: 500,
};

export async function stickerRoutes(fastify: FastifyInstance) {
  const economy = economyService(fastify.prisma);

  // GET /api/stickers/catalogue  — full sticker list (public)
  fastify.get("/catalogue", async (_req, reply) => {
    const config = await getEconomyConfig(fastify.prisma);
    return reply.send({
      success: true,
      data: SERIES_CATALOGUE,
      rarityValues: RARITY_VALUE,
      prices: config.rules.stickers,
    });
  });

  // GET /api/stickers/prices — GEEK sinks for the sticker economy
  fastify.get("/prices", async (_req, reply) => {
    const config = await getEconomyConfig(fastify.prisma);
    reply.header("Cache-Control", "public, max-age=60");
    return reply.send({
      success: true,
      data: {
        ...config.rules.stickers,
        note: "All sticker fees follow the 70/30 rule: 70% returns to the reward pool, 30% is booked to pending burn.",
      },
    });
  });

  // POST /api/stickers/packs/buy — a real GEEK sink, settled through the economy
  fastify.post("/packs/buy", { preHandler: fastify.authenticate }, async (req, reply) => {
    const parse = z
      .object({ packType: z.enum(["standard", "premium", "seasonal"]).default("standard"), seriesId: z.number().int().optional() })
      .safeParse(req.body ?? {});
    if (!parse.success) return reply.code(400).send({ success: false, error: parse.error.flatten() });

    const { packType, seriesId } = parse.data;
    const userId = req.jwtUser!.userId;
    const config = await getEconomyConfig(fastify.prisma);

    const priceGeek =
      packType === "premium"
        ? config.rules.stickers.premiumPackGeek
        : packType === "seasonal"
          ? config.rules.stickers.seasonalPackGeek
          : config.rules.stickers.standardPackGeek;

    const price = toAtomic(priceGeek);

    try {
      // The purchase and the pack are created together: charge first, and only
      // record the pack once the charge has actually committed.
      const charge = await economy.chargeFee({
        userId,
        type: "STICKER_PACK_PURCHASE",
        amount: price,
        idempotencyKey: `sticker:pack:${userId}:${Date.now()}`,
        referenceType: "STICKER_PACK",
        metadata: { packType, seriesId: seriesId ?? null },
      });

      const pack = await fastify.prisma.stickerPack.create({
        data: {
          userId,
          packType,
          seriesId: seriesId ?? null,
          stickersPerPack: 5,
          guaranteedRarity: packType === "premium" ? "Rare" : null,
          source: "purchase",
          sourceDetail: `${priceGeek} GEEK`,
        },
      });

      return reply.send({
        success: true,
        data: {
          packId: pack.id,
          packType,
          pricePaid: priceGeek,
          recycled: fromAtomic(charge.recycled),
          burnPending: fromAtomic(charge.burned),
          balances: await economy.getBalanceView(userId),
        },
      });
    } catch (err) {
      if (err instanceof InsufficientBalanceError) {
        return reply.code(402).send({
          success: false,
          error: `Not enough GEEK. A ${packType} pack costs ${priceGeek} GEEK; you have ${fromAtomic(err.available)} GEEK available.`,
          code: "INSUFFICIENT_BALANCE",
        });
      }
      throw err;
    }
  });

  // POST /api/stickers/duplicates/convert — duplicates become Geek Dust.
  //
  // Dust is a one-way, NON-WITHDRAWABLE crafting resource. There is deliberately
  // no dust → GEEK route anywhere in this codebase (ECONOMY.md §9.1); allowing
  // one would turn a cosmetic drop into a mint.
  fastify.post("/duplicates/convert", { preHandler: fastify.authenticate }, async (req, reply) => {
    const parse = z.object({ userStickerId: z.number().int().positive() }).safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ success: false, error: parse.error.flatten() });

    const userId = req.jwtUser!.userId;
    const config = await getEconomyConfig(fastify.prisma);
    const fee = toAtomic(config.rules.stickers.duplicateConversionFeeGeek);

    const userSticker = await fastify.prisma.userSticker.findFirst({
      where: { id: parse.data.userStickerId, userId },
      include: { sticker: true },
    });
    if (!userSticker) {
      return reply.code(404).send({ success: false, error: "Sticker not found or not owned" });
    }

    const copies = await fastify.prisma.userSticker.count({
      where: { userId, stickerId: userSticker.stickerId },
    });
    if (copies < 2) {
      return reply.code(400).send({
        success: false,
        error: "You can only convert duplicates. This is your only copy of that sticker.",
      });
    }

    const dust = RARITY_VALUE[userSticker.sticker.rarity] ?? 10;

    try {
      if (fee > 0n) {
        await economy.chargeFee({
          userId,
          type: "STICKER_CRAFT_FEE",
          amount: fee,
          idempotencyKey: `sticker:dust:${parse.data.userStickerId}`,
          referenceType: "STICKER_PACK",
          referenceId: String(parse.data.userStickerId),
          metadata: { rarity: userSticker.sticker.rarity, dust },
        });
      }
    } catch (err) {
      if (err instanceof InsufficientBalanceError) {
        return reply.code(402).send({
          success: false,
          error: `Converting a duplicate costs ${config.rules.stickers.duplicateConversionFeeGeek} GEEK.`,
          code: "INSUFFICIENT_BALANCE",
        });
      }
      throw err;
    }

    await fastify.prisma.$transaction([
      fastify.prisma.userSticker.delete({ where: { id: parse.data.userStickerId } }),
      fastify.prisma.geekDust.upsert({
        where: { userId },
        create: { userId, amount: dust, totalEarned: dust },
        update: { amount: { increment: dust }, totalEarned: { increment: dust }, updatedAt: new Date() },
      }),
      fastify.prisma.dustTransaction.create({
        data: { userId, amount: dust, reason: "duplicate_conversion", stickerId: userSticker.stickerId },
      }),
    ]);

    const dustRow = await fastify.prisma.geekDust.findUnique({ where: { userId } });

    return reply.send({
      success: true,
      data: {
        dustAwarded: dust,
        dustBalance: dustRow?.amount ?? dust,
        feePaid: config.rules.stickers.duplicateConversionFeeGeek,
        note: "Geek Dust is a crafting resource. It cannot be converted back into GEEK or withdrawn.",
        balances: await economy.getBalanceView(userId),
      },
    });
  });

  // GET /api/stickers/my  — authenticated user's owned stickers
  fastify.get("/my", { preHandler: fastify.authenticate }, async (req, reply) => {
    const userId = req.jwtUser!.userId;

    const owned = await fastify.prisma.userSticker.findMany({
      where: { userId },
      include: { sticker: { include: { series: true } } },
    });

    // Group by stickerId: { stickerId -> { count, isDuplicate } }
    const map: Record<number, { count: number }> = {};
    for (const us of owned) {
      map[us.stickerId] = { count: (map[us.stickerId]?.count ?? 0) + 1 };
    }

    return reply.send({ success: true, data: map });
  });
}
