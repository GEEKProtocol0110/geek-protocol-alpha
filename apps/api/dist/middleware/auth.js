import fp from "fastify-plugin";
import { jwtVerify } from "jose";
const SECRET_KEY = new TextEncoder().encode(process.env.SECRET_KEY || "dev-secret-key-change-in-production");
async function authPlugin(fastify) {
    fastify.decorate("authenticate", async (request, reply) => {
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
            if (typeof payload.userId !== "number" ||
                typeof payload.email !== "string" ||
                typeof payload.username !== "string" ||
                typeof payload.role !== "string" ||
                typeof payload.isAdmin !== "boolean") {
                return reply.code(401).send({ error: "Invalid token payload" });
            }
            request.jwtUser = payload;
        }
        catch {
            return reply.code(401).send({ error: "Invalid or expired token" });
        }
    });
    fastify.decorate("authenticateOptional", async (request, _reply) => {
        try {
            const authHeader = request.headers.authorization;
            const bearerToken = authHeader?.startsWith("Bearer ")
                ? authHeader.slice(7)
                : undefined;
            const cookieToken = request.cookies?.gp_session ?? undefined;
            const token = bearerToken ?? cookieToken;
            if (!token)
                return;
            const { payload } = await jwtVerify(token, SECRET_KEY);
            if (typeof payload.userId === "number" &&
                typeof payload.email === "string" &&
                typeof payload.username === "string" &&
                typeof payload.role === "string" &&
                typeof payload.isAdmin === "boolean") {
                request.jwtUser = payload;
            }
        }
        catch {
            // Anonymous - leave request.jwtUser unset
        }
    });
}
export default fp(authPlugin);
