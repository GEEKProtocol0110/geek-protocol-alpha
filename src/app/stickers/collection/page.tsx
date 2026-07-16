"use client";

import Link from "next/link";
import { useStickers } from "@/context/StickersContext";
import { STICKERS, SERIES, RARITY_COLORS, RARITY_BADGE, type Rarity } from "@/lib/stickers";

const RARITIES: Rarity[] = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];

export default function CollectionPage() {
  const { ownsSticker, state } = useStickers();

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/stickers" className="text-cyan-400/60 text-sm hover:text-cyan-400 mb-1 inline-block">← Stickers Hub</Link>
          <h1 className="text-3xl font-bold text-cyan-400">📖 Collection</h1>
        </div>
        <div className="text-right">
          <div className="text-white/50 text-xs">Owned</div>
          <div className="text-xl font-bold text-cyan-400">
            {state.owned.filter((o) => o.quantity >= 1).length} / {STICKERS.length}
          </div>
        </div>
      </div>

      {/* Rarity legend */}
      <div className="flex flex-wrap gap-2 mb-8">
        {RARITIES.map((r) => (
          <span key={r} className={`text-xs px-2 py-1 rounded-full border ${RARITY_COLORS[r]}`}>{r}</span>
        ))}
      </div>

      {SERIES.map((series) => {
        const seriesStickers = STICKERS.filter((s) => s.series === series);
        const ownedCount = seriesStickers.filter((s) => ownsSticker(s.id)).length;
        const complete = ownedCount === seriesStickers.length;

        return (
          <div key={series} className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white/80">{series}</h2>
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-sm">{ownedCount}/{seriesStickers.length}</span>
                {complete && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full px-2 py-0.5">
                    ✨ Complete! +Legendary Pack
                  </span>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-white/10 rounded-full mb-4">
              <div
                className={`h-full rounded-full transition-all ${complete ? "bg-yellow-400" : "bg-cyan-400"}`}
                style={{ width: `${(ownedCount / seriesStickers.length) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-3">
              {seriesStickers.map((sticker) => {
                const owned = ownsSticker(sticker.id);
                return (
                  <div
                    key={sticker.id}
                    className={`relative rounded-xl border p-3 flex flex-col items-center text-center transition-all ${
                      owned
                        ? `${RARITY_COLORS[sticker.rarity]} shadow-lg`
                        : "border-white/5 bg-white/3 opacity-30 grayscale"
                    }`}
                  >
                    <div className="text-2xl mb-1">{sticker.emoji}</div>
                    <div className="text-xs font-medium leading-tight">{sticker.name}</div>
                    <div className="text-xs text-white/30 mt-0.5">#{sticker.number}</div>
                    <span className={`mt-1 text-xs px-1.5 py-0.5 rounded-full ${RARITY_BADGE[sticker.rarity]}`}>
                      {sticker.rarity[0]}
                    </span>
                    {!owned && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                        <span className="text-lg">?</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </main>
  );
}
