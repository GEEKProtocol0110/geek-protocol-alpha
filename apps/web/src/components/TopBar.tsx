"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWallet } from "@/components/WalletProvider";
import { shortAddr } from "@/lib/kasware";

const NAV_LINKS = [
  { href: "/play", label: "Play" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/litepaper", label: "Litepaper" },
  { href: "/dashboard", label: "Dashboard", gated: true },
  { href: "/admin", label: "Admin", gated: true },
];

export function TopBar() {
  const { installed, address, network, connecting, connect, disconnect, mode } = useWallet();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
  const [apiStatus, setApiStatus] = useState<"ok" | "degraded" | null>(null);
  const [workerAlive, setWorkerAlive] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchHealth = async () => {
      try {
        const r1 = await fetch(`${API_BASE}/health`);
        if (r1.ok) {
          const j = await r1.json();
          if (mounted) setApiStatus(j.status);
        }
        const r2 = await fetch(`${API_BASE}/health/worker`);
        if (r2.ok) {
          const j2 = await r2.json();
          if (mounted) setWorkerAlive(Boolean(j2.alive));
        }
      } catch {
        if (mounted) {
          setApiStatus("degraded");
          setWorkerAlive(false);
        }
      }
    };
    fetchHealth();
    const id = setInterval(fetchHealth, 15000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [API_BASE]);

  const systemOk = apiStatus === "ok" && workerAlive;

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[rgba(2,5,15,0.85)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:gap-6">
        <div className="flex items-center gap-3 text-sm font-semibold tracking-tight">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/5 text-xs font-bold uppercase text-[var(--brand-primary)]">
              GP
            </div>
            <div>
              <div className="text-base text-white">Geek Protocol</div>
              <div className="text-[0.7rem] uppercase tracking-[0.25em] text-white/50">Alpha Network</div>
            </div>
          </Link>
          <span className="badge-pill border-white/10 bg-white/0 text-[var(--brand-primary)]">Live</span>
        </div>

        <nav className="flex flex-1 flex-wrap items-center gap-1 text-sm text-white/65">
          {NAV_LINKS.filter((link) => !link.gated || address).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-1.5 transition hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-xs">
            <StatusBadge
              label={systemOk ? "System Stable" : "Attention"}
              tone={systemOk ? "success" : "warning"}
              detail={`API ${apiStatus ?? "?"} • Worker ${workerAlive ? "OK" : "Idle"}`}
            />
            <StatusBadge
              label={mode === "earn" ? "Earn Mode" : "Practice"}
              tone={mode === "earn" ? "info" : "neutral"}
              detail={mode === "earn" ? "Rewards eligible" : "Wallet required"}
            />
          </div>
          <WalletControls
            address={address}
            network={network}
            installed={installed}
            connecting={connecting}
            connect={connect}
            disconnect={disconnect}
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
  const toneClasses: Record<"success" | "warning" | "info" | "neutral", string> = {
    success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    warning: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    info: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
    neutral: "border-white/10 bg-white/5 text-white/60",
  } as const;

  return (
    <span className={`rounded-xl border px-3 py-1.5 text-left ${toneClasses[tone]}`}>
      <span className="block text-[0.7rem] font-semibold uppercase tracking-wide">{label}</span>
      <span className="text-[0.65rem] text-white/60">{detail}</span>
    </span>
  );
}

function WalletControls({
  address,
  network,
  installed,
  connecting,
  connect,
  disconnect,
}: {
  address?: string | null;
  network?: string | null;
  installed: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}) {
  if (address) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <div className="hidden sm:block rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="text-[0.65rem] uppercase tracking-wide text-white/50">{network ?? "Kaspa"}</div>
          <div className="text-sm font-semibold text-white">{shortAddr(address)}</div>
        </div>
        <button
          onClick={() => void disconnect()}
          className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => void connect()}
      disabled={!installed || connecting}
      className="rounded-full border border-[var(--brand-primary)]/50 bg-[var(--brand-primary)]/10 px-5 py-2 text-sm font-semibold text-[var(--brand-primary)] transition hover:bg-[var(--brand-primary)]/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/40"
      title={!installed ? "Install Kasware to connect" : "Connect Kasware"}
    >
      {connecting ? "Connecting…" : installed ? "Connect Kasware" : "Install Kasware"}
    </button>
  );
}
