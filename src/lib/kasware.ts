// src/lib/kasware.ts

export type KaswareNetwork = "livenet" | "testnet" | "devnet" | string;

export type KaswareProvider = {
  requestAccounts: () => Promise<string[]>;
  getAccounts: () => Promise<string>; // current account address
  getNetwork: () => Promise<KaswareNetwork>;
  disconnect: (origin: string) => void | Promise<void>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
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
