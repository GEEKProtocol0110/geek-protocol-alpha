import { FastifyInstance } from "fastify";
import { z } from "zod";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { logger } from "../lib/logger";
import { verifyKaspaSignature } from "../lib/kasware";
import { generateKaspaWallet } from "../lib/kaspa";
import { encryptPrivateKey } from "../lib/security";
import { consumeNonce, issueNonce, parseLoginMessage, NONCE_TTL_MS } from "../lib/authNonce";

const SECRET_KEY = new TextEncoder().encode(
  process.env.SECRET_KEY || "dev-secret-key-change-in-production"
);

const COOKIE_NAME = "gp_session";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? ("strict" as const) : ("lax" as const),
  maxAge: 7 * 24 * 60 * 60,
  path: "/",
};

// ── Zod schemas ──────────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, underscores and hyphens"),
  email: z.string().email(),
  password: z.string().min(8),
});

const LoginSchema = z.object({
  email: z.string().optional(),
  username: z.string().optional(),
  password: z.string(),
});

const WalletLoginSchema = z.object({
  walletAddress: z.string(),
  message: z.string(),
  signature: z.string(),
});

const NonceSchema = z.object({
  walletAddress: z.string().min(10).max(200),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function publicUser(user: Record<string, unknown>) {
  const { passwordHash, ...pub } = user;
  void passwordHash;
  return pub;
}

async function issueSession(fastify: FastifyInstance, userId: number) {
  const user = await fastify.prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    isAdmin: user.isAdmin,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);

  return { user, token };
}

async function updateStreak(fastify: FastifyInstance, userId: number) {
  const user = await fastify.prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const now = new Date();
  const last = user.lastLoginDate;
  let streak = user.currentStreak;

  if (last) {
    const diffDays = Math.floor((now.getTime() - last.getTime()) / 86_400_000);
    if (diffDays === 1) {
      streak += 1;
    } else if (diffDays > 1) {
      streak = 1;
    }
  } else {
    streak = 1;
  }

  await fastify.prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: streak,
      longestStreak: Math.max(streak, user.longestStreak),
      lastLoginDate: now,
      streakBonusMultiplier: Math.min(2.0, 1.0 + streak * 0.1),
    },
  });
}

// ── Route plugin ──────────────────────────────────────────────────────────────

export async function authRoutes(fastify: FastifyInstance) {
  // POST /api/auth/register
  fastify.post("/register", async (req, reply) => {
    const parse = RegisterSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.code(400).send({ error: parse.error.flatten() });
    }
    const { username, email, password } = parse.data;

    const existing = await fastify.prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { username: true, email: true },
    });

    if (existing) {
      const field = existing.email === email ? "email" : "username";
      return reply.code(409).send({ error: `${field} already taken` });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Generate custodial wallet
    const { address, privateKey } = await generateKaspaWallet();
    const encryptedPrivKey = encryptPrivateKey(privateKey);

    const totalUsers = await fastify.prisma.user.count();
    const isFirst = totalUsers === 0;

    const user = await fastify.prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        walletAddress: address,
        encryptedPrivKey,
        role: isFirst ? "admin" : "player",
        isAdmin: isFirst,
      },
    });

    return reply.code(201).send({ data: publicUser(user as unknown as Record<string, unknown>) });
  });

  // POST /api/auth/login
  fastify.post("/login", async (req, reply) => {
    const parse = LoginSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.code(400).send({ error: parse.error.flatten() });
    }
    const { email, username, password } = parse.data;

    if (!email && !username) {
      return reply.code(400).send({ error: "email or username required" });
    }

    const user = await fastify.prisma.user.findFirst({
      where: email ? { email } : { username },
    });

    const validPassword =
      user && (await bcrypt.compare(password, user.passwordHash));

    if (!user || !validPassword) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    await updateStreak(fastify, user.id);
    const { user: fresh, token } = await issueSession(fastify, user.id);

    return reply
      .cookie(COOKIE_NAME, token, COOKIE_OPTS)
      .send({ data: { ...publicUser(fresh as unknown as Record<string, unknown>), token } });
  });

  // POST /api/auth/nonce — issue a single-use login challenge
  fastify.post(
    "/nonce",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const parse = NonceSchema.safeParse(req.body);
      if (!parse.success) {
        return reply.code(400).send({ error: parse.error.flatten() });
      }

      const { nonce, message, expiresAt, expiresInMs } = await issueNonce(
        fastify.redis,
        parse.data.walletAddress
      );

      // The client signs `message` verbatim — it must not compose its own.
      return reply.send({ data: { nonce, message, expiresAt, expiresInMs } });
    }
  );

  // POST /api/auth/wallet-login
  fastify.post("/wallet-login", async (req, reply) => {
    const parse = WalletLoginSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.code(400).send({ error: parse.error.flatten() });
    }
    const { walletAddress, message, signature } = parse.data;

    // Message must be one we issued: "Geek Protocol Login\n<address>\n<nonce>\n<issuedAt>"
    const parsed = parseLoginMessage(message);
    if (!parsed || parsed.walletAddress !== walletAddress) {
      return reply.code(400).send({ error: "Invalid message format" });
    }

    // Burn the nonce BEFORE verifying the signature. Consuming first means a
    // replay is rejected even if the attacker holds a genuinely valid signature,
    // and it costs an attacker a fresh challenge per verification attempt.
    const consumed = await consumeNonce(fastify.redis, walletAddress, parsed.nonce);
    if (!consumed.ok) {
      logger.warn(
        { walletAddress, reason: consumed.reason },
        "Wallet login rejected: nonce already used or expired"
      );
      return reply.code(401).send({
        error:
          consumed.reason === "expired"
            ? `Login challenge expired (${NONCE_TTL_MS / 1000}s limit). Please retry.`
            : "Login challenge already used or unknown. Please retry.",
      });
    }

    const valid = await verifyKaspaSignature(walletAddress, message, signature);
    if (!valid) {
      return reply.code(401).send({ error: "Invalid wallet signature" });
    }

    let user = await fastify.prisma.user.findFirst({ where: { walletAddress } });

    if (!user) {
      const prefix = walletAddress.slice(-8);
      const username = `kaspa_${prefix}`;
      const email = `${prefix}@wallet.geekprotocol.local`;
      const randomPw = crypto.randomBytes(32).toString("hex");
      const passwordHash = await bcrypt.hash(randomPw, 12);

      const totalUsers = await fastify.prisma.user.count();
      user = await fastify.prisma.user.create({
        data: {
          username,
          email,
          passwordHash,
          walletAddress,
          role: totalUsers === 0 ? "admin" : "player",
          isAdmin: totalUsers === 0,
        },
      });
    }

    await updateStreak(fastify, user.id);
    const { user: fresh, token } = await issueSession(fastify, user.id);

    return reply
      .cookie(COOKIE_NAME, token, COOKIE_OPTS)
      .send({ data: { ...publicUser(fresh as unknown as Record<string, unknown>), token } });
  });

  // POST /api/auth/logout
  fastify.post("/logout", async (_req, reply) => {
    return reply.clearCookie(COOKIE_NAME).code(200).send({ message: "Logged out" });
  });

  // GET /api/auth/me
  fastify.get(
    "/me",
    { preHandler: fastify.authenticate },
    async (req, reply) => {
      const userId = req.jwtUser!.userId;

      const user = await fastify.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return reply.code(404).send({ error: "User not found" });
      }

      const xpForLevel = (lvl: number) => lvl * 1000;
      const currentLevelXp = xpForLevel(user.level);
      const nextLevelXp = xpForLevel(user.level + 1);
      const xpProgress = Math.min(
        100,
        Math.round(((user.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)
      );

      logger.info({ userId }, "GET /me");

      return reply.send({
        data: {
          ...publicUser(user as unknown as Record<string, unknown>),
          levelStage: `Level ${user.level}`,
          xpProgress,
          streakMultiplier: user.streakBonusMultiplier,
          characterAffinities: {
            GIGA: user.characterAffinityGiga,
            ACE: user.characterAffinityAce,
          },
        },
      });
    }
  );
}
