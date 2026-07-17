"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { shortAddr } from "@/lib/kasware";

const NAV_LINKS = [
  { href: "/play", label: "Play" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/litepaper", label: "Litepaper" },
  { href: "/dashboard", label: "Dashboard", auth: true },
  { href: "/admin", label: "Admin", admin: true },
];

export function TopBar() {
  const {
    isAuthenticated,
    isAdmin,
    user,
    walletAddress,
    walletNetwork,
    walletConnecting,
    kaswareInstalled,
    connectWallet,
    disconnectWallet,
    signOut,
    mode,
  } = useAuth();

  const router = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
  const [apiStatus, setApiStatus] = useState<"ok" | "degraded" | null>(null);
  const [workerAlive, setWorkerAlive] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchHealth = async () => {
      try {
        const [r1, r2] = await Promise.all([
          fetch(`${API_BASE}/health`),
          fetch(`${API_BASE}/health/worker`),
        ]);
        if (mounted) {
          if (r1.ok) setApiStatus((await r1.json()).status);
          if (r2.ok) setWorkerAlive(Boolean((await r2.json()).alive));
        }
      } catch {
        if (mounted) {
          setApiStatus("degraded");
          setWorkerAlive(false);
        }
      }
    };
    fetchHealth();
    const id = setInterval(fetchHealth, 15_000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [API_BASE]);

  const systemOk = apiStatus === "ok" && workerAlive;

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[rgba(2,5,15,0.85)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3 text-sm font-semibold tracking-tight">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/5 text-xs font-bold uppercase text-[var(--brand-primary)]">
              GP
            </div>
            <div>
              <div className="text-base text-white">Geek Protocol</div>
              <div className="text-[0.7rem] uppercase tracking-[0.25em] text-white/50">
                Alpha Network
              </div>
            </div>
          </Link>
          <span className="badge-pill border-white/10 bg-white/0 text-[var(--brand-primary)]">
            Live
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-wrap items-center gap-1 text-sm text-white/65">
          {NAV_LINKS.filter(
            (l) => (!l.auth || isAuthenticated) && (!l.admin || isAdmin)
          ).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-1.5 transition hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-xs">
            <StatusBadge
              label={systemOk ? "System Stable" : "Attention"}
              tone={systemOk ? "success" : "warning"}
              detail={`API ${apiStatus ?? "?"} · Worker ${workerAlive ? "OK" : "Idle"}`}
            />
            <StatusBadge
              label={mode === "earn" ? "Earn Mode" : "Practice"}
              tone={mode === "earn" ? "info" : "neutral"}
              detail={mode === "earn" ? "Rewards eligible" : "Sign in to earn"}
            />
          </div>

          <AuthControls
            isAuthenticated={isAuthenticated}
            user={user}
            walletAddress={walletAddress}
            walletNetwork={walletNetwork}
            kaswareInstalled={kaswareInstalled}
            walletConnecting={walletConnecting}
            connectWallet={connectWallet}
            disconnectWallet={disconnectWallet}
            onSignOut={handleSignOut}
          />
        </div>
      </div>
    </header>
  );
}

function StatusBadge({
  label,
  detail,
  tone,
}: {
  label: string;
  detail: string;
  tone: "success" | "warning" | "info" | "neutral";
}) {
  const cls = {
    success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    warning: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    info: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
    neutral: "border-white/10 bg-white/5 text-white/60",
  }[tone];

  return (
    <span className={`rounded-xl border px-3 py-1.5 text-left ${cls}`}>
      <span className="block text-[0.7rem] font-semibold uppercase tracking-wide">{label}</span>
      <span className="text-[0.65rem] text-white/60">{detail}</span>
    </span>
  );
}

function AuthControls({
  isAuthenticated,
  user,
  walletAddress,
  walletNetwork,
  kaswareInstalled,
  walletConnecting,
  connectWallet,
  disconnectWallet,
  onSignOut,
}: {
  isAuthenticated: boolean;
  user: ReturnType<typeof useAuth>["user"];
  walletAddress: string | null;
  walletNetwork: string | null;
  kaswareInstalled: boolean;
  walletConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  onSignOut: () => void;
}) {
  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <Link href="/profile">
          <div className="hidden cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/8 sm:block">
            <div className="text-[0.65rem] uppercase tracking-wide text-white/50">
              {user.levelStage ?? `Level ${user.level}`}
              {walletAddress && ` · ${walletNetwork ?? "Kaspa"}`}
            </div>
            <div className="text-sm font-semibold text-white">
              {walletAddress ? shortAddr(walletAddress) : user.username}
            </div>
          </div>
        </Link>
        {walletAddress ? (
          <button
            onClick={() => void disconnectWallet()}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={onSignOut}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Sign Out
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/auth/login"
        className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        Sign In
      </Link>
      <button
        onClick={() => void connectWallet()}
        disabled={!kaswareInstalled || walletConnecting}
        className="rounded-full border border-[var(--brand-primary)]/50 bg-[var(--brand-primary)]/10 px-5 py-2 text-sm font-semibold text-[var(--brand-primary)] transition hover:bg-[var(--brand-primary)]/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/40"
        title={!kaswareInstalled ? "Install KasWare to connect" : "Connect KasWare wallet"}
      >
        {walletConnecting ? "Connecting…" : kaswareInstalled ? "Connect Kasware" : "Install Kasware"}
      </button>
    </div>
  );
}
