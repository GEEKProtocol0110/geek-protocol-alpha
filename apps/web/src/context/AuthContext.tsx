"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getMe,
  login,
  register,
  walletLogin,
  requestLoginNonce,
  authLogout,
  saveToken,
  loadToken,
  clearToken,
  AuthUser,
  AuthError,
} from "@/lib/auth-api";
import {
  isKaswareInstalled,
  kaswareConnect,
  kaswareDisconnect,
  kaswareGetAccount,
  kaswareGetNetwork,
  getKasware,
  type KaswareNetwork,
} from "@/lib/kasware";

// ── Types ────────────────────────────────────────────────────────────────────

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

export type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;

  // Email/password flows
  signIn: (credential: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;

  // Wallet flows
  kaswareInstalled: boolean;
  walletAddress: string | null;
  walletNetwork: KaswareNetwork | null;
  walletConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;

  // Helpers
  isAuthenticated: boolean;
  isAdmin: boolean;
  mode: "earn" | "practice";
  refreshUser: () => Promise<void>;
};

// ── Context ───────────────────────────────────────────────────────────────────

const AuthCtx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Wallet state
  const [kaswareInstalled, setKaswareInstalled] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletNetwork, setWalletNetwork] = useState<KaswareNetwork | null>(null);
  const [walletConnecting, setWalletConnecting] = useState(false);

  // ── Bootstrap: detect wallet + try to restore session ───────────────────

  const refreshUser = useCallback(async () => {
    const stored = loadToken();
    if (stored) setToken(stored);
    try {
      setStatus("loading");
      const u = await getMe();
      setUser(u);
      setStatus("authenticated");
    } catch {
      setUser(null);
      setToken(null);
      clearToken();
      setStatus("unauthenticated");
    }
  }, []);

  // Run once on mount
  const bootstrapped = useRef(false);
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    setKaswareInstalled(isKaswareInstalled());

    // Hydrate wallet address without requesting connect
    (async () => {
      const addr = await kaswareGetAccount();
      if (addr) setWalletAddress(addr);
      const net = await kaswareGetNetwork();
      if (net) setWalletNetwork(net);
    })();

    // Restore session from cookie (server sets httpOnly gp_session)
    refreshUser();
  }, [refreshUser]);

  // ── KasWare wallet events ────────────────────────────────────────────────

  useEffect(() => {
    const k = getKasware();
    if (!k) return;

    const onAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      const addr = accounts?.[0] ?? null;
      setWalletAddress(addr);
      if (!addr) {
        // Wallet disconnected externally
        setUser(null);
        setToken(null);
        setStatus("unauthenticated");
      }
    };

    const onNetworkChanged = (...args: unknown[]) => {
      setWalletNetwork(args[0] as string);
    };

    k.on("accountsChanged", onAccountsChanged);
    k.on("networkChanged", onNetworkChanged);
    return () => {
      try {
        k.removeListener("accountsChanged", onAccountsChanged);
        k.removeListener("networkChanged", onNetworkChanged);
      } catch {}
    };
  }, []);

  // ── Email / password ─────────────────────────────────────────────────────

  const signIn = useCallback(async (credential: string, password: string) => {
    setStatus("loading");
    try {
      const data = await login(credential, password);
      saveToken(data.token);
      setToken(data.token);
      setUser(data);
      setStatus("authenticated");
    } catch (e) {
      setStatus("unauthenticated");
      throw e;
    }
  }, []);

  const signUp = useCallback(
    async (username: string, email: string, password: string) => {
      setStatus("loading");
      try {
        await register(username, email, password);
        const data = await login(email, password);
        saveToken(data.token);
        setToken(data.token);
        setUser(data);
        setStatus("authenticated");
      } catch (e) {
        setStatus("unauthenticated");
        throw e;
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    await authLogout().catch(() => {});
    clearToken();
    setUser(null);
    setToken(null);
    setStatus("unauthenticated");
  }, []);

  // ── Wallet connect / disconnect ──────────────────────────────────────────

  const connectWallet = useCallback(async () => {
    if (!kaswareInstalled) return;
    setWalletConnecting(true);
    try {
      const addr = await kaswareConnect();
      if (!addr) return;
      setWalletAddress(addr);

      const net = await kaswareGetNetwork();
      setWalletNetwork(net);

      // Ask the server for a single-use challenge and sign it verbatim.
      // The client no longer composes its own message — a self-signed message
      // with a client-chosen timestamp was replayable by anyone who captured it.
      const { message } = await requestLoginNonce(addr);

      const k = getKasware();
      let signature = "";

      if (k?.signSchnorr) {
        try {
          signature = await k.signSchnorr(message);
        } catch {}
      }

      if (!signature && k?.signMessage) {
        try {
          signature = await k.signMessage(message);
        } catch {}
      }

      // DEMO_MODE fallback: SHA-256 hex digest
      if (!signature) {
        const enc = new TextEncoder().encode(message);
        const buf = await crypto.subtle.digest("SHA-256", enc);
        signature = Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      }

      const data = await walletLogin(addr, message, signature);
      saveToken(data.token);
      setToken(data.token);
      setUser(data);
      setStatus("authenticated");
    } catch (e) {
      setWalletConnecting(false);
      throw e;
    } finally {
      setWalletConnecting(false);
    }
  }, [kaswareInstalled]);

  const disconnectWallet = useCallback(async () => {
    await kaswareDisconnect().catch(() => {});
    await authLogout().catch(() => {});
    clearToken();
    setWalletAddress(null);
    setUser(null);
    setToken(null);
    setStatus("unauthenticated");
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      token,
      signIn,
      signUp,
      signOut,
      kaswareInstalled,
      walletAddress,
      walletNetwork,
      walletConnecting,
      connectWallet,
      disconnectWallet,
      isAuthenticated: status === "authenticated",
      isAdmin: user?.isAdmin ?? false,
      mode: status === "authenticated" ? "earn" : "practice",
      refreshUser,
    }),
    [
      status,
      user,
      token,
      signIn,
      signUp,
      signOut,
      kaswareInstalled,
      walletAddress,
      walletNetwork,
      walletConnecting,
      connectWallet,
      disconnectWallet,
      refreshUser,
    ]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth must be inside <AuthProvider>");
  return v;
}

// Re-export for consumers that need to distinguish auth errors
export { AuthError };
