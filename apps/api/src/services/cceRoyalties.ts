/**
 * Creator royalties (ECONOMY.md §7.1).
 *
 * A creator earns a small royalty each time an approved question of theirs is
 * served in a rewarded game. The caps here are what keep that sustainable:
 *
 *   - no royalty when the creator is the one playing (self-dealing)
 *   - no royalty from a fraud-flagged or removed question
 *   - a per-question LIFETIME cap, so one lucky question cannot mint forever
 *   - daily and weekly per-creator caps
 *   - the global CCE_CREATOR budget on top of all of it
 *
 * Royalties land in pendingBalance and clear after `royaltyClearingHours`.
 */

import type { PrismaClient } from "@prisma/client";
import {
  economyService,
  getRules,
  toAtomic,
  toBigInt,
  fromAtomic,
  minBig,
  clampPositive,
  utcDayKey,
  utcWeekKey,
} from "./economy";
import { logger } from "../lib/logger";

export interface RoyaltyContext {
  questionIds: number[];
  /** The player whose session served these questions. */
  playerId: number;
  sessionId: string;
}

/**
 * Credit royalties for a batch of served questions.
 *
 * Never throws into the gameplay path: a royalty failure must not cost a player
 * their round result. Failures are logged and left for reconciliation.
 */
export async function creditRoyaltiesForServedQuestions(
  prisma: PrismaClient,
  ctx: RoyaltyContext
): Promise<{ credited: number; totalAtomic: bigint }> {
  let credited = 0;
  let total = 0n;

  try {
    const rules = await getRules(prisma);
    const economy = economyService(prisma);
    const perServe = toAtomic(rules.cce.royaltyPerServeGeek);
    if (perServe <= 0n) return { credited: 0, totalAtomic: 0n };

    const lifetimeCap = toAtomic(rules.cce.royaltyLifetimeCapPerQuestionGeek);
    const dailyCap = toAtomic(rules.cce.royaltyDailyCapGeek);
    const weeklyCap = toAtomic(rules.cce.royaltyWeeklyCapGeek);

    const questions = await prisma.question.findMany({
      where: { id: { in: [...new Set(ctx.questionIds)] } },
      select: {
        id: true,
        createdBy: true,
        status: true,
        fraudFlagged: true,
        royaltyPaidAtomic: true,
      },
    });

    for (const q of questions) {
      // Every reason a question earns nothing, in one place.
      if (!q.createdBy) continue;
      if (q.createdBy === ctx.playerId) continue;      // self-play
      if (q.status !== "approved") continue;           // not live
      if (q.fraudFlagged) continue;                    // removed for fraud

      const lifetimePaid = toBigInt(q.royaltyPaidAtomic);
      const lifetimeRemaining = clampPositive(lifetimeCap - lifetimePaid);
      if (lifetimeRemaining <= 0n) continue;

      const amount = minBig(perServe, lifetimeRemaining);

      const grant = await economy.grantReward({
        userId: q.createdBy,
        type: "CREATOR_ROYALTY",
        amount,
        budget: "CCE_CREATOR",
        breaker: "CCE",
        pending: true,
        holdHours: rules.cce.royaltyClearingHours,
        idempotencyKey: `cce:royalty:${q.id}:${ctx.sessionId}`,
        referenceType: "QUESTION",
        referenceId: String(q.id),
        // Daily cap first; the weekly cap is applied as a second consume below.
        userCap: { name: "cce:royalty:daily", periodKey: utcDayKey(), limit: dailyCap },
        metadata: { questionId: q.id, sessionId: ctx.sessionId, playerId: ctx.playerId },
      });

      if (grant.granted > 0n) {
        // Weekly cap is enforced by recording consumption; a creator over the
        // weekly limit has their next daily grants zeroed by the same mechanism.
        await consumeWeeklyRoyaltyCap(prisma, q.createdBy, grant.granted, weeklyCap);

        // `totalEarned` and `CreatorEarning.amount` are legacy Float display
        // columns. The accounting truth is royaltyPaidAtomic and the ledger;
        // these are derived from the exact atomic value via fromAtomic so no
        // float arithmetic is performed on the amount itself.
        const grantedGeek = Number(fromAtomic(grant.granted));

        await prisma.question.update({
          where: { id: q.id },
          data: {
            royaltyPaidAtomic: { increment: grant.granted.toString() },
            totalServes: { increment: 1 },
            totalEarned: { increment: grantedGeek },
            dateLastServed: new Date(),
          },
        });

        await prisma.creatorEarning.create({
          data: {
            creatorId: q.createdBy,
            questionId: q.id,
            amount: grantedGeek,
            sessionId: ctx.sessionId,
            playerId: ctx.playerId,
          },
        });

        credited++;
        total += grant.granted;
      } else {
        // Still count the serve even when no royalty was payable.
        await prisma.question.update({
          where: { id: q.id },
          data: { totalServes: { increment: 1 }, dateLastServed: new Date() },
        });
      }
    }
  } catch (err) {
    // Deliberately swallowed: a royalty problem must never fail a player's round.
    logger.error({ err, sessionId: ctx.sessionId }, "cce.royalty_credit_failed");
  }

  return { credited, totalAtomic: total };
}

async function consumeWeeklyRoyaltyCap(
  prisma: PrismaClient,
  userId: number,
  amount: bigint,
  limit: bigint
): Promise<void> {
  if (limit <= 0n) return;
  const periodKey = utcWeekKey();
  await prisma.userRewardCap.upsert({
    where: { userId_capName_periodKey: { userId, capName: "cce:royalty:weekly", periodKey } },
    create: { userId, capName: "cce:royalty:weekly", periodKey, consumedAtomic: amount.toString(), count: 1 },
    update: { consumedAtomic: { increment: amount.toString() }, count: { increment: 1 } },
  });
}

/** Remaining royalty headroom, for the creator dashboard. */
export async function royaltyHeadroom(prisma: PrismaClient, userId: number) {
  const rules = await getRules(prisma);
  const [daily, weekly] = await Promise.all([
    prisma.userRewardCap.findUnique({
      where: { userId_capName_periodKey: { userId, capName: "cce:royalty:daily", periodKey: utcDayKey() } },
    }),
    prisma.userRewardCap.findUnique({
      where: { userId_capName_periodKey: { userId, capName: "cce:royalty:weekly", periodKey: utcWeekKey() } },
    }),
  ]);

  const dailyCap = toAtomic(rules.cce.royaltyDailyCapGeek);
  const weeklyCap = toAtomic(rules.cce.royaltyWeeklyCapGeek);

  return {
    dailyRemainingAtomic: clampPositive(dailyCap - (daily ? toBigInt(daily.consumedAtomic) : 0n)),
    weeklyRemainingAtomic: clampPositive(weeklyCap - (weekly ? toBigInt(weekly.consumedAtomic) : 0n)),
    dailyCapGeek: rules.cce.royaltyDailyCapGeek,
    weeklyCapGeek: rules.cce.royaltyWeeklyCapGeek,
  };
}
