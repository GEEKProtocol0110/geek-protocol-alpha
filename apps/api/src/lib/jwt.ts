const DEFAULT_JWT_SECRET = "dev-secret-key-change-in-production";

export const SESSION_COOKIE_NAME = "session";

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  return new TextEncoder().encode(secret);
}
