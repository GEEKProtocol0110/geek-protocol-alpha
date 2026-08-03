/**
 * Kaspa address encoding/decoding.
 *
 * Kaspa uses the CashAddr scheme (the same construction Bitcoin Cash uses), not
 * BIP-173 bech32 — same 32-character alphabet, different checksum polynomial and
 * an 8-symbol checksum. The generic `bech32` npm package will not decode these
 * correctly, which is why this is implemented directly.
 *
 * Layout:  <prefix>:<base32( versionByte || payload || checksum8 )>
 * Version 0x00 → Schnorr public key (32 bytes), which is what wallets use.
 */
const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const CHARSET_MAP = new Map();
for (let i = 0; i < CHARSET.length; i++)
    CHARSET_MAP.set(CHARSET[i], i);
/** CashAddr checksum over GF(2^5), 40-bit polymod. */
function polymod(values) {
    let c = 1n;
    for (const d of values) {
        const c0 = c >> 35n;
        c = ((c & 0x07ffffffffn) << 5n) ^ BigInt(d);
        if (c0 & 0x01n)
            c ^= 0x98f2bc8e61n;
        if (c0 & 0x02n)
            c ^= 0x79b76d99e2n;
        if (c0 & 0x04n)
            c ^= 0xf33e5fb3c4n;
        if (c0 & 0x08n)
            c ^= 0xae2eabe2a8n;
        if (c0 & 0x10n)
            c ^= 0x1e4f43e470n;
    }
    return c ^ 1n;
}
function prefixToWords(prefix) {
    // Low 5 bits of each prefix character, then a zero separator.
    const words = [...prefix].map((ch) => ch.charCodeAt(0) & 0x1f);
    words.push(0);
    return words;
}
/** Regroup bit-widths (5→8 when decoding, 8→5 when encoding). */
function convertBits(data, from, to, pad) {
    let acc = 0;
    let bits = 0;
    const out = [];
    const maxv = (1 << to) - 1;
    for (const value of data) {
        if (value < 0 || value >> from !== 0)
            return null;
        acc = (acc << from) | value;
        bits += from;
        while (bits >= to) {
            bits -= to;
            out.push((acc >> bits) & maxv);
        }
    }
    if (pad) {
        if (bits > 0)
            out.push((acc << (to - bits)) & maxv);
    }
    else if (bits >= from || ((acc << (to - bits)) & maxv) !== 0) {
        return null;
    }
    return out;
}
const VERSION_BY_BYTE = {
    0x00: "schnorr",
    0x01: "ecdsa",
    0x08: "p2sh",
};
const EXPECTED_LENGTH = {
    schnorr: 32,
    ecdsa: 33,
    p2sh: 32,
};
/**
 * Decode a Kaspa address. Returns null for anything malformed rather than
 * throwing, so callers can treat it as a plain validation failure.
 */
export function decodeKaspaAddress(address) {
    if (typeof address !== "string" || address.length < 10)
        return null;
    const sep = address.lastIndexOf(":");
    if (sep < 1)
        return null;
    const prefix = address.slice(0, sep).toLowerCase();
    const body = address.slice(sep + 1).toLowerCase();
    if (!body.length)
        return null;
    const words = [];
    for (const ch of body) {
        const v = CHARSET_MAP.get(ch);
        if (v === undefined)
            return null;
        words.push(v);
    }
    // Checksum covers the prefix, a separator, and the data+checksum words.
    if (polymod([...prefixToWords(prefix), ...words]) !== 0n)
        return null;
    const dataWords = words.slice(0, -8);
    const bytes = convertBits(dataWords, 5, 8, false);
    if (!bytes || bytes.length < 2)
        return null;
    // Version byte and key are regrouped together, matching @kaspa/core-lib.
    const version = VERSION_BY_BYTE[bytes[0]];
    if (!version)
        return null;
    const payload = Uint8Array.from(bytes.slice(1));
    if (payload.length !== EXPECTED_LENGTH[version])
        return null;
    return { prefix, version, payload };
}
/** True when the address parses and belongs to the expected network prefix. */
export function isValidKaspaAddress(address, expectedPrefix) {
    const decoded = decodeKaspaAddress(address);
    if (!decoded)
        return false;
    if (expectedPrefix && decoded.prefix !== expectedPrefix.toLowerCase())
        return false;
    return true;
}
/** Prefix for the configured network. */
export function networkPrefix(network = process.env.KASPA_NETWORK || "mainnet") {
    const n = network.toLowerCase();
    if (n.startsWith("test"))
        return "kaspatest";
    if (n.startsWith("dev"))
        return "kaspadev";
    if (n.startsWith("sim"))
        return "kaspasim";
    return "kaspa";
}
export function encodeKaspaAddress(payload, version = "schnorr", prefix = networkPrefix()) {
    const versionByte = version === "schnorr" ? 0x00 : version === "ecdsa" ? 0x01 : 0x08;
    const dataWords = convertBits([versionByte, ...payload], 8, 5, true);
    if (!dataWords)
        throw new Error("Failed to encode Kaspa address payload");
    // Checksum is computed with eight zero placeholder words appended.
    const checksumInput = [...prefixToWords(prefix), ...dataWords, 0, 0, 0, 0, 0, 0, 0, 0];
    const mod = polymod(checksumInput);
    const checksumWords = [];
    for (let i = 0; i < 8; i++) {
        checksumWords.push(Number((mod >> BigInt(5 * (7 - i))) & 0x1fn));
    }
    const body = [...dataWords, ...checksumWords].map((w) => CHARSET[w]).join("");
    return `${prefix}:${body}`;
}
