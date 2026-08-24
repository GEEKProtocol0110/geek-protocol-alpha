"use client";

import Image from "next/image";
import { FaTwitter, FaTelegram, FaGithub } from "react-icons/fa";

export function Footer() {
  return (
    <footer className="relative border-t-2 border-[var(--border-soft)] bg-[var(--surface-1)] py-12 px-4 md:px-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid md:grid-cols-4 gap-8 pb-8 border-b border-[var(--border-soft)] mb-6">
          {/* Brand */}
          <div>
            <div className="flex items-center mb-3">
              <Image
                src="/logo.png"
                alt="Geek Protocol"
                width={1536}
                height={1024}
                className="h-[8rem] w-auto"
              />
            </div>
            <p className="text-[var(--text-1)] text-sm mb-4 font-semibold">All hope, no hype.</p>
            <p className="text-[var(--text-3)] text-sm">
              A Kaspa-native play layer converting knowledge into programmable, measurable rewards.
              Built for founders, creators, and the ecosystems they galvanize.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="https://x.com/geekonkas" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-[var(--border-soft)] flex items-center justify-center text-[var(--text-3)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition">
                <FaTwitter />
              </a>
              <a href="https://t.me/GEEKonKAScommunity" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-[var(--border-soft)] flex items-center justify-center text-[var(--text-3)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition">
                <FaTelegram />
              </a>
              <a href="https://github.com/GEEKProtocol0110/geek-protocol-alpha" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-[var(--border-soft)] flex items-center justify-center text-[var(--text-3)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition">
                <FaGithub />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-bold text-sm text-[var(--brand-primary)] tracking-wide mb-4">Product</h4>
            <div className="flex flex-col gap-3">
              <a href="/play"        className="text-[var(--text-3)] hover:text-[var(--brand-primary)] transition text-sm">Geek Gauntlet</a>
              <a href="/leaderboard" className="text-[var(--text-3)] hover:text-[var(--brand-primary)] transition text-sm">Leaderboard</a>
              <a href="/dashboard"   className="text-[var(--text-3)] hover:text-[var(--brand-primary)] transition text-sm">Dashboard</a>
            </div>
          </div>

          {/* Protocol */}
          <div>
            <h4 className="font-bold text-sm text-[var(--brand-primary)] tracking-wide mb-4">Protocol</h4>
            <div className="flex flex-col gap-3">
              <a href="/token"     className="text-[var(--text-3)] hover:text-[var(--brand-primary)] transition text-sm">$GEEK Token</a>
              <a href="/litepaper" className="text-[var(--text-3)] hover:text-[var(--brand-primary)] transition text-sm">Litepaper</a>
              <a href="https://github.com/GEEKProtocol0110/geek-protocol-alpha/blob/main/docs/ARCHITECTURE.md" target="_blank" rel="noopener noreferrer" className="text-[var(--text-3)] hover:text-[var(--brand-primary)] transition text-sm">Architecture</a>
            </div>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-bold text-sm text-[var(--brand-primary)] tracking-wide mb-4">Community</h4>
            <div className="flex flex-col gap-3">
              <a href="https://x.com/geekonkas" target="_blank" rel="noopener noreferrer" className="text-[var(--text-3)] hover:text-[var(--brand-primary)] transition text-sm">X (Twitter)</a>
              <a href="https://t.me/GEEKonKAScommunity" target="_blank" rel="noopener noreferrer" className="text-[var(--text-3)] hover:text-[var(--brand-primary)] transition text-sm">Telegram</a>
              <a href="https://kaspa.org" target="_blank" rel="noopener noreferrer" className="text-[var(--text-3)] hover:text-[var(--brand-primary)] transition text-sm">Kaspa</a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-[var(--text-3)] text-sm">© 2026 Geek Protocol. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="/legal/terms" className="text-[var(--text-3)] hover:text-[var(--brand-primary)] text-sm transition">Terms</a>
            <a href="/legal/privacy" className="text-[var(--text-3)] hover:text-[var(--brand-primary)] text-sm transition">Privacy</a>
            <a href="/legal/risk" className="text-[var(--text-3)] hover:text-[var(--brand-primary)] text-sm transition">Alpha Risks</a>
            <a href="/support/report" className="text-[var(--text-3)] hover:text-[var(--brand-primary)] text-sm transition">Report a problem</a>
          </div>
          <span className="text-[var(--brand-secondary)] text-xs font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[var(--brand-secondary)] rounded-full animate-pulse" />
            Mainnet KRC-20 payouts in development
          </span>
        </div>
      </div>
    </footer>
  );
}
