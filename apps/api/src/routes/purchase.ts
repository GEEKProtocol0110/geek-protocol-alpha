/**
 * Fiat purchase routes.
 *
 * Purchases are DISABLED pending legal review (ECONOMY.md §13). The endpoints
 * are here, hardened, so they can be audited before being switched on.
 *
 * Four defects in the previous implementation are fixed:
 *
 *   1. The webhook verified a JSON-parsed body. Stripe signs the RAW bytes, so
 *      signature verification could never succeed against a parsed object — the
 *      route was either always failing or, worse, being relied upon while it
 *      silently accepted whatever arrived. A raw body parser is registered here.
 *   2. Webhook processing was not idempotent. Stripe redelivers events; a
 *      redelivery credited the purchase again. Events are now recorded by id.
 *   3. A Purchase row was created with `stripeSessionId: ""` BEFORE the session
 *      existed, so two concurrent checkouts collided on the unique index. The
 *      session is now created first.
 *   4. GEEK was credited from a `checkout.session.completed` event without
 *      checking `payment_status`. It is now credited only on a paid session, and
 *      it lands in pendingBalance for the chargeback-risk window.
 */

import { FastifyInstance } from "fastify";
import { z } from "zod";
import Stripe from "stripe";
import { logger } from "../lib/logger";
import { getKasUsdPrice } from "../lib/coingecko";
import {
  economyService,
  getEconomyConfig,
  isBreakerOpen,
  applyMovement,
  withEconomyTransaction,
  lockUser,
  treasuryBucket,
  toAtomic,
  toBigInt,
  fromAtomic,
  REAL_MONEY_STAGE,
} from "../services/economy";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-06-24.dahlia",
});
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

const CreateCheckoutSchema = z.object({
  fiatAmount: z.number().positive(),
  fiatCurrency: z.string().length(3).default("usd"),
});

export const PURCHASES_DISABLED_MESSAGE =
  "GEEK purchases are not available. They remain disabled pending legal review and compliance work. " +
  "You can earn Alpha GEEK by playing the Daily Quiz and the Gauntlet.";

export async function purchaseRoutes(fastify: FastifyInstance) {
  const economy = economyService(fastify.prisma);

  // Stripe signs the raw request bytes. Fastify's default JSON parser would
  // hand us an object, and `constructEvent` cannot verify a signature against
  // a re-serialized object — the bytes differ. This parser keeps the buffer.
  fastify.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" },
    (req, body, done) => {
      if (req.routeOptions?.url?.endsWith("/webhook")) {
        // Hand the webhook route the raw buffer, untouched.
        done(null, body);
        return;
      }
      try {
        done(null, JSON.parse(body.toString("utf8") || "{}"));
      } catch (err) {
        done(err as Error, undefined);
      }
    }
  );

  // GET /api/purchase/status — whether purchases are available, and why not
  fastify.get("/status", async (_req, reply) => {
    const config = await getEconomyConfig(fastify.prisma);
    return reply.send({
      success: true,
      data: {
        enabled: config.purchasesEnabled,
        reason: config.purchasesEnabled ? null : PURCHASES_DISABLED_MESSAGE,
        stage: config.stage,
        settlementHoldDays: config.rules.purchase.settlementHoldDays,
      },
    });
  });

  // POST /api/purchase/create-checkout
  fastify.post("/create-checkout", { preHandler: fastify.authenticate }, async (req, reply) => {
    const config = await getEconomyConfig(fastify.prisma);
    if (!config.purchasesEnabled || config.stage < REAL_MONEY_STAGE) {
      return reply.code(503).send({
        success: false,
        error: PURCHASES_DISABLED_MESSAGE,
        code: "PURCHASES_DISABLED",
      });
    }
    if (!(await isBreakerOpen(fastify.prisma, "PURCHASES"))) {
      return reply.code(503).send({
        success: false,
        error: "Purchases are temporarily paused. No payment has been taken.",
        code: "PURCHASES_PAUSED",
      });
    }

    const parse = CreateCheckoutSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.code(400).send({ success: false, error: parse.error.flatten() });
    }

    const { fiatAmount, fiatCurrency } = parse.data;
    const limits = config.rules.purchase;
    if (fiatAmount < limits.minFiat || fiatAmount > limits.maxFiat) {
      return reply.code(400).send({
        success: false,
        error: `Purchase amount must be between ${limits.minFiat} and ${limits.maxFiat} ${fiatCurrency.toUpperCase()}.`,
      });
    }

    const userId = req.jwtUser!.userId;
    const kasUsdPrice = await getKasUsdPrice();
    const kasEquivalent = fiatAmount / kasUsdPrice;
    const geekAmount = kasEquivalent * limits.geekPerKas;
    const geekAtomic = toAtomic(geekAmount.toFixed(8));

    // Create the Stripe session FIRST. The previous order wrote a Purchase row
    // with an empty stripeSessionId, so a second concurrent checkout violated
    // the unique index on that column.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: fiatCurrency,
            product_data: {
              name: `${geekAmount.toFixed(0)} GEEK`,
              description: `Purchase ${geekAmount.toFixed(0)} GEEK at ${kasUsdPrice} USD/KAS`,
            },
            unit_amount: Math.round(fiatAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/purchase/cancel`,
      metadata: {
        userId: String(userId),
        geekAtomic: geekAtomic.toString(),
      },
    });

    await fastify.prisma.purchase.create({
      data: {
        userId,
        fiatAmount,
        fiatCurrency,
        kasEquivalent,
        geekAmount,
        geekAmountAtomic: geekAtomic.toString(),
        lockedRate: kasUsdPrice,
        status: "pending",
        stripeSessionId: session.id,
      },
    });

    return reply.send({
      success: true,
      data: {
        sessionId: session.id,
        sessionUrl: session.url,
        geekAmount,
        settlementHoldDays: limits.settlementHoldDays,
        notice: `Purchased GEEK is held for ${limits.settlementHoldDays} days before it becomes spendable.`,
      },
    });
  });

  // POST /api/purchase/webhook — Stripe events
  fastify.post("/webhook", async (req, reply) => {
    const sig = req.headers["stripe-signature"] as string | undefined;
    if (!sig || !STRIPE_WEBHOOK_SECRET) {
      return reply.code(400).send({ success: false, error: "Missing signature or webhook secret" });
    }

    // `req.body` is a Buffer here thanks to the parser registered above.
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body as Buffer, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      logger.error({ err }, "stripe.webhook_signature_invalid");
      return reply.code(400).send({ success: false, error: "Invalid signature" });
    }

    // Idempotency: Stripe redelivers. Record the event id first; if it is
    // already recorded, acknowledge and do nothing.
    try {
      await fastify.prisma.stripeWebhookEvent.create({
        data: { id: event.id, type: event.type },
      });
    } catch {
      logger.info({ eventId: event.id, type: event.type }, "stripe.webhook_replay_ignored");
      return reply.send({ success: true, replay: true });
    }

    try {
      switch (event.type) {
        case "checkout.session.completed":
        case "checkout.session.async_payment_succeeded": {
          const session = event.data.object as Stripe.Checkout.Session;
          // Only a genuinely paid session credits anything.
          if (session.payment_status !== "paid") {
            logger.warn(
              { sessionId: session.id, paymentStatus: session.payment_status },
              "stripe.session_completed_but_unpaid"
            );
            break;
          }
          await creditPurchase(fastify, economy, session);
          break;
        }

        case "checkout.session.async_payment_failed": {
          const session = event.data.object as Stripe.Checkout.Session;
          await fastify.prisma.purchase.updateMany({
            where: { stripeSessionId: session.id },
            data: { status: "failed" },
          });
          break;
        }

        case "charge.refunded":
        case "charge.dispute.created": {
          await handleReversal(fastify, economy, event);
          break;
        }

        default:
          logger.info({ eventType: event.type }, "stripe.unhandled_event");
      }
    } catch (err) {
      logger.error({ err, eventId: event.id }, "stripe.webhook_processing_failed");
      // Delete the marker so Stripe's retry can genuinely re-process.
      await fastify.prisma.stripeWebhookEvent.delete({ where: { id: event.id } }).catch(() => undefined);
      return reply.code(500).send({ success: false, error: "Processing failed" });
    }

    return reply.send({ success: true });
  });
}

/**
 * Credit a paid purchase into PENDING balance with a settlement hold.
 * Purchased GEEK is not withdrawable until the chargeback window passes.
 */
async function creditPurchase(
  fastify: FastifyInstance,
  economy: ReturnType<typeof economyService>,
  session: Stripe.Checkout.Session
): Promise<void> {
  const config = await getEconomyConfig(fastify.prisma);
  const purchase = await fastify.prisma.purchase.findUnique({
    where: { stripeSessionId: session.id },
  });
  if (!purchase) {
    logger.error({ sessionId: session.id }, "stripe.purchase_row_missing");
    return;
  }

  const amount = toBigInt(purchase.geekAmountAtomic);
  if (amount <= 0n) return;

  const holdUntil = new Date(Date.now() + config.rules.purchase.settlementHoldDays * 86_400_000);

  await withEconomyTransaction(fastify.prisma, async (tx) => {
    await lockUser(tx, purchase.userId);

    await applyMovement(tx, {
      userId: purchase.userId,
      type: "PURCHASE_CONFIRMED",
      amount,
      from: treasuryBucket("OPERATIONS_TREASURY"),
      to: "PENDING",
      referenceType: "PURCHASE",
      referenceId: String(purchase.id),
      idempotencyKey: `purchase:confirm:${session.id}`,
      clearsAt: holdUntil,
      metadata: {
        stripeSessionId: session.id,
        fiatAmount: purchase.fiatAmount.toString(),
        fiatCurrency: purchase.fiatCurrency,
      },
    });

    await tx.purchase.update({
      where: { id: purchase.id },
      data: { status: "completed", settlementHoldUntil: holdUntil },
    });
  });

  logger.info({ sessionId: session.id, amount: fromAtomic(amount) }, "stripe.purchase_credited");
  void economy;
}

/** Refund or chargeback: reverse the credit if it has not already cleared. */
async function handleReversal(
  fastify: FastifyInstance,
  economy: ReturnType<typeof economyService>,
  event: Stripe.Event
): Promise<void> {
  const charge = event.data.object as Stripe.Charge | Stripe.Dispute;
  const paymentIntent =
    typeof (charge as Stripe.Charge).payment_intent === "string"
      ? ((charge as Stripe.Charge).payment_intent as string)
      : typeof (charge as Stripe.Dispute).payment_intent === "string"
        ? ((charge as Stripe.Dispute).payment_intent as string)
        : null;
  if (!paymentIntent) return;

  const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntent, limit: 1 });
  const session = sessions.data[0];
  if (!session) return;

  const original = await fastify.prisma.economyTransaction.findUnique({
    where: { idempotencyKey: `purchase:confirm:${session.id}` },
  });
  if (!original || original.status === "REVERSED") return;

  await economy.reverse(
    original.id,
    event.type === "charge.refunded" ? "Stripe refund" : "Stripe chargeback"
  );

  await fastify.prisma.purchase.updateMany({
    where: { stripeSessionId: session.id },
    data: {
      status: event.type === "charge.refunded" ? "refunded" : "disputed",
      refundedAt: event.type === "charge.refunded" ? new Date() : undefined,
      disputedAt: event.type === "charge.dispute.created" ? new Date() : undefined,
    },
  });

  logger.warn({ sessionId: session.id, eventType: event.type }, "stripe.purchase_reversed");
}
