"use client";

import { useState } from "react";
import Link from "next/link";
import { useStickers } from "@/context/StickersContext";
import { STICKERS, RARITY_COLORS, RARITY_BADGE, DUST_FROM_DUPE, type Rarity } from "@/lib/stickers";

type Sort = "rarity" | "series" | "name";

const RARITY_ORDER: Record<Rarity, number> = { Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4 };

export default function InventoryPage() {
  const { state, dispatch, quantityOf } = useStickers();
  const [sort, setSort]         = useState<Sort>("rarity");
  const [dupeOnly, setDupeOnly] = useState(false);
  const [toast, setToast]       = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function dustDupes(stickerId: string) {
    const sticker = STICKERS.find((s) => s.id === stickerId)!;
    const qty = quantityOf(stickerId);
    if (qty < 2) return;
    const gain = DUST_FROM_DUPE[sticker.rarity] * (qty - 1);
    dispatch({ type: "DUST_DUPES", stickerId });
    showToast(`+${gain} Geek Dust from dupes!`);
  }

  function dustAll() {
    let total = 0;
    state.owned.forEach((o) => {
      if (o.quantity < 2) return;
      const s = STICKERS.find((st) => st.id === o.stickerId)!;
      total += DUST_FROM_DUPE[s.rarity] * (o.quantity - 1);
      dispatch({ type: "DUST_DUPES", stickerId: o.stickerId });
    });
    if (total > 0) showToast(`💨 +${total} Geek Dust from all dupes!`);
    else showToast("No duplicates to dust.");
  }

  const ownedStickers = STICKERS.filter((s) => (quantityOf(s.id)) >= 1);

  const filtered = ownedStickers.filter((s) => !dupeOnly || quantityOf(s.id) >= 2);

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "rarity") return RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] || a.number - b.number;
    if (sort === "series") return a.series.localeCompare(b.series) || a.number - b.number;
    return a.name.localeCompare(b.name);
  });

  const totalDupes = state.owned.reduce((a, o) => a + Math.max(0, o.quantity - 1), 0);

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
          <h1 className="text-3xl font-bold text-cyan-400">🎒 Inventory</h1>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/50">Dust</div>
          <div className="text-lg font-bold text-purple-400">{state.dust.toLocaleString()} 💨</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass border border-white/10 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-cyan-400">{ownedStickers.length}</div>
          <div className="text-xs text-white/40 mt-0.5">Unique</div>
        </div>
        <div className="glass border border-white/10 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-orange-400">{totalDupes}</div>
          <div className="text-xs text-white/40 mt-0.5">Duplicates</div>
        </div>
        <div className="glass border border-white/10 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-white/60">{STICKERS.length - ownedStickers.length}</div>
          <div className="text-xs text-white/40 mt-0.5">Missing</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
        >
          <option value="rarity">Sort: Rarity</option>
          <option value="series">Sort: Series</option>
          <option value="name">Sort: Name</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
          <input
            type="checkbox"
            checked={dupeOnly}
            onChange={(e) => setDupeOnly(e.target.checked)}
            className="accent-orange-400"
          />
          Duplicates only
        </label>
        {totalDupes > 0 && (
          <button
            onClick={dustAll}
            className="ml-auto bg-purple-400/20 border border-purple-400/40 text-purple-300 rounded-lg px-4 py-1.5 text-sm hover:bg-purple-400/30"
          >
            Dust All Dupes ({totalDupes})
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="text-center text-white/30 py-20">
          {dupeOnly ? "No duplicates." : "Your inventory is empty. Open packs or visit the Shop!"}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sorted.map((sticker) => {
            const qty = quantityOf(sticker.id);
            const isDupe = qty >= 2;
            return (
              <div
                key={sticker.id}
                className={`glass border rounded-xl p-4 flex flex-col items-center text-center relative ${RARITY_COLORS[sticker.rarity]}`}
              >
                {isDupe && (
                  <div className="absolute top-2 right-2 bg-orange-500/80 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {qty}
                  </div>
                )}
                <div className="text-3xl mb-2">{sticker.emoji}</div>
                <div className="font-semibold text-sm leading-tight">{sticker.name}</div>
                <div className="text-xs text-white/30 mb-1">#{sticker.number}</div>
                <span className={`text-xs px-1.5 py-0.5 rounded-full mb-2 ${RARITY_BADGE[sticker.rarity]}`}>{sticker.rarity}</span>
                <div className="text-xs text-white/30 mb-3">{sticker.series}</div>

                {isDupe && (
                  <button
                    onClick={() => dustDupes(sticker.id)}
                    className="w-full text-xs bg-purple-400/10 border border-purple-400/30 text-purple-300 rounded-lg py-1.5 hover:bg-purple-400/20 transition-all"
                  >
                    Dust ×{qty - 1} (+{DUST_FROM_DUPE[sticker.rarity] * (qty - 1)} 💨)
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
