"use client";

import { useState } from "react";
import Link from "next/link";
import { useStickers } from "@/context/StickersContext";
import { STICKERS, RARITY_COLORS, RARITY_BADGE } from "@/lib/stickers";
import { type ExchangeListing } from "@/lib/stickers";

function timeLeft(expiresAt: number) {
  const ms = expiresAt - Date.now();
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function ExchangePage() {
  const { state, dispatch, ownsSticker } = useStickers();
  const [toast, setToast]       = useState<string | null>(null);
  const [offerModal, setOfferModal] = useState<ExchangeListing | null>(null);
  const [offerStickerId, setOfferStickerId] = useState("");
  const [listModal, setListModal] = useState(false);
  const [listStickerId, setListStickerId] = useState("");
  const [listPrice, setListPrice] = useState(10);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function buyListing(listingId: string) {
    const listing = state.listings.find((l) => l.id === listingId);
    if (!listing) return;
    if (state.geek < listing.askPrice) { showToast("Not enough GEEK!"); return; }
    dispatch({ type: "BUY_LISTING", listingId });
    showToast("✅ Purchase complete!");
  }

  function submitOffer() {
    if (!offerModal || !offerStickerId) return;
    dispatch({ type: "MAKE_OFFER", listingId: offerModal.id, from: "kaspa:you...local", stickerId: offerStickerId });
    showToast("Offer sent!");
    setOfferModal(null);
    setOfferStickerId("");
  }

  function createListing() {
    if (!listStickerId || listPrice <= 0) return;
    if (!ownsSticker(listStickerId)) { showToast("You don't own that sticker!"); return; }
    const listing: ExchangeListing = {
      id: `listing-${Date.now()}`,
      seller: "kaspa:you...local",
      stickerId: listStickerId,
      askPrice: listPrice,
      expiresAt: Date.now() + 72 * 3600 * 1000,
      offers: [],
    };
    dispatch({ type: "ADD_LISTING", listing });
    showToast("📋 Listing created!");
    setListModal(false);
    setListStickerId("");
    setListPrice(10);
  }

  const activeListings = state.listings.filter((l) => l.expiresAt > Date.now());
  const myStickers = state.owned.filter((o) => o.quantity >= 1);

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10 max-w-5xl mx-auto">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-cyan-900/90 border border-cyan-400/40 text-cyan-200 text-sm px-5 py-2.5 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      {/* Offer modal */}
      {offerModal && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center px-4">
          <div className="glass border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-4">Make an Offer</h3>
            <p className="text-white/50 text-sm mb-4">
              Offering for: {STICKERS.find((s) => s.id === offerModal.stickerId)?.emoji} {STICKERS.find((s) => s.id === offerModal.stickerId)?.name}
            </p>
            <label className="text-xs text-white/50 mb-1 block">Select sticker to offer:</label>
            <select
              value={offerStickerId}
              onChange={(e) => setOfferStickerId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-4"
            >
              <option value="">— Choose —</option>
              {myStickers.map((o) => {
                const s = STICKERS.find((st) => st.id === o.stickerId)!;
                return <option key={s.id} value={s.id}>{s.emoji} {s.name} ({s.rarity})</option>;
              })}
            </select>
            <div className="flex gap-3">
              <button onClick={submitOffer} disabled={!offerStickerId} className="flex-1 bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 rounded-lg py-2 text-sm font-medium hover:bg-cyan-400/30 disabled:opacity-40">
                Send Offer
              </button>
              <button onClick={() => setOfferModal(null)} className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2 text-sm text-white/60 hover:bg-white/10">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List modal */}
      {listModal && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center px-4">
          <div className="glass border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-4">Create Listing</h3>
            <label className="text-xs text-white/50 mb-1 block">Sticker to list:</label>
            <select
              value={listStickerId}
              onChange={(e) => setListStickerId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-4"
            >
              <option value="">— Choose —</option>
              {myStickers.map((o) => {
                const s = STICKERS.find((st) => st.id === o.stickerId)!;
                return <option key={s.id} value={s.id}>{s.emoji} {s.name} ({s.rarity})</option>;
              })}
            </select>
            <label className="text-xs text-white/50 mb-1 block">Ask price (GEEK):</label>
            <input
              type="number"
              min={1}
              value={listPrice}
              onChange={(e) => setListPrice(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-4"
            />
            <p className="text-xs text-white/30 mb-4">Listing expires in 72 hours.</p>
            <div className="flex gap-3">
              <button onClick={createListing} disabled={!listStickerId} className="flex-1 bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 rounded-lg py-2 text-sm font-medium hover:bg-cyan-400/30 disabled:opacity-40">
                List Sticker
              </button>
              <button onClick={() => setListModal(false)} className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2 text-sm text-white/60 hover:bg-white/10">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/stickers" className="text-cyan-400/60 text-sm hover:text-cyan-400 mb-1 inline-block">← Stickers Hub</Link>
          <h1 className="text-3xl font-bold text-cyan-400">🔄 Exchange</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-white/50 text-xs">GEEK</div>
            <div className="text-sm font-bold text-cyan-400">{state.geek.toLocaleString()}</div>
          </div>
          <button
            onClick={() => setListModal(true)}
            className="bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-cyan-400/30"
          >
            + Create Listing
          </button>
        </div>
      </div>

      {activeListings.length === 0 ? (
        <div className="text-center text-white/30 py-20">No active listings right now.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeListings.map((listing) => {
            const sticker = STICKERS.find((s) => s.id === listing.stickerId);
            if (!sticker) return null;
            const canBuy = state.geek >= listing.askPrice;
            const isMine = listing.seller === "kaspa:you...local";

            return (
              <div key={listing.id} className={`glass border rounded-xl p-4 flex flex-col ${RARITY_COLORS[sticker.rarity]}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-4xl">{sticker.emoji}</div>
                  <div>
                    <div className="font-semibold">{sticker.name}</div>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${RARITY_BADGE[sticker.rarity]}`}>{sticker.rarity}</span>
                  </div>
                </div>

                <div className="text-xs text-white/40 mb-1 truncate">Seller: {listing.seller}</div>
                <div className="text-xs text-white/40 mb-3">Expires: {timeLeft(listing.expiresAt)}</div>

                {listing.offers.length > 0 && (
                  <div className="text-xs text-white/30 mb-3">{listing.offers.length} offer(s) pending</div>
                )}

                <div className="mt-auto space-y-2">
                  {isMine ? (
                    <button
                      onClick={() => dispatch({ type: "REMOVE_LISTING", listingId: listing.id })}
                      className="w-full bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg py-1.5 text-sm hover:bg-red-500/20"
                    >
                      Cancel Listing
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => buyListing(listing.id)}
                        disabled={!canBuy}
                        className={`w-full rounded-lg py-1.5 text-sm font-medium transition-all ${
                          canBuy
                            ? "bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-400/30"
                            : "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
                        }`}
                      >
                        Buy — {listing.askPrice} GEEK
                      </button>
                      <button
                        onClick={() => setOfferModal(listing)}
                        className="w-full bg-purple-400/10 border border-purple-400/30 text-purple-300 rounded-lg py-1.5 text-sm hover:bg-purple-400/20"
                      >
                        Make Offer
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
