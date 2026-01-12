import "fastify";
import type { PrismaClient } from "@prisma/client";
import type Redis from "ioredis";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
    redis: Redis;
  }

  interface FastifyRequest {
    userId?: string;
    walletAddress?: string;
  }
}
