"use client";

import { useState } from "react";
import Link from "next/link";
import { useStickers } from "@/context/StickersContext";
import { STICKERS, SERIES, SHOP_PRICES, DUST_FROM_DUPE, RARITY_COLORS, RARITY_BADGE, type Rarity } from "@/lib/stickers";

const RARITIES: Rarity[] = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];

export default function ShopPage() {
  const { state, dispatch, ownsSticker, quantityOf } = useStickers();
  const [filterRarity, setFilterRarity] = useState<Rarity | "All">("All");
  const [filterSeries, setFilterSeries] = useState<string>("All");
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function buy(stickerId: string) {
    const sticker = STICKERS.find((s) => s.id === stickerId)!;
    const price = SHOP_PRICES[sticker.rarity];
    if (state.geek < price) { showToast("Not enough GEEK!"); return; }
    const isDupe = ownsSticker(stickerId);
    dispatch({ type: "BUY_STICKER", stickerId });
    if (isDupe) {
      showToast(`Duplicate! +${DUST_FROM_DUPE[sticker.rarity]} Geek Dust 💨`);
    } else {
      showToast(`${sticker.emoji} ${sticker.name} added to collection!`);
    }
  }

  const filtered = STICKERS.filter((s) => {
    if (filterRarity !== "All" && s.rarity !== filterRarity) return false;
    if (filterSeries !== "All" && s.series !== filterSeries) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10 max-w-5xl mx-auto">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-cyan-900/90 border border-cyan-400/40 text-cyan-200 text-sm px-5 py-2.5 rounded-xl shadow-xl transition-all">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/stickers" className="text-cyan-400/60 text-sm hover:text-cyan-400 mb-1 inline-block">← Stickers Hub</Link>
          <h1 className="text-3xl font-bold text-cyan-400">🛒 Sticker Shop</h1>
        </div>
        <div className="text-right">
          <div className="text-white/50 text-xs">Balance</div>
          <div className="text-lg font-bold text-cyan-400">{state.geek.toLocaleString()} $GEEK</div>
        </div>
      </div>

      {/* Price reference */}
      <div className="flex flex-wrap gap-2 mb-6">
        {RARITIES.map((r) => (
          <span key={r} className={`text-xs px-2 py-1 rounded-full border ${RARITY_COLORS[r]}`}>
            {r}: {SHOP_PRICES[r]} GEEK
          </span>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
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
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filtered.map((sticker) => {
          const owned = ownsSticker(sticker.id);
          const qty = quantityOf(sticker.id);
          const price = SHOP_PRICES[sticker.rarity];
          const canAfford = state.geek >= price;

          return (
            <div key={sticker.id} className={`glass border rounded-xl p-4 flex flex-col items-center text-center ${RARITY_COLORS[sticker.rarity]}`}>
              <div className="text-4xl mb-2">{sticker.emoji}</div>
              <div className="font-semibold text-sm">{sticker.name}</div>
              <div className="text-xs text-white/30 mb-1">#{sticker.number} · {sticker.series}</div>
              <span className={`text-xs px-2 py-0.5 rounded-full mb-3 ${RARITY_BADGE[sticker.rarity]}`}>{sticker.rarity}</span>

              {owned && qty >= 1 && (
                <div className="text-xs text-orange-300/70 mb-2">
                  ✓ Owned{qty > 1 ? ` (×${qty})` : ""} → +{DUST_FROM_DUPE[sticker.rarity]} Dust
                </div>
              )}

              <button
                onClick={() => buy(sticker.id)}
                disabled={!canAfford}
                className={`w-full rounded-lg py-1.5 text-sm font-medium transition-all ${
                  canAfford
                    ? "bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-400/30"
                    : "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
                }`}
              >
                {price} GEEK
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}
