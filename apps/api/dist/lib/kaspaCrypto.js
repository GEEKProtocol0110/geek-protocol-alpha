import crypto from "crypto";
import { schnorr } from "@noble/curves/secp256k1.js";
import { decodeKaspaAddress, encodeKaspaAddress, networkPrefix } from "./kaspaAddress";
/**
 * Kaspa keypair generation and message-signature verification.
 *
 * This replaces the previous implementation, which dynamically imported
 * `@kaspa/core` — a package that is not installed. The import failed silently,
 * so `verifyKaspaSignature` returned false for every request and wallet login
 * could never succeed outside DEMO_MODE, while `generateKaspaWallet` threw and
 * broke email registration with a 500.
 *
 * Everything here is pure JS (@noble/curves, audited BIP-340 Schnorr) plus the
 * address codec in kaspaAddress.ts, so there is no native dependency to miss.
 */
const DEMO_MODE = process.env.DEMO_MODE === "true";
/** Kaspa addresses hold an x-only (32-byte) BIP-340 key. */
export function publicKeyFromAddress(address) {
    const decoded = decodeKaspaAddress(address);
    if (!decoded || decoded.version !== "schnorr")
        return null;
    return decoded.payload;
}
export function addressFromPrivateKey(privateKeyHex, prefix = networkPrefix()) {
    const sk = Buffer.from(privateKeyHex, "hex");
    if (sk.length !== 32)
        throw new Error("Private key must be 32 bytes of hex");
    const xOnly = schnorr.getPublicKey(sk);
    return encodeKaspaAddress(xOnly, "schnorr", prefix);
}
/** Generate a fresh custodial keypair for the configured network. */
export function generateKeypair(prefix = networkPrefix()) {
    // Rejection-sample into the valid scalar range rather than reducing, which
    // would bias the key.
    let sk;
    do {
        sk = crypto.randomBytes(32);
    } while (!isValidScalar(sk));
    const xOnly = schnorr.getPublicKey(sk);
    return {
        address: encodeKaspaAddress(xOnly, "schnorr", prefix),
        privateKey: sk.toString("hex"),
        publicKey: Buffer.from(xOnly).toString("hex"),
    };
}
const CURVE_ORDER = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
function isValidScalar(buf) {
    const n = BigInt("0x" + buf.toString("hex"));
    return n > 0n && n < CURVE_ORDER;
}
/** Accepts hex or base64; returns the 64-byte BIP-340 signature or null. */
function decodeSignature(signature) {
    const trimmed = signature.trim();
    if (/^[0-9a-fA-F]{128}$/.test(trimmed)) {
        return Uint8Array.from(Buffer.from(trimmed, "hex"));
    }
    try {
        const buf = Buffer.from(trimmed, "base64");
        if (buf.length === 64)
            return Uint8Array.from(buf);
        // Some wallets prefix a recovery byte.
        if (buf.length === 65)
            return Uint8Array.from(buf.subarray(1));
    }
    catch {
        return null;
    }
    return null;
}
function sha256(data) {
    return Uint8Array.from(crypto.createHash("sha256").update(typeof data === "string" ? Buffer.from(data, "utf8") : data).digest());
}
/**
 * Candidate message digests.
 *
 * Wallets differ in what they hash before signing: some sign SHA-256 of the raw
 * UTF-8 message, others apply a Bitcoin-style "personal message" prefix, and
 * some double-hash. Rather than guess one and have wallet login silently fail in
 * production, all three are checked. This does not weaken the check: each
 * candidate is still a full BIP-340 verification against the public key derived
 * from the claimed address, and the nonce is already burned before we get here.
 */
function messageDigests(message) {
    const raw = Buffer.from(message, "utf8");
    const personalPrefix = Buffer.from("Kaspa Signed Message:\n", "utf8");
    const lengthPrefixed = Buffer.concat([
        Buffer.from([personalPrefix.length]),
        personalPrefix,
        encodeVarIntLength(raw.length),
        raw,
    ]);
    return [
        sha256(raw), // plain SHA-256 of the message
        sha256(sha256(raw)), // double SHA-256
        sha256(sha256(lengthPrefixed)), // Bitcoin-style personal message
    ];
}
function encodeVarIntLength(n) {
    if (n < 0xfd)
        return Buffer.from([n]);
    if (n <= 0xffff) {
        const b = Buffer.alloc(3);
        b[0] = 0xfd;
        b.writeUInt16LE(n, 1);
        return b;
    }
    const b = Buffer.alloc(5);
    b[0] = 0xfe;
    b.writeUInt32LE(n, 1);
    return b;
}
/**
 * Verify that `signature` over `message` was produced by the key behind
 * `walletAddress`. Returns false for anything it cannot positively verify.
 */
export async function verifyKaspaSignature(walletAddress, message, signature) {
    // DEMO_MODE short-circuits verification for local development. config.ts
    // refuses to boot with DEMO_MODE enabled in production, because this branch
    // would let anyone authenticate as any wallet.
    if (DEMO_MODE)
        return true;
    const publicKey = publicKeyFromAddress(walletAddress);
    if (!publicKey)
        return false;
    const sig = decodeSignature(signature);
    if (!sig)
        return false;
    for (const digest of messageDigests(message)) {
        try {
            if (schnorr.verify(sig, digest, publicKey))
                return true;
        }
        catch {
            // Malformed signature/point — try the next digest scheme.
        }
    }
    return false;
}
