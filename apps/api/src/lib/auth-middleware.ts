import { FastifyRequest } from "fastify";
import * as jose from "jose";
import { getJwtSecret, SESSION_COOKIE_NAME } from "./jwt";

const JWT_SECRET = getJwtSecret();

export async function authMiddleware(request: FastifyRequest): Promise<void> {
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
    request.userId = typeof verified.payload.userId === "string" ? verified.payload.userId : undefined;
    request.walletAddress =
      typeof verified.payload.walletAddress === "string" ? verified.payload.walletAddress : undefined;
  } catch {
    // Invalid or expired token - continue without auth
  }
}
