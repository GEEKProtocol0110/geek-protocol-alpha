/**
 * Anti-collusion rules for the Creator Content Engine review pool.
 *
 * The original gates were level >= 10, no self-review, and no double-review.
 * That left a ring of sock-puppet accounts free to farm the pool: reviewing paid
 * a flat 0.1 GEEK with no daily ceiling and no accuracy requirement, and three
 * approvals auto-published a question, so three accounts could rubber-stamp each
 * other indefinitely.
 *
 * The rules below are all derived from existing tables — no migration needed.
 */
const num = (env, fallback) => Math.max(0, parseInt(process.env[env] || String(fallback), 10) || fallback);
/** Existing level gate. */
export const MIN_LEVEL = num("CCE_MIN_LEVEL", 10);
/** A quiz attempt counts as a "win" at or above this many correct answers. */
export const WIN_MIN_CORRECT = num("CCE_WIN_MIN_CORRECT", 7);
/** Wins required before a player may vote at all. Levelling alone isn't enough. */
export const MIN_WINS = num("CCE_MIN_WINS", 5);
/** Hard ceiling on reviews per UTC day, per account. Caps the faucet. */
export const DAILY_REVIEW_CAP = num("CCE_DAILY_REVIEW_CAP", 30);
/** Accounts must be this old before voting — raises the cost of a fresh ring. */
export const MIN_ACCOUNT_AGE_HOURS = num("CCE_MIN_ACCOUNT_AGE_HOURS", 72);
/**
 * Cap on how many of one creator's questions a single reviewer may vote on in a
 * rolling week. This is the rule that actually breaks a sock-puppet ring: a
 * colluding account can no longer wave through everything its partners submit.
 */
export const MAX_PER_CREATOR_WEEK = num("CCE_MAX_PER_CREATOR_WEEK", 3);
/** Votes needed to publish. Raised from 3 so three accounts are no longer quorum. */
export const APPROVAL_THRESHOLD = num("CCE_APPROVAL_THRESHOLD", 5);
export const REJECTION_THRESHOLD = num("CCE_REJECTION_THRESHOLD", 3);
/** Reviews resolved before accuracy is enforced, and the floor once it is. */
export const ACCURACY_GRACE_REVIEWS = num("CCE_ACCURACY_GRACE_REVIEWS", 20);
export const MIN_ACCURACY_PCT = num("CCE_MIN_ACCURACY_PCT", 40);
/** Reviews faster than this are reflex clicks, not reads. */
export const MIN_REVIEW_SECONDS = num("CCE_MIN_REVIEW_SECONDS", 5);
export const REVIEW_REWARD_GEEK = 0.1;
export function startOfUtcDay(now = new Date()) {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
/**
 * Single source of truth for "may this user review right now". Both the serving
 * endpoint and the vote endpoint call it, so the UI can never show a question the
 * vote endpoint would refuse.
 */
export async function getReviewEligibility(prisma, userId) {
    const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { level: true, dateCreated: true, reviewAccuracy: true },
    });
    const [wins, todayCount, resolvedReviews] = await Promise.all([
        // A "win" is a real completed quiz attempt with a real score — you have to
        // have played the game before you get a say in its content.
        prisma.quizAttempt.count({
            where: { userId, correctCount: { gte: WIN_MIN_CORRECT } },
        }),
        prisma.questionValidation.count({
            where: { validatorId: userId, timestamp: { gte: startOfUtcDay() } },
        }),
        prisma.questionValidation.count({
            where: { validatorId: userId, question: { status: { in: ["approved", "rejected"] } } },
        }),
    ]);
    const accountAgeHours = (Date.now() - user.dateCreated.getTime()) / 3600000;
    const accuracyPct = user.reviewAccuracy;
    const reasons = [];
    if (user.level < MIN_LEVEL)
        reasons.push(`Requires Level ${MIN_LEVEL} (you are ${user.level}).`);
    if (wins < MIN_WINS) {
        reasons.push(`Requires ${MIN_WINS} quiz wins (${WIN_MIN_CORRECT}+ correct). You have ${wins}.`);
    }
    if (accountAgeHours < MIN_ACCOUNT_AGE_HOURS) {
        reasons.push(`Account must be ${MIN_ACCOUNT_AGE_HOURS}h old before reviewing.`);
    }
    if (todayCount >= DAILY_REVIEW_CAP) {
        reasons.push(`Daily review limit reached (${DAILY_REVIEW_CAP}). Resets at 00:00 UTC.`);
    }
    if (resolvedReviews >= ACCURACY_GRACE_REVIEWS && accuracyPct < MIN_ACCURACY_PCT) {
        reasons.push(`Review accuracy ${Math.round(accuracyPct)}% is below the ${MIN_ACCURACY_PCT}% minimum.`);
    }
    return {
        eligible: reasons.length === 0,
        reasons,
        level: user.level,
        wins,
        reviewsToday: todayCount,
        dailyCap: DAILY_REVIEW_CAP,
        reviewsRemainingToday: Math.max(0, DAILY_REVIEW_CAP - todayCount),
        accuracyPct: Math.round(accuracyPct),
        resolvedReviews,
        accountAgeHours: Math.floor(accountAgeHours),
    };
}
/** Creators this reviewer has already hit the weekly cap for. */
export async function cappedCreatorIds(prisma, userId) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600000);
    const recent = await prisma.questionValidation.findMany({
        where: { validatorId: userId, timestamp: { gte: weekAgo } },
        select: { question: { select: { createdBy: true } } },
    });
    const perCreator = new Map();
    for (const r of recent) {
        const creator = r.question.createdBy;
        if (creator == null)
            continue;
        perCreator.set(creator, (perCreator.get(creator) || 0) + 1);
    }
    return [...perCreator.entries()]
        .filter(([, count]) => count >= MAX_PER_CREATOR_WEEK)
        .map(([creator]) => creator);
}
/**
 * Recompute a reviewer's agreement with final consensus. Called when a question
 * resolves, so rubber-stamping shows up in the number that gates reviewing.
 */
export async function recomputeReviewerAccuracy(prisma, validatorId) {
    const validations = await prisma.questionValidation.findMany({
        where: { validatorId, question: { status: { in: ["approved", "rejected"] } } },
        select: { action: true, question: { select: { status: true } } },
    });
    if (validations.length === 0)
        return;
    const agreed = validations.filter((v) => (v.action === "approve" && v.question.status === "approved") ||
        (v.action === "reject" && v.question.status === "rejected")).length;
    await prisma.user.update({
        where: { id: validatorId },
        data: { reviewAccuracy: (agreed / validations.length) * 100 },
    });
}
