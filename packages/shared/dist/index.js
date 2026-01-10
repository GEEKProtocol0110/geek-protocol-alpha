import { z } from "zod";
// ============ CATEGORIES ============
export const GEEK_CATEGORIES = [
    "Video Games",
    "Sci-Fi & Fantasy",
    "Movies & TV",
    "Comics",
    "Anime & Manga",
    "Tech & Programming",
    "History",
    "Pop Culture",
];
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
// ============ USER ============
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
// ============ QUIZ ============
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
export const AttemptResultSchema = z.object({
    attemptId: z.string(),
    userId: z.string(),
    category: z.string(),
    questionIds: z.array(z.string()),
    answers: z.array(z.number()),
    correctAnswers: z.array(z.number()),
    score: z.number(),
    scorePct: z.number(),
    startedAt: z.date(),
    finishedAt: z.date(),
    timeSeconds: z.number(),
    flags: z.array(z.string()).default([]),
});
// ============ REWARDS ============
export const RewardStatusSchema = z.enum([
    "PENDING",
    "SENT",
    "CONFIRMED",
    "FAILED",
]);
export const RewardSchema = z.object({
    id: z.string(),
    attemptId: z.string(),
    userId: z.string(),
    amount: z.number(), // in satoshis or smallest unit
    status: RewardStatusSchema,
    txid: z.string().nullable(),
    error: z.string().nullable(),
    createdAt: z.date(),
    confirmedAt: z.date().nullable(),
});
// ============ LEADERBOARD ============
export const LeaderboardEntrySchema = z.object({
    rank: z.number(),
    userId: z.string(),
    walletAddress: z.string(),
    xp: z.number(),
    score: z.number(),
    attempts: z.number(),
});
// ============ API RESPONSE WRAPPER ============
export const ApiResponseSchema = (schema) => z.object({
    success: z.boolean(),
    data: schema.optional(),
    error: z.string().optional(),
});
//# sourceMappingURL=index.js.map