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
    userId: z.string().trim().optional(),
    wallet: z.string().trim().optional(),
});
export const AdminQuestionImportSchema = z
    .object({
    category: z.string().trim().default("General Geek"),
    prompt: z.string().min(1),
    options: z.array(z.string().min(1)).min(2),
    correctIndex: z.number().int().nonnegative().default(0),
    difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
    tags: z.array(z.string().trim()).default([]),
    version: z.number().int().positive().default(1),
    active: z.boolean().default(true),
})
    .superRefine((data, ctx) => {
    if (data.correctIndex >= data.options.length) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "correctIndex must point to one of the provided options",
            path: ["correctIndex"],
        });
    }
});
export const AdminQuestionImportRequestSchema = z.object({
    questions: z.array(AdminQuestionImportSchema).nonempty(),
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
export const LeaderboardQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(500).default(100),
});
export const LeaderboardUserParamsSchema = z.object({
    userId: z.string().trim(),
});
export const RewardLookupParamsSchema = z.object({
    userId: z.string().trim(),
});
export const RewardAttemptParamsSchema = z.object({
    attemptId: z.string().trim(),
});
// ============ API RESPONSE WRAPPER ============
export const ApiResponseSchema = (schema) => z.object({
    success: z.boolean(),
    data: schema.optional(),
    error: z.string().optional(),
});
//# sourceMappingURL=index.js.map