import { SignJWT, jwtVerify } from "jose";
import { NonceResponseSchema, VerifySignatureSchema } from "@geek/shared";
import { logger } from "../lib/logger";
import { verifyKasWareSignature } from "../lib/kasware";
import { getJwtSecret, SESSION_COOKIE_NAME } from "../lib/jwt";
import crypto from "crypto";
const JWT_SECRET = getJwtSecret();
export async function authRoutes(fastify) {
    // Generate nonce
    fastify.post("/nonce", async (request, reply) => {
        try {
            const nonce = crypto.randomBytes(32).toString("hex");
            const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
            // Store nonce in Redis with TTL
            await fastify.redis.setex(`nonce:${nonce}`, 600, // 10 minutes in seconds
            JSON.stringify({ used: false, expiresAt }));
            const response = NonceResponseSchema.parse({
                nonce,
                expiresAt,
            });
            return reply.send({ success: true, data: response });
        }
        catch (err) {
            logger.error(err, "Failed to generate nonce");
            return reply.code(500).send({ success: false, error: "Failed to generate nonce" });
        }
    });
    // Verify signature and issue session
    fastify.post("/verify", async (request, reply) => {
        try {
            const body = VerifySignatureSchema.parse(request.body);
            const { walletAddress, signature, nonce } = body;
            // Check nonce validity
            const nonceData = await fastify.redis.get(`nonce:${nonce}`);
            if (!nonceData) {
                return reply.code(400).send({
                    success: false,
                    error: "Invalid or expired nonce",
                });
            }
            const parsed = JSON.parse(nonceData);
            if (parsed.used) {
                return reply.code(400).send({
                    success: false,
                    error: "Nonce already used",
                });
            }
            // Verify signature with KasWare
            const isValidSignature = verifyKasWareSignature(nonce, signature, walletAddress);
            if (!isValidSignature) {
                return reply.code(401).send({
                    success: false,
                    error: "Invalid signature",
                });
            }
            await fastify.redis.setex(`nonce:${nonce}`, 600, JSON.stringify({ used: true }));
            // Get or create user
            let user = await fastify.prisma.user.findUnique({
                where: { walletAddress },
            });
            if (!user) {
                user = await fastify.prisma.user.create({
                    data: { walletAddress },
                });
            }
            // Issue JWT
            const now = new Date();
            const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
            const token = await new SignJWT({
                userId: user.id,
                walletAddress: user.walletAddress,
            })
                .setProtectedHeader({ alg: "HS256" })
                .setIssuedAt()
                .setExpirationTime(expiresAt)
                .sign(JWT_SECRET);
            return reply
                .cookie(SESSION_COOKIE_NAME, token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60, // 7 days
            })
                .send({
                success: true,
                data: {
                    userId: user.id,
                    walletAddress: user.walletAddress,
                    token,
                },
            });
        }
        catch (err) {
            logger.error(err, "Failed to verify signature");
            return reply.code(400).send({
                success: false,
                error: "Invalid request or signature verification failed",
            });
        }
    });
    // Get current user profile
    fastify.get("/me", async (request, reply) => {
        try {
            const token = request.cookies[SESSION_COOKIE_NAME] || extractBearerToken(request.headers.authorization);
            if (!token) {
                return reply.code(401).send({
                    success: false,
                    error: "No session token",
                });
            }
            const verified = await jwtVerify(token, JWT_SECRET);
            const userId = verified.payload.userId;
            const user = await fastify.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                return reply.code(404).send({
                    success: false,
                    error: "User not found",
                });
            }
            return reply.send({
                success: true,
                data: {
                    id: user.id,
                    walletAddress: user.walletAddress,
                    xp: user.xp,
                    level: user.level,
                    streak: user.streak,
                },
            });
        }
        catch (err) {
            logger.error(err, "Failed to get user profile");
            return reply.code(401).send({
                success: false,
                error: "Invalid or expired session",
            });
        }
    });
    // Logout
    fastify.post("/logout", async (request, reply) => {
        return reply
            .clearCookie(SESSION_COOKIE_NAME)
            .send({ success: true, data: { message: "Logged out" } });
    });
}
function extractBearerToken(authHeader) {
    if (!authHeader)
        return null;
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer")
        return null;
    return parts[1];
}
