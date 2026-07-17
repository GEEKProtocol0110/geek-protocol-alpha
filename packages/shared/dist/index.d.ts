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
export declare const StickerSeriesSchema: z.ZodEnum<["Genesis", "Cyberpunk", "Fantasy", "Space", "Retro", "Modern", "Abstract", "Nature"]>;
export declare const StickerSchema: z.ZodObject<{
    id: z.ZodString;
    series: z.ZodEnum<["Genesis", "Cyberpunk", "Fantasy", "Space", "Retro", "Modern", "Abstract", "Nature"]>;
    name: z.ZodString;
    rarity: z.ZodEnum<["Common", "Uncommon", "Rare", "Epic", "Legendary"]>;
    imageUrl: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    series: "Genesis" | "Cyberpunk" | "Fantasy" | "Space" | "Retro" | "Modern" | "Abstract" | "Nature";
    name: string;
    rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
    imageUrl: string;
}, {
    id: string;
    series: "Genesis" | "Cyberpunk" | "Fantasy" | "Space" | "Retro" | "Modern" | "Abstract" | "Nature";
    name: string;
    rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
    imageUrl: string;
}>;
export declare const UserStickerSchema: z.ZodObject<{
    userId: z.ZodString;
    stickerId: z.ZodString;
    count: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    stickerId: string;
    count: number;
}, {
    userId: string;
    stickerId: string;
    count?: number | undefined;
}>;
export declare const BuyGeekRequestSchema: z.ZodObject<{
    amountKas: z.ZodNumber;
    walletAddress: z.ZodString;
}, "strip", z.ZodTypeAny, {
    walletAddress: string;
    amountKas: number;
}, {
    walletAddress: string;
    amountKas: number;
}>;
export declare const BuyGeekResponseSchema: z.ZodObject<{
    paymentId: z.ZodString;
    depositAddress: z.ZodString;
    amountKas: z.ZodNumber;
    geekToReceive: z.ZodNumber;
    status: z.ZodEnum<["PENDING", "CONFIRMED", "FAILED"]>;
}, "strip", z.ZodTypeAny, {
    status: "PENDING" | "CONFIRMED" | "FAILED";
    amountKas: number;
    paymentId: string;
    depositAddress: string;
    geekToReceive: number;
}, {
    status: "PENDING" | "CONFIRMED" | "FAILED";
    amountKas: number;
    paymentId: string;
    depositAddress: string;
    geekToReceive: number;
}>;
export declare const SubmitQuestionSchema: z.ZodObject<{
    category: z.ZodString;
    prompt: z.ZodString;
    options: z.ZodArray<z.ZodString, "many">;
    correctIndex: z.ZodNumber;
    difficulty: z.ZodEnum<["easy", "medium", "hard"]>;
}, "strip", z.ZodTypeAny, {
    options: string[];
    category: string;
    prompt: string;
    correctIndex: number;
    difficulty: "easy" | "medium" | "hard";
}, {
    options: string[];
    category: string;
    prompt: string;
    correctIndex: number;
    difficulty: "easy" | "medium" | "hard";
}>;
export declare const CompanionTypeSchema: z.ZodEnum<["GIGA", "A.C.E"]>;
export declare const ChatRequestSchema: z.ZodObject<{
    companionId: z.ZodEnum<["GIGA", "A.C.E"]>;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    companionId: "GIGA" | "A.C.E";
}, {
    message: string;
    companionId: "GIGA" | "A.C.E";
}>;
export declare const AdminAttemptsQuerySchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
} & {
    userId: z.ZodOptional<z.ZodString>;
    wallet: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
    userId?: string | undefined;
    wallet?: string | undefined;
}, {
    userId?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    wallet?: string | undefined;
}>;
export declare const AdminRewardsQuerySchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
} & {
    status: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
    status?: string | undefined;
}, {
    status?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
//# sourceMappingURL=index.d.ts.map