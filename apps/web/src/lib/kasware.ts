// src/lib/kasware.ts

export type KaswareNetwork = "livenet" | "testnet" | "devnet" | string;

export type KaswareProvider = {
  requestAccounts: () => Promise<string[]>;
  getAccounts: () => Promise<string>; // current account address
  getNetwork: () => Promise<KaswareNetwork>;
  disconnect: (origin: string) => void | Promise<void>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
  // Optional signing methods (check availability before use)
  signMessage?: (message: string) => Promise<string>;
  signSchnorr?: (message: string) => Promise<string>;
};

declare global {
  interface Window {
    kasware?: KaswareProvider;
  }
}

export function getKasware(): KaswareProvider | null {
  if (typeof window === "undefined") return null;
  return window.kasware ?? null;
}

export function isKaswareInstalled(): boolean {
  return !!getKasware();
}

export async function kaswareConnect(): Promise<string | null> {
  const k = getKasware();
  if (!k) return null;
  const accounts = await k.requestAccounts();
  return accounts?.[0] ?? null;
}

export async function kaswareGetAccount(): Promise<string | null> {
  const k = getKasware();
  if (!k) return null;
  try {
    const addr = await k.getAccounts();
    return addr || null;
  } catch {
    return null;
  }
}

export async function kaswareGetNetwork(): Promise<KaswareNetwork | null> {
  const k = getKasware();
  if (!k) return null;
  try {
    return await k.getNetwork();
  } catch {
    return null;
  }
}

export async function kaswareDisconnect(): Promise<void> {
  const k = getKasware();
  if (!k) return;
  await k.disconnect(window.location.origin);
}

export function shortAddr(addr: string, head = 10, tail = 6) {
  if (!addr) return "";
  if (addr.length <= head + tail + 3) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

// Dev helper: create a deterministic hex "signature" from a message
export async function devSignNonceHex(message: string): Promise<string> {
  const enc = new TextEncoder().encode(message);
  // Use Web Crypto SHA-256 to produce a hex digest
  const digest = await crypto.subtle.digest("SHA-256", enc);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Sign a message using KasWare wallet.
 * Tries real signature methods (signMessage, signSchnorr) if available.
 * Falls back to dev mode signing if not.
 * @param message - The message to sign (typically a nonce)
 * @returns Hex signature string
 */
export async function signWithKasware(message: string): Promise<string> {
  const k = getKasware();
  if (!k) {
    throw new Error("KasWare not installed");
  }

  // Production: Try real signing methods
  if (typeof k.signSchnorr === "function") {
    try {
      return await k.signSchnorr(message);
    } catch (err) {
      console.warn("KasWare signSchnorr failed, falling back to dev", err);
    }
  }

  if (typeof k.signMessage === "function") {
    try {
      return await k.signMessage(message);
    } catch (err) {
      console.warn("KasWare signMessage failed, falling back to dev", err);
    }
  }

  // Dev fallback: deterministic signing
  console.warn("Using dev signing mode (KasWare signature methods not available)");
  return devSignNonceHex(message);
}
