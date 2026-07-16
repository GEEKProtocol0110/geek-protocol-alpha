export type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
export type PackType = "Standard" | "Premium" | "Legendary";

export interface Sticker {
  id: string;
  number: number;
  name: string;
  emoji: string;
  rarity: Rarity;
  series: string;
}

export interface OwnedSticker {
  stickerId: string;
  quantity: number;
}

export interface Pack {
  id: string;
  type: PackType;
  quantity: number;
}

export interface ExchangeListing {
  id: string;
  seller: string;
  stickerId: string;
  askPrice: number;
  expiresAt: number;
  offers: { from: string; stickerId: string }[];
}

export const RARITY_COLORS: Record<Rarity, string> = {
  Common:    "text-gray-300 border-gray-500/40 bg-gray-500/10",
  Uncommon:  "text-green-300 border-green-500/40 bg-green-500/10",
  Rare:      "text-blue-300 border-blue-500/40 bg-blue-500/10",
  Epic:      "text-purple-300 border-purple-500/40 bg-purple-500/10",
  Legendary: "text-yellow-300 border-yellow-500/40 bg-yellow-500/10",
};

export const RARITY_BADGE: Record<Rarity, string> = {
  Common:    "bg-gray-500/20 text-gray-300",
  Uncommon:  "bg-green-500/20 text-green-300",
  Rare:      "bg-blue-500/20 text-blue-300",
  Epic:      "bg-purple-500/20 text-purple-300",
  Legendary: "bg-yellow-500/20 text-yellow-300",
};

export const SHOP_PRICES: Record<Rarity, number> = {
  Common: 6, Uncommon: 14, Rare: 35, Epic: 90, Legendary: 220,
};

export const CRAFT_COSTS: Record<Rarity, number> = {
  Common: 40, Uncommon: 150, Rare: 500, Epic: 1800, Legendary: 7200,
};

export const DUST_FROM_DUPE: Record<Rarity, number> = {
  Common: 5, Uncommon: 20, Rare: 80, Epic: 300, Legendary: 1200,
};

export const PACK_ODDS: Record<PackType, Record<Rarity, number>> = {
  Standard:  { Common: 65, Uncommon: 25, Rare: 8,  Epic: 1.8, Legendary: 0.2 },
  Premium:   { Common: 35, Uncommon: 30, Rare: 25, Epic: 8,   Legendary: 2   },
  Legendary: { Common: 10, Uncommon: 20, Rare: 30, Epic: 28,  Legendary: 12  },
};

export const STICKERS: Sticker[] = [
  // Cyber Minds
  { id: "s001", number: 1,  name: "The Seeker",      emoji: "🔍", rarity: "Common",    series: "Cyber Minds" },
  { id: "s002", number: 2,  name: "Code Monkey",     emoji: "🐒", rarity: "Common",    series: "Cyber Minds" },
  { id: "s003", number: 3,  name: "Pixel Wizard",    emoji: "🧙", rarity: "Common",    series: "Cyber Minds" },
  { id: "s004", number: 4,  name: "Data Ghost",      emoji: "👻", rarity: "Uncommon",  series: "Cyber Minds" },
  { id: "s005", number: 5,  name: "Neural Nomad",    emoji: "🧠", rarity: "Uncommon",  series: "Cyber Minds" },
  { id: "s006", number: 6,  name: "Grid Walker",     emoji: "⚡", rarity: "Rare",      series: "Cyber Minds" },
  { id: "s007", number: 7,  name: "A.C.E.",           emoji: "🤖", rarity: "Epic",      series: "Cyber Minds" },
  { id: "s008", number: 8,  name: "GIGA",            emoji: "🌌", rarity: "Legendary", series: "Cyber Minds" },
  // Kaspa Legends
  { id: "s009", number: 9,  name: "Block Forger",    emoji: "⛏️", rarity: "Common",    series: "Kaspa Legends" },
  { id: "s010", number: 10, name: "Hash Hunter",     emoji: "🎯", rarity: "Common",    series: "Kaspa Legends" },
  { id: "s011", number: 11, name: "Node Runner",     emoji: "🏃", rarity: "Common",    series: "Kaspa Legends" },
  { id: "s012", number: 12, name: "DAG Diver",       emoji: "🌊", rarity: "Uncommon",  series: "Kaspa Legends" },
  { id: "s013", number: 13, name: "Phantom TX",      emoji: "💸", rarity: "Uncommon",  series: "Kaspa Legends" },
  { id: "s014", number: 14, name: "Chain Breaker",   emoji: "🔗", rarity: "Rare",      series: "Kaspa Legends" },
  { id: "s015", number: 15, name: "KAS Titan",       emoji: "🏔️", rarity: "Epic",      series: "Kaspa Legends" },
  { id: "s016", number: 16, name: "Omniscient Grid", emoji: "🌐", rarity: "Legendary", series: "Kaspa Legends" },
  // Geek Culture
  { id: "s017", number: 17, name: "Anime Adept",     emoji: "✨", rarity: "Common",    series: "Geek Culture" },
  { id: "s018", number: 18, name: "Retro Gamer",     emoji: "🕹️", rarity: "Common",    series: "Geek Culture" },
  { id: "s019", number: 19, name: "Sci-Fi Scholar",  emoji: "🚀", rarity: "Common",    series: "Geek Culture" },
  { id: "s020", number: 20, name: "Lore Keeper",     emoji: "📚", rarity: "Uncommon",  series: "Geek Culture" },
  { id: "s021", number: 21, name: "Meme Lord",       emoji: "😂", rarity: "Uncommon",  series: "Geek Culture" },
  { id: "s022", number: 22, name: "Comic Sage",      emoji: "💥", rarity: "Rare",      series: "Geek Culture" },
  { id: "s023", number: 23, name: "Pop Oracle",      emoji: "🎭", rarity: "Epic",      series: "Geek Culture" },
  { id: "s024", number: 24, name: "Cognoscenti",     emoji: "👑", rarity: "Legendary", series: "Geek Culture" },
];

export const SERIES = [...new Set(STICKERS.map((s) => s.series))];

export function pickWeightedRarity(packType: PackType): Rarity {
  const weights = PACK_ODDS[packType];
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of Object.entries(weights) as [Rarity, number][]) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  return "Common";
}

export function pickRandomStickerOfRarity(rarity: Rarity): Sticker {
  const pool = STICKERS.filter((s) => s.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function openPack(packType: PackType): Sticker[] {
  return Array.from({ length: 5 }, () => pickRandomStickerOfRarity(pickWeightedRarity(packType)));
}
