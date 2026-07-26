"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "buy" | "sell" | "sticker" | "liquidity";

interface PoolData {
  kasReserve: number;
  geekReserve: number;
  totalLpShares: number;
  spotPrice: number;
  recentTrades: Trade[];
}

interface Trade {
  id: string;
  type: "buy" | "sell" | "sticker";
  kasAmount?: number;
  geekAmount: number;
  stickerName?: string;
  price: number;
  timestamp: number;
}

interface UserSticker {
  id: number;
  stickerId: number;
  count: number;
  name: string;
  emoji: string;
  rarity: string;
  geekValue: number;
}

const RARITY_GEEK: Record<string, number> = {
  Common: 10, Uncommon: 25, Rare: 75, Epic: 200, Legendary: 500,
};

const RARITY_COLOR: Record<string, string> = {
  Common: "text-[var(--text-3)]", Uncommon: "text-[var(--brand-secondary)]",
  Rare: "text-[var(--brand-primary)]", Epic: "text-[var(--brand-primary-light)]", Legendary: "text-[var(--brand-accent)]",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number, d = 2) {
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="soft-card p-4 text-center">
      <div className="text-[10px] tracking-widest text-[var(--text-3)] uppercase mb-1 font-semibold">{label}</div>
      <div className="font-extrabold text-2xl text-[var(--text-1)]">{value}</div>
      {sub && <div className="text-[10px] text-[var(--text-3)] mt-0.5">{sub}</div>}
    </div>
  );
}

function TradeRow({ trade }: { trade: Trade }) {
  const icon = trade.type === "buy" ? "🟢" : trade.type === "sell" ? "🔴" : "🎴";
  const label = trade.type === "buy"
    ? `+${fmt(trade.geekAmount)} GEEK`
    : trade.type === "sell"
    ? `-${fmt(trade.geekAmount)} GEEK`
    : `${trade.stickerName} → ${fmt(trade.geekAmount)} GEEK`;

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-soft)] text-xs font-medium">
      <span>{icon} <span className={trade.type === "buy" ? "text-[var(--brand-secondary)]" : trade.type === "sell" ? "text-[var(--brand-tertiary)]" : "text-[var(--brand-accent)]"}>{label}</span></span>
      <span className="text-[var(--text-3)]">{timeAgo(trade.timestamp)}</span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TokenPage() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [tab, setTab] = useState<Tab>("buy");
  const [pool, setPool] = useState<PoolData | null>(null);
  const [kasInput, setKasInput] = useState("");
  const [geekInput, setGeekInput] = useState("");
  const [quote, setQuote] = useState<number | null>(null);
  const [userStickers, setUserStickers] = useState<UserSticker[]>([]);
  const [selectedSticker, setSelectedSticker] = useState<UserSticker | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Pool polling ──────────────────────────────────────────────────────────

  const fetchPool = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/token/pool`);
      const j = await r.json();
      if (j.success) setPool(j.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchPool();
    pollRef.current = setInterval(fetchPool, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchPool]);

  // ── Fetch user stickers ───────────────────────────────────────────────────

  const fetchStickers = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [catR, myR] = await Promise.all([
        fetch(`${API}/api/stickers/catalogue`),
        fetch(`${API}/api/stickers/my`, { credentials: "include" }),
      ]);
      const cat = await catR.json();
      const my = await myR.json();
      const owned: Record<number, { count: number }> = my.data ?? {};
      const allStickers = (cat.data ?? []).flatMap((s: { stickers: { id: number; name: string; emoji: string; rarity: string }[] }) => s.stickers);
      const list: UserSticker[] = [];
      for (const [idStr, { count }] of Object.entries(owned)) {
        const id = Number(idStr);
        const def = allStickers.find((s: { id: number }) => s.id === id);
        if (def) {
          list.push({ id, stickerId: id, count, name: def.name, emoji: def.emoji, rarity: def.rarity, geekValue: RARITY_GEEK[def.rarity] ?? 10 });
        }
      }
      setUserStickers(list);
    } catch {}
  }, [isAuthenticated]);

  useEffect(() => { fetchStickers(); }, [fetchStickers]);

  // ── Quote on input change ─────────────────────────────────────────────────

  useEffect(() => {
    if (!pool) return;
    const kas = parseFloat(kasInput);
    if (tab === "buy" && kas > 0) {
      const fee = kas * 0.003;
      const kasWithFee = kas - fee;
      const out = (pool.geekReserve * kasWithFee) / (pool.kasReserve + kasWithFee);
      setQuote(Math.floor(out * 100) / 100);
    } else if (tab === "sell") {
      const geek = parseFloat(geekInput);
      if (geek > 0) {
        const fee = geek * 0.003;
        const geekWithFee = geek - fee;
        const out = (pool.kasReserve * geekWithFee) / (pool.geekReserve + geekWithFee);
        setQuote(Math.floor(out * 100) / 100);
      } else setQuote(null);
    } else {
      setQuote(null);
    }
  }, [kasInput, geekInput, tab, pool]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const flash = (ok: boolean, text: string) => {
    setMsg({ ok, text });
    setTimeout(() => setMsg(null), 4000);
  };

  async function handleBuy() {
    const kas = parseFloat(kasInput);
    if (!kas || kas <= 0) return flash(false, "Enter a valid KAS amount");
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/token/buy`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kasAmount: kas }),
      });
      const j = await r.json();
      if (j.success) {
        flash(true, `✅ Bought ${fmt(j.data.geekReceived)} $GEEK! New balance: ${fmt(j.data.newBalance)}`);
        setKasInput("");
        setQuote(null);
        await refreshUser();
        fetchPool();
      } else flash(false, j.error ?? "Buy failed");
    } catch { flash(false, "Network error"); }
    setLoading(false);
  }

  async function handleSell() {
    const geek = parseFloat(geekInput);
    if (!geek || geek <= 0) return flash(false, "Enter a valid GEEK amount");
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/token/sell`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geekAmount: geek }),
      });
      const j = await r.json();
      if (j.success) {
        flash(true, `✅ Sold ${fmt(geek)} $GEEK for ${fmt(j.data.kasReceived)} KAS`);
        setGeekInput("");
        setQuote(null);
        await refreshUser();
        fetchPool();
      } else flash(false, j.error ?? "Sell failed");
    } catch { flash(false, "Network error"); }
    setLoading(false);
  }

  async function handleTradeSticker() {
    if (!selectedSticker) return flash(false, "Select a sticker to trade");
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/token/trade-sticker`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userStickerId: selectedSticker.id }),
      });
      const j = await r.json();
      if (j.success) {
        flash(true, `✅ Traded ${selectedSticker.name} for ${fmt(j.data.geekReceived)} $GEEK!`);
        setSelectedSticker(null);
        await refreshUser();
        fetchStickers();
        fetchPool();
      } else flash(false, j.error ?? "Trade failed");
    } catch { flash(false, "Network error"); }
    setLoading(false);
  }

  async function handleAddLiquidity() {
    const kas = parseFloat(kasInput);
    if (!kas || kas <= 0) return flash(false, "Enter KAS amount");
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/token/add-liquidity`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kasAmount: kas }),
      });
      const j = await r.json();
      if (j.success) {
        flash(true, `✅ Added liquidity! Received ${fmt(j.data.lpSharesReceived)} LP shares`);
        setKasInput("");
        await refreshUser();
        fetchPool();
      } else flash(false, j.error ?? "Failed");
    } catch { flash(false, "Network error"); }
    setLoading(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "buy",       label: "Buy GEEK",      icon: "🟢" },
    { id: "sell",      label: "Sell GEEK",     icon: "🔴" },
    { id: "sticker",   label: "Trade Sticker", icon: "🎴" },
    { id: "liquidity", label: "Add Liquidity", icon: "💧" },
  ];

  return (
    <div className="min-h-screen text-[var(--text-1)]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Neon banner */}
        <div className="relative rounded-3xl overflow-hidden border-2 border-[var(--gp-cyan)] mb-8 h-40 shadow-[6px_6px_0px_0px_var(--gp-cyan-dark)]">
          <img
            src="https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1400&q=80"
            alt="Neon abstract market"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[rgba(10,10,18,0.55)]" aria-hidden />
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="badge-pill mb-4">Geek Token Market</div>
          <h1 className="font-extrabold text-5xl text-[var(--text-1)] mb-1">
            <span className="glow-mint text-[var(--neon-mint)]">$GEEK</span> <span className="neon-text-pink">Market</span>
          </h1>
          <p className="text-sm text-[var(--text-3)]">
            Buy, sell, and trade $GEEK tokens. Powered by an on-chain AMM liquidity pool.
          </p>
        </div>

        {/* Pool stats */}
        {pool && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <StatBox label="Spot Price" value={`${fmt(pool.spotPrice)} GEEK/KAS`} />
            <StatBox label="KAS Reserve" value={fmt(pool.kasReserve, 0)} sub="KAS in pool" />
            <StatBox label="GEEK Reserve" value={fmt(pool.geekReserve, 0)} sub="GEEK in pool" />
            <StatBox label="LP Shares" value={fmt(pool.totalLpShares, 0)} sub="total issued" />
          </div>
        )}

        {/* User balance */}
        {isAuthenticated && user && (
          <div className="rounded-2xl border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/5 px-5 py-3 text-sm mb-6 flex flex-wrap gap-6 font-semibold">
            <span className="text-[var(--text-2)]">💰 $GEEK Balance: <strong className="text-[var(--brand-primary)]">{fmt(user.geekBalance)}</strong></span>
            <span className="text-[var(--text-2)]">🏆 Points: <strong className="text-[var(--brand-accent)]">{user.points.toLocaleString()}</strong></span>
          </div>
        )}

        {!isAuthenticated && (
          <div className="rounded-2xl border border-[var(--brand-tertiary)]/20 bg-[var(--brand-tertiary)]/5 px-5 py-3 text-sm text-[var(--brand-tertiary)] mb-6 font-medium">
            <a href="/auth/login" className="underline hover:opacity-80">Sign in</a> to buy, sell, or trade $GEEK tokens.
          </div>
        )}

        {/* Flash message */}
        {msg && (
          <div className={`rounded-2xl px-5 py-3 text-sm mb-6 font-semibold ${msg.ok ? "bg-[var(--brand-secondary)]/10 text-[var(--brand-secondary)]" : "bg-[var(--brand-tertiary)]/10 text-[var(--brand-tertiary)]"}`}>
            {msg.text}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">

          {/* Left: Trade panel */}
          <div className="md:col-span-2">

            {/* Tabs */}
            <div className="flex gap-1 mb-6 rounded-full bg-[var(--surface-2)] p-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setQuote(null); setKasInput(""); setGeekInput(""); }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold tracking-wide transition ${
                    tab === t.id
                      ? "bg-[var(--brand-primary)] text-white border-[3px] border-[var(--ink)] shadow-[var(--shadow-brand)]"
                      : "text-[var(--text-3)] hover:text-[var(--text-1)]"
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Buy */}
            {tab === "buy" && (
              <div className="soft-card p-6">
                <div className="badge-pill text-[var(--brand-secondary)] mb-4">Buy GEEK with KAS</div>
                <label className="text-xs text-[var(--text-2)] font-semibold block mb-1">KAS Amount</label>
                <input
                  type="number" min="0" step="any"
                  value={kasInput}
                  onChange={(e) => setKasInput(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full rounded-full bg-[var(--surface-2)] border border-transparent focus:border-[var(--brand-primary)] outline-none px-4 py-3 text-sm text-[var(--text-1)] mb-4 transition"
                />
                {quote !== null && (
                  <div className="rounded-2xl bg-[var(--brand-secondary)]/10 px-4 py-3 text-sm text-[var(--brand-secondary)] mb-4 font-semibold">
                    You receive ≈ <strong>{fmt(quote)} $GEEK</strong>
                    <span className="text-[var(--text-3)] ml-2 font-normal">(0.3% fee included)</span>
                  </div>
                )}
                <button
                  onClick={handleBuy}
                  disabled={loading || !isAuthenticated}
                  className="w-full rounded-full bg-[var(--brand-secondary)] hover:opacity-90 disabled:opacity-40 text-white font-bold text-xl py-3 transition"
                >
                  {loading ? "Processing…" : "Buy $GEEK →"}
                </button>
              </div>
            )}

            {/* Sell */}
            {tab === "sell" && (
              <div className="soft-card p-6">
                <div className="badge-pill text-[var(--brand-tertiary)] mb-4">Sell GEEK for KAS</div>
                <label className="text-xs text-[var(--text-2)] font-semibold block mb-1">$GEEK Amount</label>
                <input
                  type="number" min="0" step="any"
                  value={geekInput}
                  onChange={(e) => setGeekInput(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full rounded-full bg-[var(--surface-2)] border border-transparent focus:border-[var(--brand-tertiary)] outline-none px-4 py-3 text-sm text-[var(--text-1)] mb-4 transition"
                />
                {quote !== null && (
                  <div className="rounded-2xl bg-[var(--brand-tertiary)]/10 px-4 py-3 text-sm text-[var(--brand-tertiary)] mb-4 font-semibold">
                    You receive ≈ <strong>{fmt(quote)} KAS</strong>
                    <span className="text-[var(--text-3)] ml-2 font-normal">(0.3% fee included)</span>
                  </div>
                )}
                <button
                  onClick={handleSell}
                  disabled={loading || !isAuthenticated}
                  className="w-full rounded-full bg-[var(--brand-tertiary)] hover:opacity-90 disabled:opacity-40 text-white font-bold text-xl py-3 transition"
                >
                  {loading ? "Processing…" : "Sell $GEEK →"}
                </button>
              </div>
            )}

            {/* Trade Sticker */}
            {tab === "sticker" && (
              <div className="soft-card p-6">
                <div className="badge-pill text-[var(--brand-accent)] mb-4">Trade Sticker for GEEK</div>
                {!isAuthenticated ? (
                  <p className="text-sm text-[var(--text-3)]">Sign in to trade stickers.</p>
                ) : userStickers.length === 0 ? (
                  <p className="text-sm text-[var(--text-3)]">You have no stickers to trade. Earn them by completing quizzes!</p>
                ) : (
                  <>
                    <p className="text-xs text-[var(--text-3)] mb-4">Select a sticker to exchange for $GEEK at its rarity value.</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-5 max-h-64 overflow-y-auto pr-1">
                      {userStickers.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSticker(selectedSticker?.id === s.id ? null : s)}
                          className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition text-center ${
                            selectedSticker?.id === s.id
                              ? "bg-[var(--brand-accent)]/15 ring-2 ring-[var(--brand-accent)]"
                              : "bg-[var(--surface-2)] hover:bg-[var(--surface-3)]"
                          }`}
                        >
                          <span className="text-2xl">{s.emoji}</span>
                          <span className="text-[9px] text-[var(--text-2)] leading-tight font-semibold">{s.name}</span>
                          <span className={`text-[9px] font-semibold ${RARITY_COLOR[s.rarity] ?? "text-[var(--text-3)]"}`}>{s.geekValue} GEEK</span>
                          {s.count > 1 && <span className="text-[8px] text-[var(--brand-primary)] font-semibold">×{s.count}</span>}
                        </button>
                      ))}
                    </div>
                    {selectedSticker && (
                      <div className="rounded-2xl bg-[var(--brand-accent)]/10 px-4 py-3 text-sm text-[var(--brand-accent)] mb-4 font-semibold">
                        Trading <strong>{selectedSticker.emoji} {selectedSticker.name}</strong> for <strong>{fmt(selectedSticker.geekValue)} $GEEK</strong>
                      </div>
                    )}
                    <button
                      onClick={handleTradeSticker}
                      disabled={loading || !selectedSticker}
                      className="w-full rounded-full bg-[var(--brand-accent)] hover:opacity-90 disabled:opacity-40 text-white font-bold text-xl py-3 transition"
                    >
                      {loading ? "Processing…" : "Trade Sticker →"}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Add Liquidity */}
            {tab === "liquidity" && (
              <div className="soft-card p-6">
                <div className="badge-pill text-[var(--brand-primary)] mb-4">Add Liquidity</div>
                <p className="text-xs text-[var(--text-3)] mb-4">
                  Provide KAS + matching GEEK to the pool. Earn a share of all 0.3% swap fees proportional to your LP shares.
                </p>
                {pool && (
                  <div className="text-xs text-[var(--text-3)] mb-4">
                    Current ratio: 1 KAS = {fmt(pool.spotPrice)} GEEK
                  </div>
                )}
                <label className="text-xs text-[var(--text-2)] font-semibold block mb-1">KAS to Add</label>
                <input
                  type="number" min="0" step="any"
                  value={kasInput}
                  onChange={(e) => setKasInput(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full rounded-full bg-[var(--surface-2)] border border-transparent focus:border-[var(--brand-primary)] outline-none px-4 py-3 text-sm text-[var(--text-1)] mb-2 transition"
                />
                {pool && kasInput && parseFloat(kasInput) > 0 && (
                  <div className="text-xs text-[var(--text-3)] mb-4">
                    Also requires ≈ <strong className="text-[var(--brand-primary)]">{fmt(parseFloat(kasInput) * pool.spotPrice)} $GEEK</strong> from your balance
                  </div>
                )}
                <button
                  onClick={handleAddLiquidity}
                  disabled={loading || !isAuthenticated}
                  className="pill-btn pill-btn-primary w-full disabled:opacity-40 text-xl py-3"
                >
                  {loading ? "Processing…" : "Add Liquidity →"}
                </button>
              </div>
            )}
          </div>

          {/* Right: Live order book */}
          <div className="soft-card p-5">
            <div className="text-[10px] tracking-widest text-[var(--brand-accent)] font-bold uppercase mb-3 flex items-center gap-2">
              Live Trades
              <span className="w-1.5 h-1.5 bg-[var(--brand-secondary)] rounded-full animate-pulse" />
            </div>
            <div className="font-extrabold text-lg text-[var(--text-1)] mb-3">Recent Trades</div>
            {pool && pool.recentTrades.length > 0 ? (
              <div className="space-y-0">
                {pool.recentTrades.map((t) => <TradeRow key={t.id} trade={t} />)}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-3)]">No trades yet. Be the first!</p>
            )}

            {/* Pool depth visual */}
            {pool && (
              <div className="mt-6">
                <div className="text-[10px] tracking-widest text-[var(--text-3)] mb-2 font-semibold uppercase">Pool Depth</div>
                <div className="flex h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-[var(--brand-secondary)] transition-all duration-700"
                    style={{ width: `${(pool.kasReserve / (pool.kasReserve + pool.geekReserve / pool.spotPrice)) * 100}%` }}
                  />
                  <div className="bg-[var(--brand-primary)] flex-1" />
                </div>
                <div className="flex justify-between text-[9px] text-[var(--text-3)] mt-1 font-semibold">
                  <span>🟢 KAS</span>
                  <span>🔵 GEEK</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info row */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <div className="soft-card p-5">
            <div className="badge-pill text-[var(--brand-accent)] mb-3">How It Works</div>
            <div className="space-y-2 text-xs text-[var(--text-2)] font-medium">
              <div>📈 AMM constant-product formula (x·y=k)</div>
              <div>💸 0.3% swap fee goes to LP providers</div>
              <div>🎴 Stickers trade at fixed rarity value</div>
              <div>💧 Add liquidity to earn fee revenue</div>
            </div>
          </div>
          <div className="soft-card p-5">
            <div className="badge-pill text-[var(--brand-accent)] mb-3">Sticker Values</div>
            <div className="space-y-1.5">
              {Object.entries(RARITY_GEEK).map(([r, v]) => (
                <div key={r} className="flex justify-between text-xs font-semibold">
                  <span className={RARITY_COLOR[r] ?? "text-[var(--text-3)]"}>{r}</span>
                  <span className="text-[var(--brand-accent)]">{v} $GEEK</span>
                </div>
              ))}
            </div>
          </div>
          <div className="soft-card p-5">
            <div className="badge-pill text-[var(--brand-accent)] mb-3">Earn GEEK</div>
            <div className="space-y-2 text-xs text-[var(--text-2)] font-medium">
              <div>🎮 Complete quiz runs</div>
              <div>⚔️ Finish Gauntlet rounds</div>
              <div>🔥 Daily streak bonuses</div>
              <div>🎴 Trade duplicate stickers</div>
              <div>💧 Provide pool liquidity</div>
            </div>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}
