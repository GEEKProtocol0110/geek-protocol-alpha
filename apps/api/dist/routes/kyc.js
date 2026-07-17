import { z } from "zod";
import { logger } from "../lib/logger";
// Zod schemas
const SubmitKYCSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    dateOfBirth: z.string().transform((str) => new Date(str)),
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(2),
    idDocumentType: z.enum(["passport", "driver_license", "national_id"]),
    idDocumentUrl: z.string().url(),
});
// Routes
export async function kycRoutes(fastify) {
    // GET /api/kyc/status - Get user's KYC status
    fastify.get("/status", { preHandler: fastify.authenticate }, async (req, reply) => {
        const userId = req.jwtUser.userId;
        const kyc = await fastify.prisma.kYC.findUnique({
            where: { userId },
        });
        const user = await fastify.prisma.user.findUnique({
            where: { id: userId },
        });
        return reply.send({
            success: true,
            data: {
                kycVerified: user?.kycVerified || false,
                kycStatus: kyc?.status || "not_started",
                kyc: kyc,
            },
        });
    });
    // POST /api/kyc/submit - Submit KYC information
    fastify.post("/submit", { preHandler: fastify.authenticate }, async (req, reply) => {
        const parse = SubmitKYCSchema.safeParse(req.body);
        if (!parse.success) {
            return reply.code(400).send({ success: false, error: parse.error.flatten() });
        }
        const userId = req.jwtUser.userId;
        const data = parse.data;
        // Check if user already has a KYC submission
        const existingKYC = await fastify.prisma.kYC.findUnique({
            where: { userId },
        });
        if (existingKYC && existingKYC.status === "approved") {
            return reply.code(400).send({ success: false, error: "KYC already approved" });
        }
        // Upsert KYC record
        const kyc = await fastify.prisma.kYC.upsert({
            where: { userId },
            create: {
                userId,
                status: "pending",
                ...data,
                submittedAt: new Date(),
            },
            update: {
                status: "pending",
                ...data,
                submittedAt: new Date(),
            },
        });
        // TODO: Integrate with a KYC provider (Sumsub, Persona, etc.)
        // For now, we'll just mark it as pending review
        logger.info({ userId, kycId: kyc.id }, "KYC submitted");
        return reply.send({
            success: true,
            data: { kyc },
        });
    });
    // GET /api/kyc/admin/all - Get all KYC submissions (admin only)
    fastify.get("/admin/all", { preHandler: fastify.authenticate }, async (req, reply) => {
        const userId = req.jwtUser.userId;
        // Check if user is admin
        const user = await fastify.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user?.isAdmin) {
            return reply.code(403).send({ success: false, error: "Admin access required" });
        }
        const kycSubmissions = await fastify.prisma.kYC.findMany({
            include: { user: { select: { id: true, username: true, email: true } } },
            orderBy: { createdAt: "desc" },
        });
        return reply.send({
            success: true,
            data: { kycSubmissions },
        });
    });
    // POST /api/kyc/admin/review - Review a KYC submission (admin only)
    fastify.post("/admin/review", { preHandler: fastify.authenticate }, async (req, reply) => {
        const userId = req.jwtUser.userId;
        // Check if user is admin
        const adminUser = await fastify.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!adminUser?.isAdmin) {
            return reply.code(403).send({ success: false, error: "Admin access required" });
        }
        const { kycId, status, rejectionReason } = z.object({
            kycId: z.number().int().positive(),
            status: z.enum(["approved", "rejected"]),
            rejectionReason: z.string().optional(),
        }).parse(req.body);
        // Update KYC record
        const kyc = await fastify.prisma.kYC.update({
            where: { id: kycId },
            data: {
                status,
                reviewedBy: userId,
                reviewedAt: new Date(),
                rejectionReason: status === "rejected" ? rejectionReason : null,
            },
            include: { user: true },
        });
        // Update user's kycVerified status
        await fastify.prisma.user.update({
            where: { id: kyc.userId },
            data: { kycVerified: status === "approved" },
        });
        logger.info({ adminUserId: userId, kycId, status }, "KYC reviewed");
        return reply.send({
            success: true,
            data: { kyc },
        });
    });
}
