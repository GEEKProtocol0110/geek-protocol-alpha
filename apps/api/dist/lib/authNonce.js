import crypto from "crypto";
/**
 * Single-use challenge nonces for wallet login.
 *
 * The previous flow had no nonce at all: the client composed its own message
 * containing a client-chosen timestamp, and the server accepted any valid
 * signature over it within a 5 minute window, with no record of what had already
 * been used. A captured signature was replayable by anyone for five minutes.
 *
 * Now the server issues the challenge, and consuming it is atomic — GETDEL means
 * the winner of a race is the only caller that sees the value, so a replayed
 * signature finds nothing and is rejected. Unused nonces expire on their own.
 */
export const NONCE_TTL_MS = 30000;
const nonceKey = (walletAddress, nonce) => `authnonce:${walletAddress}:${nonce}`;
/** The exact string the wallet must sign. Server-authored, so it can be trusted. */
export function buildLoginMessage(walletAddress, nonce, issuedAt) {
    return `Geek Protocol Login\n${walletAddress}\n${nonce}\n${issuedAt}`;
}
export function parseLoginMessage(message) {
    const match = message.match(/^Geek Protocol Login\n(.+)\n([a-f0-9]{64})\n(\d+)$/);
    if (!match)
        return null;
    return { walletAddress: match[1], nonce: match[2], issuedAt: parseInt(match[3], 10) };
}
export async function issueNonce(redis, walletAddress) {
    const nonce = crypto.randomBytes(32).toString("hex");
    const issuedAt = Date.now();
    await redis.set(nonceKey(walletAddress, nonce), String(issuedAt), "PX", NONCE_TTL_MS);
    return {
        nonce,
        message: buildLoginMessage(walletAddress, nonce, issuedAt),
        issuedAt,
        expiresAt: issuedAt + NONCE_TTL_MS,
        expiresInMs: NONCE_TTL_MS,
    };
}
/**
 * Atomically burn the nonce. Returns ok exactly once per issued nonce, ever —
 * a second call for the same nonce (a replay) always fails.
 */
export async function consumeNonce(redis, walletAddress, nonce) {
    const key = nonceKey(walletAddress, nonce);
    // GETDEL (Redis 6.2+) is a single atomic op: no window where two concurrent
    // replays could both read the value before either deletes it.
    let raw;
    try {
        raw = await redis.getdel(key);
    }
    catch {
        // Fallback for older Redis: DEL returns 1 only for the caller that removed it.
        const existed = await redis.del(key);
        raw = existed === 1 ? "0" : null;
    }
    if (raw === null)
        return { ok: false, reason: "unknown_or_used" };
    const issuedAt = parseInt(raw, 10);
    // Defence in depth: the TTL should already have removed anything this old.
    if (Number.isFinite(issuedAt) && issuedAt > 0 && Date.now() - issuedAt > NONCE_TTL_MS) {
        return { ok: false, reason: "expired" };
    }
    return { ok: true, issuedAt };
}
