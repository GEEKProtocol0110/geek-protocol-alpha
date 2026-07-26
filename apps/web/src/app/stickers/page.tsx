"use client";

import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

// ── Types ────────────────────────────────────────────────────────────────────

type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";

type StickerDef = {
  id: number;
  number: number;
  name: string;
  emoji: string;
  rarity: Rarity;
};

type SeriesDef = {
  id: number;
  name: string;
  description: string;
  icon: string;
  stickers: StickerDef[];
};

type OwnedMap = Record<number, { count: number }>;

// ── Constants ────────────────────────────────────────────────────────────────

const RARITY_STYLE: Record<Rarity, { color: string; bg: string; border: string; label: string }> = {
  Common:    { color: "text-[var(--text-3)]",         bg: "bg-[var(--surface-2)]",              border: "border-[var(--border-strong)]",       label: "COMMON"    },
  Uncommon:  { color: "text-[var(--brand-secondary)]", bg: "bg-[var(--brand-secondary)]/10",     border: "border-[var(--brand-secondary)]/30",  label: "UNCOMMON"  },
  Rare:      { color: "text-[var(--brand-primary)]",   bg: "bg-[var(--brand-primary)]/10",       border: "border-[var(--brand-primary)]/30",    label: "RARE"      },
  Epic:      { color: "text-[var(--brand-primary-light)]", bg: "bg-[var(--brand-primary-light)]/10", border: "border-[var(--brand-primary-light)]/30", label: "EPIC" },
  Legendary: { color: "text-[var(--brand-accent)]",    bg: "bg-[var(--brand-accent)]/10",        border: "border-[var(--brand-accent)]/30",     label: "LEGENDARY" },
};

const RARITY_VALUE: Record<Rarity, number> = {
  Common: 10, Uncommon: 25, Rare: 75, Epic: 200, Legendary: 500,
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StickerCard({
  sticker,
  owned,
  count,
  onClick,
}: {
  sticker: StickerDef;
  owned: boolean;
  count: number;
  onClick: () => void;
}) {
  const rs = RARITY_STYLE[sticker.rarity];
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all duration-200 group text-center
        ${owned
          ? `${rs.border} ${rs.bg} hover:scale-105 hover:shadow-lg`
          : "border-[var(--border-soft)] bg-[var(--surface-2)] opacity-50 hover:opacity-70 cursor-pointer"
        }`}
    >
      {/* Emoji */}
      <span className={`text-3xl transition-transform duration-200 ${owned ? "group-hover:scale-110" : "grayscale"}`}>
        {owned ? sticker.emoji : "🔒"}
      </span>

      {/* Name */}
      <span className={`text-[10px] tracking-widest leading-tight font-semibold ${owned ? "text-[var(--text-2)]" : "text-[var(--text-3)]"}`}>
        {sticker.name}
      </span>

      {/* Number + rarity */}
      <span className={`text-[9px] font-semibold ${owned ? rs.color : "text-[var(--text-3)]"}`}>
        #{sticker.number} · {rs.label}
      </span>

      {/* Duplicate badge */}
      {count > 1 && (
        <span className="absolute -top-1.5 -right-1.5 bg-[var(--brand-primary)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
          ×{count}
        </span>
      )}

      {/* Legendary glow */}
      {owned && sticker.rarity === "Legendary" && (
        <span className="absolute inset-0 rounded-2xl ring-2 ring-[var(--brand-accent)]/40 pointer-events-none" />
      )}
    </button>
  );
}

function Modal({
  sticker,
  owned,
  count,
  onClose,
}: {
  sticker: StickerDef;
  owned: boolean;
  count: number;
  onClose: () => void;
}) {
  const rs = RARITY_STYLE[sticker.rarity];
  const value = RARITY_VALUE[sticker.rarity];

  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center px-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-sm rounded-3xl border ${rs.border} bg-[#0c081e] p-6 shadow-[var(--shadow-soft)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <span className="text-6xl">{owned ? sticker.emoji : "🔒"}</span>
        </div>

        <div className="text-[10px] tracking-widest text-[var(--brand-accent)] font-bold mb-1 text-center uppercase">
          Sticker #{sticker.number}
        </div>
        <h2 className="font-extrabold text-3xl text-[var(--text-1)] text-center mb-4">
          {sticker.name}
        </h2>

        <div className="space-y-2 mb-5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-[var(--text-3)]">Rarity</span>
            <span className={rs.color}>{rs.label}</span>
          </div>
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-[var(--text-3)]">Value</span>
            <span className="text-[var(--brand-accent)]">{value} $GEEK</span>
          </div>
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-[var(--text-3)]">Status</span>
            <span className={owned ? "text-[var(--brand-secondary)]" : "text-[var(--text-3)]"}>
              {owned ? "✓ Owned" : "✗ Not collected"}
            </span>
          </div>
          {count > 1 && (
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-[var(--text-3)]">Duplicates</span>
              <span className="text-[var(--brand-primary)]">×{count - 1} extra</span>
            </div>
          )}
        </div>

        {!owned && (
          <div className={`${rs.bg} border ${rs.border} rounded-xl px-3 py-2 text-[10px] text-[var(--text-2)] mb-4`}>
            🔓 Earn this sticker by completing quizzes and reaching milestones.
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-2)] hover:text-[var(--text-1)] text-xs font-bold tracking-widest py-2.5 transition uppercase"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function StickersPage() {
  const { user, isAuthenticated } = useAuth();
  const [catalogue, setCatalogue] = useState<SeriesDef[]>([]);
  const [owned, setOwned]         = useState<OwnedMap>({});
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<StickerDef | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const catRes = await fetch(`${API}/api/stickers/catalogue`);
      const catJson = await catRes.json();
      setCatalogue(catJson.data ?? []);

      if (isAuthenticated) {
        const myRes = await fetch(`${API}/api/stickers/my`, { credentials: "include" });
        if (myRes.ok) {
          const myJson = await myRes.json();
          setOwned(myJson.data ?? {});
        }
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const allStickers   = catalogue.flatMap((s) => s.stickers);
  const totalUnique   = allStickers.length;
  const ownedUnique   = allStickers.filter((s) => !!owned[s.id]).length;
  const totalDupes    = Object.values(owned).reduce((sum, o) => sum + Math.max(0, o.count - 1), 0);
  const completionPct = totalUnique > 0 ? Math.round((ownedUnique / totalUnique) * 100) : 0;
  const myStickers    = allStickers.filter((s) => !!owned[s.id]);

  return (
    <div className="min-h-screen text-[var(--text-1)]">
      <Navbar />

      {selected && (
        <Modal
          sticker={selected}
          owned={!!owned[selected.id]}
          count={owned[selected.id]?.count ?? 0}
          onClose={() => setSelected(null)}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-10">
          <div className="badge-pill text-[var(--brand-accent)] mb-4">Sticker Collection</div>
          <h1 className="font-extrabold text-5xl text-[var(--text-1)] mb-1">
            Sticker <span className="text-[var(--brand-primary)]">Album</span>
          </h1>
          <p className="text-sm text-[var(--text-3)]">
            Earn stickers by completing quizzes and reaching milestones.
          </p>
        </div>

        {/* Overall stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[
            { label: "Unique Owned",  value: `${ownedUnique} / ${totalUnique}` },
            { label: "Duplicates",    value: totalDupes },
            { label: "Completion",    value: `${completionPct}%` },
            { label: "Series",        value: catalogue.length },
          ].map((s) => (
            <div key={s.label} className="soft-card p-5 text-center">
              <div className="text-[10px] tracking-widest text-[var(--text-3)] uppercase mb-1 font-semibold">{s.label}</div>
              <div className="font-extrabold text-3xl text-[var(--text-1)]">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Overall progress bar */}
        <div className="soft-card p-4 mb-10">
          <div className="flex justify-between text-[10px] text-[var(--text-3)] mb-2 font-semibold uppercase">
            <span>Overall Progress</span>
            <span>{completionPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-700"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* My collected stickers */}
            {isAuthenticated && myStickers.length > 0 && (
              <div className="mb-12">
                <div className="badge-pill text-[var(--brand-accent)] mb-3">My Stickers</div>
                <h2 className="font-extrabold text-2xl text-[var(--text-1)] mb-4">
                  My Collected Stickers
                  <span className="ml-3 text-sm text-[var(--text-3)] font-normal">{myStickers.length} owned</span>
                </h2>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {myStickers.map((s) => (
                    <StickerCard
                      key={s.id}
                      sticker={s}
                      owned
                      count={owned[s.id]?.count ?? 1}
                      onClick={() => setSelected(s)}
                    />
                  ))}
                </div>
              </div>
            )}

            {!isAuthenticated && (
              <div className="rounded-2xl border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/5 px-5 py-4 text-sm text-[var(--brand-primary)] mb-10 text-center font-medium">
                <a href="/auth/login" className="underline hover:opacity-80">Sign in</a> to track your collection and see which stickers you own.
              </div>
            )}

            {/* Series sections */}
            {catalogue.map((series) => {
              const seriesOwned = series.stickers.filter((s) => !!owned[s.id]).length;
              const seriesPct   = Math.round((seriesOwned / series.stickers.length) * 100);

              return (
                <div key={series.id} className="mb-12">
                  {/* Series header */}
                  <div className="soft-card p-5 mb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{series.icon}</span>
                          <h2 className="font-extrabold text-2xl text-[var(--text-1)]">{series.name} Series</h2>
                        </div>
                        <p className="text-xs text-[var(--text-3)]">{series.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-[var(--text-3)] mb-1 font-semibold">{seriesOwned}/{series.stickers.length} collected</div>
                        <div className="w-32 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-700"
                            style={{ width: `${seriesPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sticker grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {series.stickers.map((s) => (
                      <StickerCard
                        key={s.id}
                        sticker={s}
                        owned={!!owned[s.id]}
                        count={owned[s.id]?.count ?? 0}
                        onClick={() => setSelected(s)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Info panels */}
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              {/* How to earn */}
              <div className="soft-card p-5">
                <div className="badge-pill text-[var(--brand-accent)] mb-3">How to Earn</div>
                <div className="space-y-2 text-xs text-[var(--text-2)] font-medium">
                  <div>🎮 Complete quiz runs</div>
                  <div>🔥 Maintain daily streaks</div>
                  <div>🏆 Reach score milestones</div>
                  <div>⚔️ Finish Gauntlet rounds</div>
                  <div>✍️ Contribute CCE questions</div>
                </div>
              </div>

              {/* Rarity values */}
              <div className="soft-card p-5">
                <div className="badge-pill text-[var(--brand-accent)] mb-3">Rarity Values</div>
                <div className="space-y-2">
                  {(Object.entries(RARITY_VALUE) as [Rarity, number][]).map(([r, v]) => (
                    <div key={r} className="flex justify-between text-xs font-semibold">
                      <span className={RARITY_STYLE[r].color}>{r}</span>
                      <span className="text-[var(--brand-accent)]">{v} $GEEK</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trading */}
              <div className="soft-card p-5">
                <div className="badge-pill text-[var(--brand-accent)] mb-3">Trading</div>
                <p className="text-xs text-[var(--text-3)] mb-3">
                  Duplicate stickers can be traded with other players. The P2P marketplace is coming in Phase 3.
                </p>
                <div className="rounded-xl bg-[var(--surface-2)] px-3 py-2 text-[10px] text-[var(--text-3)] text-center font-semibold">
                  🔜 Coming Q3 2026
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
