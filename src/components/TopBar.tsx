"use client";

import Link from "next/link";
import { useWallet } from "@/components/WalletProvider";
import { shortAddr } from "@/lib/kasware";

export function TopBar() {
  const { installed, address, network, connecting, connect, disconnect, mode } = useWallet();

  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold tracking-wide">
          Geek Protocol <span className="text-white/60">Alpha</span>
        </Link>

        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium border ${
              mode === "earn"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                : "border-white/10 bg-white/5 text-white/70"
            }`}
            title={mode === "earn" ? "Wallet connected — eligible to earn later" : "Practice mode — connect wallet to earn"}
          >
            {mode === "earn" ? "Earn Mode" : "Practice Mode"}
          </span>

          {address ? (
            <>
              <div className="hidden sm:block text-xs text-white/70">
                {network ? `${network} • ` : ""}
                {shortAddr(address)}
              </div>
              <button
                onClick={() => void disconnect()}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={() => void connect()}
              disabled={!installed || connecting}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
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
