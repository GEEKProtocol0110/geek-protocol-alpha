"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWallet } from "@/components/WalletProvider";
import { shortAddr } from "@/lib/kasware";

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
      } catch {}
    };
    fetchHealth();
    const id = setInterval(fetchHealth, 15000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [API_BASE]);

  return (
    <div className="sticky top-0 z-50 border-b border-cyan-400/20 bg-black/70 backdrop-blur-md glass">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="text-cyan-400">Geek</span>
          <span className="text-white">Protocol</span>
          <span className="text-xs text-cyan-400/60 ml-1">Alpha</span>
        </Link>

        <div className="flex items-center gap-4">
          {address && (
            <Link
              href="/dashboard"
              className="text-sm text-white/70 hover:text-white transition-colors"
              title="Game Dashboard"
            >
              Dashboard
            </Link>
          )}

          <Link
            href="/leaderboard"
            className="text-sm text-white/70 hover:text-white transition-colors"
            title="View leaderboard"
          >
            Leaderboard
          </Link>

          <Link
            href="/admin"
            className="text-sm text-white/70 hover:text-white transition-colors"
            title="Admin panel"
          >
            Admin
          </Link>

          <span
            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
              apiStatus === "ok" && workerAlive
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                : "border-yellow-500/50 bg-yellow-500/10 text-yellow-300"
            }`}
            title={`API: ${apiStatus ?? "unknown"} • Worker: ${workerAlive ? "alive" : "idle"}`}
          >
            {apiStatus === "ok" && workerAlive ? "System OK" : "System Degraded"}
          </span>

          <span
            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
              mode === "earn"
                ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300"
                : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
            }`}
            title={mode === "earn" ? "Wallet connected — eligible to earn" : "Practice mode — connect wallet to earn"}
          >
            {mode === "earn" ? "🟢 Earn Mode" : "Practice"}
          </span>

          {address ? (
            <>
              <div className="hidden sm:block text-xs text-white/70 bg-white/5 rounded-lg px-3 py-1.5">
                {network ? `${network} • ` : ""}
                <span className="text-cyan-300 font-medium">{shortAddr(address)}</span>
              </div>
              <button
                onClick={() => void disconnect()}
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-1.5 text-sm font-medium hover:border-white/40 hover:bg-white/10 transition-all"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={() => void connect()}
              disabled={!installed || connecting}
              className="rounded-lg border border-cyan-400/50 bg-cyan-400/10 px-4 py-1.5 text-sm font-medium text-cyan-300 hover:border-cyan-400/80 hover:bg-cyan-400/20 transition-all disabled:opacity-50 disabled:border-white/10 disabled:bg-white/5 disabled:text-white/70"
              title={!installed ? "Install Kasware to connect" : "Connect Kasware"}
            >
              {connecting ? "Connecting…" : installed ? "Connect Kasware" : "Install Kasware"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
