import fp from "fastify-plugin";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.SECRET_KEY || "dev-secret-key-change-in-production"
);

export interface JWTPayload {
  userId: number;
  email: string;
  username: string;
  role: string;
  isAdmin: boolean;
}

async function authPlugin(fastify: FastifyInstance) {
  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authHeader = request.headers.authorization;
        const bearerToken = authHeader?.startsWith("Bearer ")
          ? authHeader.slice(7)
          : undefined;

        const cookieToken = request.cookies?.gp_session ?? undefined;

        const token = bearerToken ?? cookieToken;

        if (!token) {
          return reply.code(401).send({ error: "Authentication required" });
        }

        const { payload } = await jwtVerify(token, SECRET_KEY);

        if (
          typeof payload.userId !== "number" ||
          typeof payload.email !== "string" ||
          typeof payload.username !== "string" ||
          typeof payload.role !== "string" ||
          typeof payload.isAdmin !== "boolean"
        ) {
          return reply.code(401).send({ error: "Invalid token payload" });
        }

        request.jwtUser = payload as unknown as JWTPayload;
      } catch {
        return reply.code(401).send({ error: "Invalid or expired token" });
      }
    }
  );

  fastify.decorate(
    "authenticateOptional",
    async (request: FastifyRequest, _reply: FastifyReply) => {
      try {
        const authHeader = request.headers.authorization;
        const bearerToken = authHeader?.startsWith("Bearer ")
          ? authHeader.slice(7)
          : undefined;

        const cookieToken = request.cookies?.gp_session ?? undefined;

        const token = bearerToken ?? cookieToken;
        if (!token) return;

        const { payload } = await jwtVerify(token, SECRET_KEY);

        if (
          typeof payload.userId === "number" &&
          typeof payload.email === "string" &&
          typeof payload.username === "string" &&
          typeof payload.role === "string" &&
          typeof payload.isAdmin === "boolean"
        ) {
          request.jwtUser = payload as unknown as JWTPayload;
        }
      } catch {
        // Anonymous - leave request.jwtUser unset
      }
    }
  );
}

export default fp(authPlugin);
