"use client";

import { useState } from "react";
import Link from "next/link";
import { useStickers } from "@/context/StickersContext";
import { STICKERS, SERIES, CRAFT_COSTS, RARITY_COLORS, RARITY_BADGE, type Rarity } from "@/lib/stickers";

const RARITIES: Rarity[] = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];

export default function CraftPage() {
  const { state, dispatch, ownsSticker } = useStickers();
  const [filterRarity, setFilterRarity] = useState<Rarity | "All">("All");
  const [filterSeries, setFilterSeries] = useState<string>("All");
  const [showOwned, setShowOwned]       = useState(false);
  const [toast, setToast]               = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function craft(stickerId: string) {
    const sticker = STICKERS.find((s) => s.id === stickerId)!;
    const cost = CRAFT_COSTS[sticker.rarity];
    if (state.dust < cost) { showToast("Not enough Geek Dust!"); return; }
    dispatch({ type: "CRAFT_STICKER", stickerId });
    showToast(`✨ Crafted ${sticker.emoji} ${sticker.name}!`);
  }

  const filtered = STICKERS.filter((s) => {
    if (!showOwned && ownsSticker(s.id)) return false;
    if (filterRarity !== "All" && s.rarity !== filterRarity) return false;
    if (filterSeries !== "All" && s.series !== filterSeries) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10 max-w-5xl mx-auto">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-purple-900/90 border border-purple-400/40 text-purple-200 text-sm px-5 py-2.5 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/stickers" className="text-cyan-400/60 text-sm hover:text-cyan-400 mb-1 inline-block">← Stickers Hub</Link>
          <h1 className="text-3xl font-bold text-cyan-400">⚗️ Craft Stickers</h1>
        </div>
        <div className="text-right">
          <div className="text-white/50 text-xs">Geek Dust</div>
          <div className="text-xl font-bold text-purple-400">{state.dust.toLocaleString()} 💨</div>
        </div>
      </div>

      {/* Cost reference */}
      <div className="flex flex-wrap gap-2 mb-6">
        {RARITIES.map((r) => (
          <span key={r} className={`text-xs px-2 py-1 rounded-full border ${RARITY_COLORS[r]}`}>
            {r}: {CRAFT_COSTS[r].toLocaleString()} Dust
          </span>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <select
          value={filterRarity}
          onChange={(e) => setFilterRarity(e.target.value as Rarity | "All")}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
        >
          <option value="All">All Rarities</option>
          {RARITIES.map((r) => <option key={r}>{r}</option>)}
        </select>
        <select
          value={filterSeries}
          onChange={(e) => setFilterSeries(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
        >
          <option value="All">All Series</option>
          {SERIES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
          <input
            type="checkbox"
            checked={showOwned}
            onChange={(e) => setShowOwned(e.target.checked)}
            className="accent-cyan-400"
          />
          Show owned
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-white/30 py-20">
          {showOwned ? "No stickers match filters." : "🎉 You own all stickers in this filter! Toggle 'Show owned' to see them."}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map((sticker) => {
            const cost = CRAFT_COSTS[sticker.rarity];
            const canAfford = state.dust >= cost;
            const owned = ownsSticker(sticker.id);
            return (
              <div key={sticker.id} className={`glass border rounded-xl p-4 flex flex-col items-center text-center ${RARITY_COLORS[sticker.rarity]} ${owned ? "opacity-50" : ""}`}>
                <div className="text-4xl mb-2">{sticker.emoji}</div>
                <div className="font-semibold text-sm">{sticker.name}</div>
                <div className="text-xs text-white/30 mb-1">#{sticker.number} · {sticker.series}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full mb-3 ${RARITY_BADGE[sticker.rarity]}`}>{sticker.rarity}</span>

                {owned ? (
                  <div className="text-xs text-green-400 mt-auto">✓ Already owned</div>
                ) : (
                  <button
                    onClick={() => craft(sticker.id)}
                    disabled={!canAfford}
                    className={`w-full rounded-lg py-1.5 text-xs font-medium transition-all mt-auto ${
                      canAfford
                        ? "bg-purple-400/20 border border-purple-400/40 text-purple-300 hover:bg-purple-400/30"
                        : "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
                    }`}
                  >
                    {cost.toLocaleString()} Dust
                    {!canAfford && <span className="ml-1 text-red-400/60">({(cost - state.dust).toLocaleString()} short)</span>}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
