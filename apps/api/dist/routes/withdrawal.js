import { z } from "zod";
import { logger } from "../lib/logger";
import { getGeekBalance } from "../lib/geekBalance";
import { enqueuePayout } from "../lib/payoutQueue";
// Zod schemas
const WithdrawSchema = z.object({
    toAddress: z.string(),
    amount: z.number().positive(),
});
// Routes
export async function withdrawalRoutes(fastify) {
    // POST /api/wallet/withdraw - Request a withdrawal
    fastify.post("/withdraw", { preHandler: fastify.authenticate }, async (req, reply) => {
        const parse = WithdrawSchema.safeParse(req.body);
        if (!parse.success) {
            return reply.code(400).send({ success: false, error: parse.error.flatten() });
        }
        const { toAddress, amount } = parse.data;
        const userId = req.jwtUser.userId;
        // Get user
        const user = await fastify.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return reply.code(404).send({ success: false, error: "User not found" });
        }
        // Check user balance
        if (user.geekBalance.toNumber() < amount) {
            return reply.code(400).send({ success: false, error: "Insufficient balance" });
        }
        // Check KYC (for high amounts)
        if (amount > 10000 && !user.kycVerified) {
            return reply.code(400).send({ success: false, error: "KYC required for withdrawals over 10,000 GEEK" });
        }
        // Create withdrawal record
        const withdrawal = await fastify.prisma.withdrawal.create({
            data: {
                userId,
                toAddress,
                amount,
                status: "pending",
            },
        });
        // Enqueue withdrawal job
        await enqueuePayout({
            attemptId: withdrawal.id.toString(),
            userId,
            toAddress,
            rewardAmount: amount,
            type: "withdrawal",
        });
        return reply.send({
            success: true,
            data: { withdrawalId: withdrawal.id, status: "pending" },
        });
    });
    // GET /api/wallet/balance - Get user's GEEK balance
    fastify.get("/balance", { preHandler: fastify.authenticate }, async (req, reply) => {
        const userId = req.jwtUser.userId;
        const user = await fastify.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return reply.code(404).send({ success: false, error: "User not found" });
        }
        // Get on-chain balance (optional)
        let onChainBalance = "0";
        if (user.walletAddress) {
            try {
                onChainBalance = await getGeekBalance(user.walletAddress);
            }
            catch (err) {
                logger.error({ err }, "Failed to fetch on-chain balance");
            }
        }
        return reply.send({
            success: true,
            data: {
                custodialBalance: user.geekBalance.toNumber(),
                onChainBalance,
            },
        });
    });
}
