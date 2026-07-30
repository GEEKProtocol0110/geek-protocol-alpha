import crypto from "crypto";

const HMAC_SECRET = process.env.HMAC_SECRET || "dev-hmac-secret-change";
const WALLET_ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || "dev-wallet-encryption-key-change-32chars!!"; // Must be 32 bytes for AES-256

// Encrypt a private key using AES-256-CBC
export function encryptPrivateKey(privateKey: string): string {
  const iv = crypto.randomBytes(16); // 16 bytes for AES
  const key = Buffer.from(WALLET_ENCRYPTION_KEY, "utf8").slice(0, 32); // Ensure 32 bytes
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(privateKey, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

// Decrypt an encrypted private key
export function decryptPrivateKey(encrypted: string): string {
  const [ivHex, encryptedHex] = encrypted.split(":");
  if (!ivHex || !encryptedHex) {
    throw new Error("Invalid encrypted private key format");
  }
  const iv = Buffer.from(ivHex, "hex");
  const key = Buffer.from(WALLET_ENCRYPTION_KEY, "utf8").slice(0, 32);
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export type AttemptTokenPayload = {
  attemptId: string;
  [key: string]: string | number | boolean | undefined;
};

/** `iat` is the server's issue time in ms — the trusted clock the anti-cheat
 * timing checks measure against. It is inside the HMAC, so a client cannot
 * backdate an attempt to manufacture a speed bonus. */
type AttemptTokenData = AttemptTokenPayload & { exp: number; iat: number };

export function makeAttemptToken(payload: AttemptTokenPayload, ttlSeconds: number): string {
  const data: AttemptTokenData = {
    ...payload,
    iat: Date.now(),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  } as AttemptTokenData;
  const json = JSON.stringify(data);
  const sig = crypto.createHmac("sha256", HMAC_SECRET).update(json).digest("hex");
  return Buffer.from(json).toString("base64") + "." + sig;
}

export type AttemptTokenVerification =
  | { ok: true; data: AttemptTokenData }
  | { ok: false; error: string };

export function verifyAttemptToken(token: string): AttemptTokenVerification {
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, error: "Malformed token" };
  const jsonB64 = parts[0];
  const sig = parts[1];
  let json: string;
  try {
    json = Buffer.from(jsonB64, "base64").toString("utf8");
  } catch {
    return { ok: false, error: "Invalid base64" };
  }
  const expectedSig = crypto.createHmac("sha256", HMAC_SECRET).update(json).digest("hex");
  // Constant-time compare so signature verification can't be probed byte by byte.
  const sigBuf = Buffer.from(sig, "utf8");
  const expectedBuf = Buffer.from(expectedSig, "utf8");
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return { ok: false, error: "Invalid signature" };
  }
  let data: AttemptTokenData;
  try {
    data = JSON.parse(json) as AttemptTokenData;
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof data.exp !== "number" || data.exp < nowSec) {
    return { ok: false, error: "Token expired" };
  }
  return { ok: true, data };
}
