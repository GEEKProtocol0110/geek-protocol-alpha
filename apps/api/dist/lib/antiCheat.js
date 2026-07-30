/**
 * Server-side validation of how an attempt was played.
 *
 * The scoring path used to take `timeTakenPerQuestion` straight from the client
 * and pay a speed bonus of (15 - t) * 10 per question. Nothing checked it, so
 * the cheapest possible cheat was to answer at leisure and post `0` for every
 * timing — maximum bonus, no OCR, no automation, just an edited request body.
 *
 * The rules here are all derived from the server's own clock (the attempt token
 * carries a signed issue time), so a client cannot claim more speed than actually
 * elapsed between the question being served and the answers arriving.
 */
export const MAX_SECONDS_PER_QUESTION = 15;
/** Faster than this per question, sustained, is not a human reading a question. */
export const MIN_HUMAN_SECONDS_PER_QUESTION = 0.75;
/** Slack for network latency, render time and clock skew. */
export const TIMING_TOLERANCE_SECONDS = 3;
export function validateAttemptTiming(input) {
    const { issuedAtMs, submittedAtMs, questionCount, clientTimings, maxSecondsPerQuestion = MAX_SECONDS_PER_QUESTION, } = input;
    const flags = [];
    const elapsedSeconds = Math.max(0, (submittedAtMs - issuedAtMs) / 1000);
    // Clamp first — a negative or absurd timing is never legitimate.
    const effectiveTimings = Array.from({ length: questionCount }, (_, i) => {
        const raw = Number(clientTimings[i]);
        if (!Number.isFinite(raw) || raw < 0) {
            flags.push(`q${i}:invalid_timing`);
            return maxSecondsPerQuestion;
        }
        return Math.min(maxSecondsPerQuestion, raw);
    });
    const claimedSeconds = effectiveTimings.reduce((a, b) => a + b, 0);
    // Hard floor: the whole attempt arrived faster than a human could read it.
    const humanFloor = questionCount * MIN_HUMAN_SECONDS_PER_QUESTION;
    if (elapsedSeconds < humanFloor) {
        return {
            ok: false,
            reason: `Attempt submitted in ${elapsedSeconds.toFixed(2)}s, below the ${humanFloor.toFixed(2)}s minimum for ${questionCount} questions.`,
            effectiveTimings,
            speedCreditFactor: 0,
            elapsedSeconds,
            claimedSeconds,
            flags: [...flags, "superhuman_submit"],
        };
    }
    // Hard ceiling: the token is long expired relative to the play window.
    const window = questionCount * maxSecondsPerQuestion + TIMING_TOLERANCE_SECONDS;
    if (elapsedSeconds > window * 3) {
        flags.push("stale_attempt");
    }
    // Claiming more time than actually elapsed is inconsistent, not an exploit —
    // it only lowers the player's own bonus. Flag it and carry on.
    if (claimedSeconds > elapsedSeconds + TIMING_TOLERANCE_SECONDS) {
        flags.push("claimed_exceeds_elapsed");
    }
    // The exploit direction: under-reporting per-question time to inflate the
    // speed bonus. "Speed credit" is the unused portion of the 15s budget. The
    // total credit a player may claim is bounded by what the clock actually shows,
    // so answering 10 questions over 2 real minutes cannot yield a 10x speed bonus.
    const claimedCredit = effectiveTimings.reduce((sum, t) => sum + Math.max(0, maxSecondsPerQuestion - t), 0);
    const allowedCredit = Math.max(0, questionCount * maxSecondsPerQuestion -
        Math.max(0, elapsedSeconds - TIMING_TOLERANCE_SECONDS));
    let speedCreditFactor = 1;
    if (claimedCredit > allowedCredit) {
        speedCreditFactor = allowedCredit / claimedCredit;
        flags.push("speed_credit_clamped");
    }
    // Machine-like uniformity: identical timings to the millisecond across every
    // question is a generated payload, not a person.
    if (questionCount >= 4) {
        const unique = new Set(effectiveTimings.map((t) => t.toFixed(3)));
        if (unique.size === 1)
            flags.push("uniform_timings");
    }
    return {
        ok: true,
        effectiveTimings,
        speedCreditFactor,
        elapsedSeconds,
        claimedSeconds,
        flags,
    };
}
/** Speed bonus for one question, already bounded by the wall clock. */
export function timeBonusFor(effectiveSeconds, speedCreditFactor, pointsPerSecond = 10) {
    const credit = Math.max(0, MAX_SECONDS_PER_QUESTION - effectiveSeconds);
    return Math.round(credit * pointsPerSecond * speedCreditFactor);
}
