import { z } from "zod";
export declare const GEEK_CATEGORIES: readonly ["Video Games", "Sci-Fi & Fantasy", "Movies & TV", "Comics", "Anime & Manga", "Tech & Programming", "History", "Pop Culture"];
export type GeekCategory = (typeof GEEK_CATEGORIES)[number];
export declare const NonceResponseSchema: z.ZodObject<{
    nonce: z.ZodString;
    expiresAt: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    nonce: string;
    expiresAt: number;
}, {
    nonce: string;
    expiresAt: number;
}>;
export declare const VerifySignatureSchema: z.ZodObject<{
    walletAddress: z.ZodString;
    signature: z.ZodString;
    nonce: z.ZodString;
}, "strip", z.ZodTypeAny, {
    nonce: string;
    walletAddress: string;
    signature: string;
}, {
    nonce: string;
    walletAddress: string;
    signature: string;
}>;
export declare const SessionSchema: z.ZodObject<{
    userId: z.ZodString;
    walletAddress: z.ZodString;
    issuedAt: z.ZodNumber;
    expiresAt: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    expiresAt: number;
    walletAddress: string;
    userId: string;
    issuedAt: number;
}, {
    expiresAt: number;
    walletAddress: string;
    userId: string;
    issuedAt: number;
}>;
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    walletAddress: z.ZodString;
    xp: z.ZodDefault<z.ZodNumber>;
    level: z.ZodDefault<z.ZodNumber>;
    streak: z.ZodDefault<z.ZodNumber>;
    lastAttemptAt: z.ZodNullable<z.ZodDate>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    walletAddress: string;
    id: string;
    xp: number;
    level: number;
    streak: number;
    lastAttemptAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}, {
    walletAddress: string;
    id: string;
    lastAttemptAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    xp?: number | undefined;
    level?: number | undefined;
    streak?: number | undefined;
}>;
export type User = z.infer<typeof UserSchema>;
export declare const QuestionSchema: z.ZodObject<{
    id: z.ZodString;
    category: z.ZodString;
    prompt: z.ZodString;
    options: z.ZodArray<z.ZodString, "many">;
    correctIndex: z.ZodNumber;
    difficulty: z.ZodEnum<["easy", "medium", "hard"]>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    version: z.ZodDefault<z.ZodNumber>;
    active: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    options: string[];
    id: string;
    createdAt: Date;
    category: string;
    prompt: string;
    correctIndex: number;
    difficulty: "easy" | "medium" | "hard";
    tags: string[];
    version: number;
    active: boolean;
}, {
    options: string[];
    id: string;
    createdAt: Date;
    category: string;
    prompt: string;
    correctIndex: number;
    difficulty: "easy" | "medium" | "hard";
    tags?: string[] | undefined;
    version?: number | undefined;
    active?: boolean | undefined;
}>;
export type Question = z.infer<typeof QuestionSchema>;
export declare const QuestionPublicSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    category: z.ZodString;
    prompt: z.ZodString;
    options: z.ZodArray<z.ZodString, "many">;
    correctIndex: z.ZodNumber;
    difficulty: z.ZodEnum<["easy", "medium", "hard"]>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    version: z.ZodDefault<z.ZodNumber>;
    active: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
}, "correctIndex">, "strip", z.ZodTypeAny, {
    options: string[];
    id: string;
    createdAt: Date;
    category: string;
    prompt: string;
    difficulty: "easy" | "medium" | "hard";
    tags: string[];
    version: number;
    active: boolean;
}, {
    options: string[];
    id: string;
    createdAt: Date;
    category: string;
    prompt: string;
    difficulty: "easy" | "medium" | "hard";
    tags?: string[] | undefined;
    version?: number | undefined;
    active?: boolean | undefined;
}>;
export type QuestionPublic = z.infer<typeof QuestionPublicSchema>;
export declare const StartQuizRequestSchema: z.ZodObject<{
    category: z.ZodString;
}, "strip", z.ZodTypeAny, {
    category: string;
}, {
    category: string;
}>;
export declare const StartQuizResponseSchema: z.ZodObject<{
    attemptId: z.ZodString;
    attemptToken: z.ZodString;
    expiresAt: z.ZodNumber;
    questions: z.ZodArray<z.ZodObject<Omit<{
        id: z.ZodString;
        category: z.ZodString;
        prompt: z.ZodString;
        options: z.ZodArray<z.ZodString, "many">;
        correctIndex: z.ZodNumber;
        difficulty: z.ZodEnum<["easy", "medium", "hard"]>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        version: z.ZodDefault<z.ZodNumber>;
        active: z.ZodDefault<z.ZodBoolean>;
        createdAt: z.ZodDate;
    }, "correctIndex">, "strip", z.ZodTypeAny, {
        options: string[];
        id: string;
        createdAt: Date;
        category: string;
        prompt: string;
        difficulty: "easy" | "medium" | "hard";
        tags: string[];
        version: number;
        active: boolean;
    }, {
        options: string[];
        id: string;
        createdAt: Date;
        category: string;
        prompt: string;
        difficulty: "easy" | "medium" | "hard";
        tags?: string[] | undefined;
        version?: number | undefined;
        active?: boolean | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    expiresAt: number;
    attemptId: string;
    attemptToken: string;
    questions: {
        options: string[];
        id: string;
        createdAt: Date;
        category: string;
        prompt: string;
        difficulty: "easy" | "medium" | "hard";
        tags: string[];
        version: number;
        active: boolean;
    }[];
}, {
    expiresAt: number;
    attemptId: string;
    attemptToken: string;
    questions: {
        options: string[];
        id: string;
        createdAt: Date;
        category: string;
        prompt: string;
        difficulty: "easy" | "medium" | "hard";
        tags?: string[] | undefined;
        version?: number | undefined;
        active?: boolean | undefined;
    }[];
}>;
export type StartQuizResponse = z.infer<typeof StartQuizResponseSchema>;
export declare const SubmitQuizRequestSchema: z.ZodObject<{
    attemptId: z.ZodString;
    attemptToken: z.ZodString;
    answers: z.ZodArray<z.ZodNumber, "many">;
}, "strip", z.ZodTypeAny, {
    attemptId: string;
    attemptToken: string;
    answers: number[];
}, {
    attemptId: string;
    attemptToken: string;
    answers: number[];
}>;
export declare const AttemptResultSchema: z.ZodObject<{
    attemptId: z.ZodString;
    userId: z.ZodString;
    category: z.ZodString;
    questionIds: z.ZodArray<z.ZodString, "many">;
    answers: z.ZodArray<z.ZodNumber, "many">;
    correctAnswers: z.ZodArray<z.ZodNumber, "many">;
    score: z.ZodNumber;
    scorePct: z.ZodNumber;
    startedAt: z.ZodDate;
    finishedAt: z.ZodDate;
    timeSeconds: z.ZodNumber;
    flags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    category: string;
    attemptId: string;
    answers: number[];
    questionIds: string[];
    correctAnswers: number[];
    score: number;
    scorePct: number;
    startedAt: Date;
    finishedAt: Date;
    timeSeconds: number;
    flags: string[];
}, {
    userId: string;
    category: string;
    attemptId: string;
    answers: number[];
    questionIds: string[];
    correctAnswers: number[];
    score: number;
    scorePct: number;
    startedAt: Date;
    finishedAt: Date;
    timeSeconds: number;
    flags?: string[] | undefined;
}>;
export type AttemptResult = z.infer<typeof AttemptResultSchema>;
export declare const RewardStatusSchema: z.ZodEnum<["PENDING", "SENT", "CONFIRMED", "FAILED"]>;
export declare const RewardSchema: z.ZodObject<{
    id: z.ZodString;
    attemptId: z.ZodString;
    userId: z.ZodString;
    amount: z.ZodNumber;
    status: z.ZodEnum<["PENDING", "SENT", "CONFIRMED", "FAILED"]>;
    txid: z.ZodNullable<z.ZodString>;
    error: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
    confirmedAt: z.ZodNullable<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    status: "PENDING" | "SENT" | "CONFIRMED" | "FAILED";
    userId: string;
    id: string;
    createdAt: Date;
    attemptId: string;
    amount: number;
    txid: string | null;
    error: string | null;
    confirmedAt: Date | null;
}, {
    status: "PENDING" | "SENT" | "CONFIRMED" | "FAILED";
    userId: string;
    id: string;
    createdAt: Date;
    attemptId: string;
    amount: number;
    txid: string | null;
    error: string | null;
    confirmedAt: Date | null;
}>;
export type Reward = z.infer<typeof RewardSchema>;
export declare const LeaderboardEntrySchema: z.ZodObject<{
    rank: z.ZodNumber;
    userId: z.ZodString;
    walletAddress: z.ZodString;
    xp: z.ZodNumber;
    score: z.ZodNumber;
    attempts: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    walletAddress: string;
    userId: string;
    xp: number;
    score: number;
    rank: number;
    attempts: number;
}, {
    walletAddress: string;
    userId: string;
    xp: number;
    score: number;
    rank: number;
    attempts: number;
}>;
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
export declare const ApiResponseSchema: <T extends z.ZodTypeAny>(schema: T) => z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
}>, any> extends infer T_1 ? { [k in keyof T_1]: T_1[k]; } : never, z.baseObjectInputType<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
}> extends infer T_2 ? { [k_1 in keyof T_2]: T_2[k_1]; } : never>;
export type ApiResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
};
//# sourceMappingURL=index.d.ts.map