"use client";

import Link from "next/link";
import { useStickers } from "@/context/StickersContext";
import { STICKERS } from "@/lib/stickers";

const SECTIONS = [
  { href: "/stickers/collection", emoji: "📖", label: "Collection",  desc: "View all stickers & series progress" },
  { href: "/stickers/shop",       emoji: "🛒", label: "Shop",        desc: "Buy individual stickers with GEEK" },
  { href: "/stickers/packs",      emoji: "📦", label: "Open Packs",  desc: "Open packs earned from gameplay" },
  { href: "/stickers/craft",      emoji: "⚗️", label: "Craft",       desc: "Spend Geek Dust to craft missing stickers" },
  { href: "/stickers/exchange",   emoji: "🔄", label: "Exchange",    desc: "Trade & buy from other players" },
  { href: "/stickers/inventory",  emoji: "🎒", label: "Inventory",   desc: "View your full sticker inventory" },
];

export default function StickersHubPage() {
  const { state, ownsSticker, totalPacks } = useStickers();

  const uniqueOwned = state.owned.filter((o) => o.quantity >= 1).length;
  const totalDupes  = state.owned.reduce((a, o) => a + Math.max(0, o.quantity - 1), 0);

  const seriesComplete = (() => {
    const series = [...new Set(STICKERS.map((s) => s.series))];
    return series.filter((s) => STICKERS.filter((st) => st.series === s).every((st) => ownsSticker(st.id))).length;
  })();

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-cyan-400 mb-1">🃏 Stickers Hub</h1>
        <p className="text-white/50 text-sm">Collect, craft, trade — build your complete digital album.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Unique Stickers", value: `${uniqueOwned} / ${STICKERS.length}`, color: "text-cyan-400" },
          { label: "Duplicates",      value: totalDupes,   color: "text-orange-400" },
          { label: "Geek Dust",       value: `${state.dust.toLocaleString()} 💨`, color: "text-purple-400" },
          { label: "Packs Ready",     value: totalPacks,   color: "text-yellow-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass rounded-xl p-4 text-center border border-white/10">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-white/50 text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Series completion */}
      <div className="glass rounded-xl p-4 mb-8 border border-white/10 flex items-center justify-between">
        <div>
          <div className="text-sm text-white/60">Series Completed</div>
          <div className="text-xl font-bold text-yellow-400">{seriesComplete} / {[...new Set(STICKERS.map((s) => s.series))].length}</div>
        </div>
        <div className="text-3xl">🏆</div>
      </div>

      {/* GEEK balance */}
      <div className="glass rounded-xl p-4 mb-10 border border-cyan-400/20 flex items-center justify-between">
        <div>
          <div className="text-sm text-white/60">GEEK Balance</div>
          <div className="text-xl font-bold text-cyan-400">{state.geek.toLocaleString()} $GEEK</div>
        </div>
        <div className="text-3xl">💎</div>
      </div>

      {/* Section links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SECTIONS.map(({ href, emoji, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="glass border border-white/10 hover:border-cyan-400/40 rounded-xl p-5 flex items-start gap-4 transition-all hover:bg-white/5 group"
          >
            <span className="text-3xl">{emoji}</span>
            <div>
              <div className="font-semibold text-white group-hover:text-cyan-400 transition-colors">{label}</div>
              <div className="text-white/40 text-sm mt-0.5">{desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
