import { z } from "zod";
// ============ CATEGORIES ============
// Every category is Kaspa-native. The quiz is the on-ramp: a player who clears
// all eight understands the chain they are being paid on.
export const GEEK_CATEGORIES = [
    "Kaspa Origins",
    "GHOSTDAG & BlockDAG",
    "Mining & Consensus",
    "Tokenomics",
    "Wallets & Addresses",
    "KRC-20 & Smart Contracts",
    "Kaspa Ecosystem",
    "Crypto Fundamentals",
];
/** Display metadata for each category. */
export const CATEGORY_META = {
    "Kaspa Origins": {
        icon: "📜",
        description: "The people, papers and decisions behind Kaspa's fair launch.",
    },
    "GHOSTDAG & BlockDAG": {
        icon: "🕸️",
        description: "How Kaspa orders parallel blocks instead of throwing them away.",
    },
    "Mining & Consensus": {
        icon: "⛏️",
        description: "Proof of work, kHeavyHash, block rates and security.",
    },
    Tokenomics: {
        icon: "🪙",
        description: "Supply, emission and the halving that happens every month.",
    },
    "Wallets & Addresses": {
        icon: "🔑",
        description: "Keys, addresses, UTXOs and keeping your KAS safe.",
    },
    "KRC-20 & Smart Contracts": {
        icon: "📦",
        description: "Tokens, inscriptions and the programmable layer.",
    },
    "Kaspa Ecosystem": {
        icon: "🌐",
        description: "Explorers, wallets, tooling and the projects being built.",
    },
    "Crypto Fundamentals": {
        icon: "🧠",
        description: "The core ideas every Kaspa user should understand.",
    },
};
// ============ AUTH ============
export const NonceResponseSchema = z.object({
    nonce: z.string(),
    expiresAt: z.number(),
});
export const VerifySignatureSchema = z.object({
    walletAddress: z.string(),
    signature: z.string(),
    nonce: z.string(),
});
export const SessionSchema = z.object({
    userId: z.string(),
    walletAddress: z.string(),
    issuedAt: z.number(),
    expiresAt: z.number(),
});
// ============ USER & PROGRESS ============
export const UserSchema = z.object({
    id: z.string(),
    walletAddress: z.string(),
    xp: z.number().default(0),
    level: z.number().default(1),
    streak: z.number().default(0),
    lastAttemptAt: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
// ============ QUIZ (GEEK GAUNTLET) ============
export const QuestionSchema = z.object({
    id: z.string(),
    category: z.string(),
    prompt: z.string(),
    options: z.array(z.string()),
    correctIndex: z.number(),
    difficulty: z.enum(["easy", "medium", "hard"]),
    tags: z.array(z.string()).default([]),
    version: z.number().default(1),
    active: z.boolean().default(true),
    createdAt: z.date(),
});
export const QuestionPublicSchema = QuestionSchema.omit({ correctIndex: true });
export const StartQuizRequestSchema = z.object({
    category: z.string(),
});
export const StartQuizResponseSchema = z.object({
    attemptId: z.string(),
    attemptToken: z.string(),
    expiresAt: z.number(),
    questions: z.array(QuestionPublicSchema),
});
export const SubmitQuizRequestSchema = z.object({
    attemptId: z.string(),
    attemptToken: z.string(),
    answers: z.array(z.number()),
});
// ============ STICKER COLLECTION ============
export const StickerSeriesSchema = z.enum([
    "Genesis",
    "Cyberpunk",
    "Fantasy",
    "Space",
    "Retro",
    "Modern",
    "Abstract",
    "Nature",
]);
export const StickerSchema = z.object({
    id: z.string(),
    series: StickerSeriesSchema,
    name: z.string(),
    rarity: z.enum(["Common", "Uncommon", "Rare", "Epic", "Legendary"]),
    imageUrl: z.string(),
});
export const UserStickerSchema = z.object({
    userId: z.string(),
    stickerId: z.string(),
    count: z.number().default(1),
});
// ============ KASPA PAYMENTS ============
export const BuyGeekRequestSchema = z.object({
    amountKas: z.number().positive(),
    walletAddress: z.string(),
});
export const BuyGeekResponseSchema = z.object({
    paymentId: z.string(),
    depositAddress: z.string(),
    amountKas: z.number(),
    geekToReceive: z.number(),
    status: z.enum(["PENDING", "CONFIRMED", "FAILED"]),
});
// ============ COMMUNITY CONTENT ENGINE (CCE) ============
export const SubmitQuestionSchema = z.object({
    category: z.string(),
    prompt: z.string(),
    options: z.array(z.string()).length(4),
    correctIndex: z.number().min(0).max(3),
    difficulty: z.enum(["easy", "medium", "hard"]),
});
// ============ AI COMPANIONS ============
export const CompanionTypeSchema = z.enum(["GIGA", "A.C.E"]);
export const ChatRequestSchema = z.object({
    companionId: CompanionTypeSchema,
    message: z.string(),
});
// ============ ADMIN QUERIES ==========
const PaginationQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
});
export const AdminAttemptsQuerySchema = PaginationQuerySchema.extend({
    userId: z.string().trim().optional(),
    wallet: z.string().trim().optional(),
});
export const AdminRewardsQuerySchema = PaginationQuerySchema.extend({
    status: z.string().trim().optional(),
});
//# sourceMappingURL=index.js.map