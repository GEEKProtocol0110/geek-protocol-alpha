import "fastify";
import type { PrismaClient } from "@prisma/client";
import type Redis from "ioredis";
import type { JWTPayload } from "../middleware/auth";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
    redis: Redis;
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }

  interface FastifyRequest {
    userId?: string;
    walletAddress?: string;
    jwtUser?: JWTPayload;
  }
}
