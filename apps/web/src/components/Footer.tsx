"use client";

import { FaTwitter, FaTelegram, FaGithub } from "react-icons/fa";

export function Footer() {
  return (
    <footer className="border-t border-[#2a1a3a] py-12 px-4 md:px-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid md:grid-cols-4 gap-8 pb-8 border-b border-[#2a1a3a] mb-6">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-bebas tracking-widest font-bold text-xl text-pink-600">GP</span>
              <span className="font-sans font-bold text-sm tracking-widest text-white/70">GEEK PROTOCOL</span>
            </div>
            <p className="text-white/60 text-sm mb-4">All hope, no hype.</p>
            <p className="text-white/40 text-sm">
              A Kaspa-native play layer converting knowledge into programmable, measurable rewards.
              Built for founders, creators, and the ecosystems they galvanize.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="https://x.com/geekonkas" target="_blank" rel="noopener noreferrer" className="w-8 h-8 border border-[#2a1a3a] flex items-center justify-center text-white/40 hover:border-cyan-400 hover:text-cyan-400 transition">
                <FaTwitter />
              </a>
              <a href="https://t.me/GEEKonKAScommunity" target="_blank" rel="noopener noreferrer" className="w-8 h-8 border border-[#2a1a3a] flex items-center justify-center text-white/40 hover:border-cyan-400 hover:text-cyan-400 transition">
                <FaTelegram />
              </a>
              <a href="https://github.com/GEEKProtocol0110/geek-protocol-alpha" target="_blank" rel="noopener noreferrer" className="w-8 h-8 border border-[#2a1a3a] flex items-center justify-center text-white/40 hover:border-cyan-400 hover:text-cyan-400 transition">
                <FaGithub />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-bold text-sm text-cyan-400 tracking-wider mb-4">Product</h4>
            <div className="flex flex-col gap-3">
              <a href="/play"        className="text-white/40 hover:text-purple-400 transition text-sm">Geek Gauntlet</a>
              <a href="/leaderboard" className="text-white/40 hover:text-purple-400 transition text-sm">Leaderboard</a>
              <a href="/dashboard"   className="text-white/40 hover:text-purple-400 transition text-sm">Dashboard</a>
            </div>
          </div>

          {/* Protocol */}
          <div>
            <h4 className="font-bold text-sm text-cyan-400 tracking-wider mb-4">Protocol</h4>
            <div className="flex flex-col gap-3">
              <a href="#"          className="text-white/40 hover:text-purple-400 transition text-sm">$GEEK Token</a>
              <a href="/litepaper" className="text-white/40 hover:text-purple-400 transition text-sm">Litepaper</a>
              <a href="https://github.com/GEEKProtocol0110/geek-protocol-alpha/blob/main/docs/ARCHITECTURE.md" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-purple-400 transition text-sm">Architecture</a>
            </div>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-bold text-sm text-cyan-400 tracking-wider mb-4">Community</h4>
            <div className="flex flex-col gap-3">
              <a href="https://x.com/geekonkas" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-purple-400 transition text-sm">X (Twitter)</a>
              <a href="https://t.me/GEEKonKAScommunity" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-purple-400 transition text-sm">Telegram</a>
              <a href="https://kaspa.org" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-purple-400 transition text-sm">Kaspa</a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-white/30 text-sm font-mono">© 2026 Geek Protocol. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="text-white/30 hover:text-white/60 text-sm font-mono transition">Terms</a>
            <a href="#" className="text-white/30 hover:text-white/60 text-sm font-mono transition">Privacy</a>
          </div>
          <span className="text-emerald-400/60 text-xs font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Kaspa mainnet ready
          </span>
        </div>
      </div>
    </footer>
  );
}
