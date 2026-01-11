"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  isKaswareInstalled,
  kaswareConnect,
  kaswareDisconnect,
  kaswareGetAccount,
  kaswareGetNetwork,
  getKasware,
  type KaswareNetwork,
  signWithKasware,
} from "@/lib/kasware";
import { getNonce, verifySignature, logout } from "@/lib/api";

type WalletState = {
  installed: boolean;
  address: string | null;
  network: KaswareNetwork | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  mode: "earn" | "practice";
  sessionVersion: number;
};

const Ctx = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [installed, setInstalled] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<KaswareNetwork | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [sessionVersion, setSessionVersion] = useState(0);

  // Detect + hydrate (safe read; does NOT request connect)
  useEffect(() => {
    setInstalled(isKaswareInstalled());

    (async () => {
      const addr = await kaswareGetAccount();
      if (addr) setAddress(addr);
      const net = await kaswareGetNetwork();
      if (net) setNetwork(net);
    })();
  }, []);

  // Listen for wallet events (accountsChanged / networkChanged)
  useEffect(() => {
    const k = getKasware();
    if (!k) return;

    const onAccountsChanged = (accounts: string[]) => {
      setAddress(accounts?.[0] ?? null);
    };

    const onNetworkChanged = (net: string) => {
      setNetwork(net);
    };

    // Kasware docs show .on and removeListener for these events :contentReference[oaicite:1]{index=1}
    k.on("accountsChanged", onAccountsChanged);
    k.on("networkChanged", onNetworkChanged);

    return () => {
      try {
        k.removeListener("accountsChanged", onAccountsChanged);
        k.removeListener("networkChanged", onNetworkChanged);
      } catch {}
    };
  }, []);

  async function connect() {
    if (!installed) return;
    setConnecting(true);
    try {
      const addr = await kaswareConnect();
      setAddress(addr);
      const net = await kaswareGetNetwork();
      setNetwork(net);

      // Dev-friendly auth handshake: get nonce, sign, verify to set session cookie
      if (addr) {
        try {
          const { nonce } = await getNonce();
          const signature = await signWithKasware(nonce);
          await verifySignature(addr, signature, nonce);
          setSessionVersion((v) => v + 1);
        } catch (e) {
          // Non-fatal in dev; user can still play in practice mode
          console.warn("Auth handshake failed", e);
        }
      }
    } finally {
      setConnecting(false);
    }
  }

  async function disconnect() {
    await kaswareDisconnect();
    try {
      await logout();
    } catch {}
    setAddress(null);
    setSessionVersion(0);
  }

  const value = useMemo<WalletState>(() => {
    const mode: WalletState["mode"] = address ? "earn" : "practice";
    return { installed, address, network, connecting, connect, disconnect, mode, sessionVersion };
  }, [installed, address, network, connecting, sessionVersion]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWallet must be used inside <WalletProvider />");
  return v;
}
