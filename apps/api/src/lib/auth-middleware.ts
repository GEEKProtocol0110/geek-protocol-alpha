import { FastifyRequest, FastifyReply } from "fastify";
import * as jose from "jose";

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Extract JWT from cookies or Authorization header
    const token =
      request.cookies.token ||
      request.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return; // Continue without auth
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
    const verified = await jose.jwtVerify(token, secret);

    // Attach userId and walletAddress to request
    (request as any).userId = verified.payload.userId;
    (request as any).walletAddress = verified.payload.walletAddress;
  } catch (error) {
    // Invalid or expired token - continue without auth
  }
}
