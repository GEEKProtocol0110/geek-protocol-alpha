import crypto from "crypto";

const HMAC_SECRET = process.env.HMAC_SECRET || "dev-hmac-secret-change";

export function makeAttemptToken(payload: Record<string, any>, ttlSeconds: number): string {
  const data = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const json = JSON.stringify(data);
  const sig = crypto.createHmac("sha256", HMAC_SECRET).update(json).digest("hex");
  return Buffer.from(json).toString("base64") + "." + sig;
}

export function verifyAttemptToken(token: string): { ok: boolean; data?: any; error?: string } {
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
  if (sig !== expectedSig) return { ok: false, error: "Invalid signature" };
  let data: any;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof data.exp !== "number" || data.exp < nowSec) {
    return { ok: false, error: "Token expired" };
  }
  return { ok: true, data };
}
