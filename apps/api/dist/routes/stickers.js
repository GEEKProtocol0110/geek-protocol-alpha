// Static sticker catalogue — series + stickers defined here so no extra DB migration is needed
export const SERIES_CATALOGUE = [
    {
        id: 1,
        name: "Genesis",
        description: "The founding collection. Rare artefacts from the birth of Geek Protocol.",
        icon: "🌌",
        stickers: [
            { id: 1, number: 1, name: "Block Zero", emoji: "🧱", rarity: "Common" },
            { id: 2, number: 2, name: "First Signal", emoji: "📡", rarity: "Common" },
            { id: 3, number: 3, name: "Neon Dawn", emoji: "🌅", rarity: "Uncommon" },
            { id: 4, number: 4, name: "Proof Spark", emoji: "⚡", rarity: "Uncommon" },
            { id: 5, number: 5, name: "GIGA Origin", emoji: "🤖", rarity: "Rare" },
            { id: 6, number: 6, name: "A.C.E. Core", emoji: "🧠", rarity: "Rare" },
            { id: 7, number: 7, name: "Kaspa Key", emoji: "🔑", rarity: "Epic" },
            { id: 8, number: 8, name: "Omniscient Grid", emoji: "🕸️", rarity: "Legendary" },
        ],
    },
    {
        id: 2,
        name: "Cyberpunk",
        description: "Neon-soaked streets and rogue AIs. The underground collection.",
        icon: "🌆",
        stickers: [
            { id: 9, number: 1, name: "Street Node", emoji: "🛣️", rarity: "Common" },
            { id: 10, number: 2, name: "Data Punk", emoji: "💾", rarity: "Common" },
            { id: 11, number: 3, name: "Neon Blade", emoji: "🗡️", rarity: "Uncommon" },
            { id: 12, number: 4, name: "Chrome Fist", emoji: "✊", rarity: "Uncommon" },
            { id: 13, number: 5, name: "Rogue Signal", emoji: "📶", rarity: "Rare" },
            { id: 14, number: 6, name: "Ghost Wire", emoji: "👻", rarity: "Rare" },
            { id: 15, number: 7, name: "Neural Crown", emoji: "👑", rarity: "Epic" },
            { id: 16, number: 8, name: "Zero Day", emoji: "💀", rarity: "Legendary" },
        ],
    },
    {
        id: 3,
        name: "Space",
        description: "Beyond the grid. Cosmic knowledge from the outer reaches.",
        icon: "🚀",
        stickers: [
            { id: 17, number: 1, name: "Orbit One", emoji: "🛸", rarity: "Common" },
            { id: 18, number: 2, name: "Dust Cloud", emoji: "☁️", rarity: "Common" },
            { id: 19, number: 3, name: "Pulsar", emoji: "💫", rarity: "Uncommon" },
            { id: 20, number: 4, name: "Dark Matter", emoji: "🌑", rarity: "Uncommon" },
            { id: 21, number: 5, name: "Warp Core", emoji: "🌀", rarity: "Rare" },
            { id: 22, number: 6, name: "Nebula Eye", emoji: "👁️", rarity: "Rare" },
            { id: 23, number: 7, name: "Singularity", emoji: "⚫", rarity: "Epic" },
            { id: 24, number: 8, name: "Kaspa Star", emoji: "⭐", rarity: "Legendary" },
        ],
    },
    {
        id: 4,
        name: "Retro",
        description: "Pixel-perfect nostalgia. Classic geek culture immortalised.",
        icon: "🕹️",
        stickers: [
            { id: 25, number: 1, name: "8-Bit Hero", emoji: "🎮", rarity: "Common" },
            { id: 26, number: 2, name: "Floppy Disk", emoji: "💿", rarity: "Common" },
            { id: 27, number: 3, name: "CRT Glow", emoji: "📺", rarity: "Uncommon" },
            { id: 28, number: 4, name: "Dial-Up", emoji: "📞", rarity: "Uncommon" },
            { id: 29, number: 5, name: "Cheat Code", emoji: "🎯", rarity: "Rare" },
            { id: 30, number: 6, name: "High Score", emoji: "🏆", rarity: "Rare" },
            { id: 31, number: 7, name: "Insert Coin", emoji: "🪙", rarity: "Epic" },
            { id: 32, number: 8, name: "Game Over", emoji: "💥", rarity: "Legendary" },
        ],
    },
];
const RARITY_VALUE = {
    Common: 10,
    Uncommon: 25,
    Rare: 75,
    Epic: 200,
    Legendary: 500,
};
export async function stickerRoutes(fastify) {
    // GET /api/stickers/catalogue  — full sticker list (public)
    fastify.get("/catalogue", async (_req, reply) => {
        return reply.send({ success: true, data: SERIES_CATALOGUE, rarityValues: RARITY_VALUE });
    });
    // GET /api/stickers/my  — authenticated user's owned stickers
    fastify.get("/my", { preHandler: fastify.authenticate }, async (req, reply) => {
        const userId = req.jwtUser.userId;
        const owned = await fastify.prisma.userSticker.findMany({
            where: { userId },
            include: { sticker: { include: { series: true } } },
        });
        // Group by stickerId: { stickerId -> { count, isDuplicate } }
        const map = {};
        for (const us of owned) {
            map[us.stickerId] = { count: (map[us.stickerId]?.count ?? 0) + 1 };
        }
        return reply.send({ success: true, data: map });
    });
}
