"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useStickers } from "@/context/StickersContext";
import { type Sticker, type PackType, RARITY_COLORS, RARITY_BADGE, DUST_FROM_DUPE } from "@/lib/stickers";

const PACK_INFO: Record<PackType, { emoji: string; desc: string; color: string }> = {
  Standard:  { emoji: "📦", desc: "Mostly Common & Uncommon",        color: "border-gray-500/40 bg-gray-500/10" },
  Premium:   { emoji: "💎", desc: "Better odds on Rare & Epic",      color: "border-blue-500/40 bg-blue-500/10" },
  Legendary: { emoji: "👑", desc: "Good chance of Epic & Legendary", color: "border-yellow-500/40 bg-yellow-500/10" },
};

export default function PacksPage() {
  const { state, dispatch } = useStickers();
  const [revealed, setRevealed]   = useState<Sticker[]>([]);
  const [flipped, setFlipped]     = useState<boolean[]>([]);
  const [dupeFlags, setDupeFlags] = useState<boolean[]>([]);
  const [opening, setOpening]     = useState(false);
  const prevOwned = useRef<Record<string, number>>({});

  // When lastOpened changes (pack just opened), start reveal animation
  useEffect(() => {
    if (!state.lastOpened.length) return;
    const drawn = state.lastOpened;
    const pre = prevOwned.current;
    const dupes = drawn.map((s) => (pre[s.id] ?? 0) >= 1);

    setRevealed(drawn);
    setFlipped(drawn.map(() => false));
    setDupeFlags(dupes);

    drawn.forEach((_, i) => {
      setTimeout(() => {
        setFlipped((prev) => { const n = [...prev]; n[i] = true; return n; });
      }, 300 + i * 550);
    });

    setTimeout(() => {
      setOpening(false);
      dispatch({ type: "CLEAR_LAST_OPENED" });
    }, 300 + drawn.length * 550 + 800);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.lastOpened]);

  function handleOpen(packType: PackType) {
    if (opening) return;
    const pack = state.packs.find((p) => p.type === packType && p.quantity > 0);
    if (!pack) return;
    // snapshot owned counts before opening
    prevOwned.current = Object.fromEntries(state.owned.map((o) => [o.stickerId, o.quantity]));
    setOpening(true);
    setRevealed([]);
    setFlipped([]);
    dispatch({ type: "OPEN_PACK", packType });
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/stickers" className="text-cyan-400/60 text-sm hover:text-cyan-400 mb-1 inline-block">← Stickers Hub</Link>
        <h1 className="text-3xl font-bold text-cyan-400">📦 Open Packs</h1>
        <p className="text-white/40 text-sm mt-1">Each pack reveals 5 stickers. Duplicates auto-convert to Geek Dust.</p>
      </div>

      {/* Pack selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {(["Standard", "Premium", "Legendary"] as PackType[]).map((pt) => {
          const info = PACK_INFO[pt];
          const qty = state.packs.find((p) => p.type === pt)?.quantity ?? 0;
          return (
            <div key={pt} className={`glass border rounded-xl p-5 flex flex-col items-center text-center ${info.color}`}>
              <div className="text-5xl mb-3">{info.emoji}</div>
              <div className="font-bold text-lg mb-1">{pt} Pack</div>
              <div className="text-white/40 text-xs mb-4">{info.desc}</div>
              <div className="text-sm text-white/60 mb-3">×{qty} available</div>
              <button
                onClick={() => handleOpen(pt)}
                disabled={qty === 0 || opening}
                className={`w-full rounded-lg py-2 text-sm font-semibold transition-all ${
                  qty > 0 && !opening
                    ? "bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-400/30"
                    : "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
                }`}
              >
                {qty === 0 ? "No packs" : opening ? "Opening…" : "Open Pack"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Reveal area */}
      {revealed.length > 0 && (
        <div>
          <h2 className="text-center text-white/60 text-sm mb-6">Revealing your stickers…</h2>
          <div className="flex flex-wrap justify-center gap-5">
            {revealed.map((sticker, i) => (
              <div key={i} style={{ perspective: "600px" }}>
                <div
                  className="w-28 h-40 transition-all duration-500 relative"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: flipped[i] ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  {/* Card back */}
                  <div
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-900 to-purple-900 border border-cyan-400/30 flex items-center justify-center"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <span className="text-4xl">🃏</span>
                  </div>
                  {/* Card front */}
                  <div
                    className={`absolute inset-0 rounded-xl border flex flex-col items-center justify-center p-3 text-center ${RARITY_COLORS[sticker.rarity]}`}
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <div className="text-3xl mb-1">{sticker.emoji}</div>
                    <div className="text-xs font-semibold leading-tight">{sticker.name}</div>
                    <span className={`mt-1.5 text-xs px-1.5 py-0.5 rounded-full ${RARITY_BADGE[sticker.rarity]}`}>{sticker.rarity}</span>
                    {dupeFlags[i] && (
                      <div className="mt-2 text-xs text-orange-300 bg-orange-500/10 rounded px-1 py-0.5">
                        +{DUST_FROM_DUPE[sticker.rarity]} Dust
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
