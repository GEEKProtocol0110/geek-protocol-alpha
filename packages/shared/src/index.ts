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
] as const;

export type GeekCategory = (typeof GEEK_CATEGORIES)[number];

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

export type User = z.infer<typeof UserSchema>;

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

export type Question = z.infer<typeof QuestionSchema>;

export const QuestionPublicSchema = QuestionSchema.omit({ correctIndex: true });
export type QuestionPublic = z.infer<typeof QuestionPublicSchema>;

export const StartQuizRequestSchema = z.object({
  category: z.string(),
});

export const StartQuizResponseSchema = z.object({
  attemptId: z.string(),
  attemptToken: z.string(),
  expiresAt: z.number(),
  questions: z.array(QuestionPublicSchema),
});

export type StartQuizResponse = z.infer<typeof StartQuizResponseSchema>;

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

export type AttemptResult = z.infer<typeof AttemptResultSchema>;

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

export type Reward = z.infer<typeof RewardSchema>;

// ============ LEADERBOARD ============
export const LeaderboardEntrySchema = z.object({
  rank: z.number(),
  userId: z.string(),
  walletAddress: z.string(),
  xp: z.number(),
  score: z.number(),
  attempts: z.number(),
});

export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

// ============ API RESPONSE WRAPPER ============
export const ApiResponseSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    success: z.boolean(),
    data: schema.optional(),
    error: z.string().optional(),
  });

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
