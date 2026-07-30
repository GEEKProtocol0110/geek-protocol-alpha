import { FastifyInstance } from "fastify";
import { z } from "zod";
import Stripe from "stripe";
import { logger } from "../lib/logger";
import Redis from "ioredis";
import { getKasUsdPrice } from "../lib/coingecko";
import { enqueuePayout } from "../lib/payoutQueue";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-06-24.dahlia",
});
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const GEEK_PER_KAS = 100000; // 1 KAS = 100,000 GEEK

// Zod schemas
const CreateCheckoutSchema = z.object({
  fiatAmount: z.number().positive(),
  fiatCurrency: z.string().default("usd"),
});

// Routes
export async function purchaseRoutes(fastify: FastifyInstance) {
  // POST /api/purchase/create-checkout - Create Stripe checkout session
  fastify.post("/create-checkout",
    { preHandler: fastify.authenticate },
    async (req, reply) => {
      const parse = CreateCheckoutSchema.safeParse(req.body);
      if (!parse.success) {
        return reply.code(400).send({ success: false, error: parse.error.flatten() });
      }

      const { fiatAmount, fiatCurrency } = parse.data;
      const userId = req.jwtUser!.userId;

      // Get current KAS price
      const kasUsdPrice = await getKasUsdPrice();
      const kasEquivalent = fiatAmount / kasUsdPrice;
      const geekAmount = kasEquivalent * GEEK_PER_KAS;

      // Create Purchase record
      const purchase = await fastify.prisma.purchase.create({
        data: {
          userId,
          fiatAmount,
          fiatCurrency,
          kasEquivalent,
          geekAmount,
          lockedRate: kasUsdPrice,
          status: "pending",
          stripeSessionId: "",
        },
      });

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: fiatCurrency,
              product_data: {
                name: `${geekAmount.toFixed(0)} GEEK Tokens`,
                description: `Purchase ${geekAmount.toFixed(0)} GEEK tokens at ${kasUsdPrice} USD/KAS`,
              },
              unit_amount: Math.round(fiatAmount * 100), // Stripe uses cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/purchase/cancel`,
        metadata: {
          userId: userId.toString(),
          purchaseId: purchase.id.toString(),
          geekAmount: geekAmount.toString(),
        },
      });

      // Update Purchase with Stripe session ID
      await fastify.prisma.purchase.update({
        where: { id: purchase.id },
        data: { stripeSessionId: session.id },
      });

      return reply.send({
        success: true,
        data: { sessionId: session.id, sessionUrl: session.url },
      });
    });

  // POST /api/purchase/webhook - Stripe webhook
  fastify.post("/webhook", async (req, reply) => {
    const sig = req.headers["stripe-signature"] as string;
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body as string,
        sig,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      logger.error({ err }, "Webhook signature verification failed");
      return reply.code(400).send({ success: false, error: "Invalid signature" });
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, purchaseId, geekAmount } = session.metadata || {};

        if (!userId || !purchaseId || !geekAmount) {
          logger.error({ sessionId: session.id }, "Missing metadata in checkout session");
          break;
        }

        // Enqueue purchase reward job
        await enqueuePayout({
          attemptId: session.id,
          userId: parseInt(userId),
          rewardAmount: parseFloat(geekAmount),
          type: "purchase_reward",
        });

        logger.info({ sessionId: session.id }, "Checkout session completed");
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        logger.info({ sessionId: session.id }, "Async payment succeeded");
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logger.error({ sessionId: session.id }, "Async payment failed");
        // Update purchase status to failed
        await fastify.prisma.purchase.update({
          where: { stripeSessionId: session.id },
          data: { status: "failed" },
        });
        break;
      }

      default:
        logger.info({ eventType: event.type }, "Unhandled event type");
    }

    // Return a 200 response to acknowledge receipt of the event
    return reply.send({ success: true });
  });
}
