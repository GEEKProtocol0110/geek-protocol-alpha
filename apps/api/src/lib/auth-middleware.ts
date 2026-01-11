import { FastifyRequest, FastifyReply } from "fastify";
import * as jose from "jose";
import { getJwtSecret, SESSION_COOKIE_NAME } from "./jwt";

const JWT_SECRET = getJwtSecret();

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Extract JWT from cookies or Authorization header
    const cookieToken = request.cookies?.[SESSION_COOKIE_NAME];
    const header = request.headers.authorization;
    const bearerToken = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    const token = cookieToken || bearerToken;

    if (!token) {
      return; // Continue without auth
    }

    const verified = await jose.jwtVerify(token, JWT_SECRET);

    // Attach userId and walletAddress to request
    (request as any).userId = verified.payload.userId;
    (request as any).walletAddress = verified.payload.walletAddress;
  } catch (error) {
    // Invalid or expired token - continue without auth
  }
}
