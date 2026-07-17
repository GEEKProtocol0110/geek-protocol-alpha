"use client";

import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import {
  type OwnedSticker, type Pack, type ExchangeListing, type PackType,
  SHOP_PRICES, CRAFT_COSTS, DUST_FROM_DUPE, STICKERS, openPack,
} from "@/lib/stickers";

export interface State {
  owned: OwnedSticker[];
  dust: number;
  geek: number;
  packs: Pack[];
  listings: ExchangeListing[];
  lastOpened: import("@/lib/stickers").Sticker[];
}

export type Action =
  | { type: "BUY_STICKER"; stickerId: string }
  | { type: "OPEN_PACK"; packType: PackType }
  | { type: "CRAFT_STICKER"; stickerId: string }
  | { type: "DUST_DUPES"; stickerId: string }
  | { type: "ADD_LISTING"; listing: ExchangeListing }
  | { type: "REMOVE_LISTING"; listingId: string }
  | { type: "BUY_LISTING"; listingId: string }
  | { type: "MAKE_OFFER"; listingId: string; from: string; stickerId: string }
  | { type: "ACCEPT_OFFER"; listingId: string; offerIndex: number }
  | { type: "CLEAR_LAST_OPENED" }
  | { type: "LOAD"; state: State };

const INITIAL: State = {
  owned: [],
  dust: 200,
  geek: 500,
  packs: [
    { id: "p1", type: "Standard",  quantity: 3 },
    { id: "p2", type: "Premium",   quantity: 1 },
    { id: "p3", type: "Legendary", quantity: 0 },
  ],
  listings: [
    {
      id: "listing-1",
      seller: "kaspa:qzdemo...aaa",
      stickerId: "s008",
      askPrice: 180,
      expiresAt: Date.now() + 72 * 3600 * 1000,
      offers: [],
    },
    {
      id: "listing-2",
      seller: "kaspa:qzdemo...bbb",
      stickerId: "s016",
      askPrice: 200,
      expiresAt: Date.now() + 48 * 3600 * 1000,
      offers: [],
    },
    {
      id: "listing-3",
      seller: "kaspa:qzdemo...ccc",
      stickerId: "s007",
      askPrice: 75,
      expiresAt: Date.now() + 60 * 3600 * 1000,
      offers: [],
    },
  ],
  lastOpened: [],
};

function addOwned(owned: OwnedSticker[], stickerId: string): OwnedSticker[] {
  const existing = owned.find((o) => o.stickerId === stickerId);
  if (existing) return owned.map((o) => o.stickerId === stickerId ? { ...o, quantity: o.quantity + 1 } : o);
  return [...owned, { stickerId, quantity: 1 }];
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOAD": return action.state;
    case "CLEAR_LAST_OPENED": return { ...state, lastOpened: [] };

    case "BUY_STICKER": {
      const sticker = STICKERS.find((s) => s.id === action.stickerId)!;
      const price = SHOP_PRICES[sticker.rarity];
      if (state.geek < price) return state;
      const isDupe = (state.owned.find((o) => o.stickerId === action.stickerId)?.quantity ?? 0) >= 1;
      return {
        ...state,
        geek: state.geek - price,
        dust: isDupe ? state.dust + DUST_FROM_DUPE[sticker.rarity] : state.dust,
        owned: addOwned(state.owned, action.stickerId),
      };
    }

    case "OPEN_PACK": {
      const pack = state.packs.find((p) => p.type === action.packType && p.quantity > 0);
      if (!pack) return state;
      const drawn = openPack(action.packType);
      let owned = state.owned;
      let dust = state.dust;
      for (const sticker of drawn) {
        const isDupe = (owned.find((o) => o.stickerId === sticker.id)?.quantity ?? 0) >= 1;
        if (isDupe) dust += DUST_FROM_DUPE[sticker.rarity];
        owned = addOwned(owned, sticker.id);
      }
      const packs = state.packs.map((p) =>
        p.type === action.packType ? { ...p, quantity: p.quantity - 1 } : p
      );
      return { ...state, owned, dust, packs, lastOpened: drawn };
    }

    case "CRAFT_STICKER": {
      const sticker = STICKERS.find((s) => s.id === action.stickerId)!;
      const cost = CRAFT_COSTS[sticker.rarity];
      if (state.dust < cost) return state;
      return { ...state, dust: state.dust - cost, owned: addOwned(state.owned, action.stickerId) };
    }

    case "DUST_DUPES": {
      const entry = state.owned.find((o) => o.stickerId === action.stickerId);
      if (!entry || entry.quantity < 2) return state;
      const sticker = STICKERS.find((s) => s.id === action.stickerId)!;
      const dupes = entry.quantity - 1;
      return {
        ...state,
        dust: state.dust + DUST_FROM_DUPE[sticker.rarity] * dupes,
        owned: state.owned.map((o) =>
          o.stickerId === action.stickerId ? { ...o, quantity: 1 } : o
        ),
      };
    }

    case "ADD_LISTING":
      return { ...state, listings: [action.listing, ...state.listings] };

    case "REMOVE_LISTING":
      return { ...state, listings: state.listings.filter((l) => l.id !== action.listingId) };

    case "BUY_LISTING": {
      const listing = state.listings.find((l) => l.id === action.listingId);
      if (!listing || state.geek < listing.askPrice) return state;
      return {
        ...state,
        geek: state.geek - listing.askPrice,
        owned: addOwned(state.owned, listing.stickerId),
        listings: state.listings.filter((l) => l.id !== action.listingId),
      };
    }

    case "MAKE_OFFER":
      return {
        ...state,
        listings: state.listings.map((l) =>
          l.id === action.listingId
            ? { ...l, offers: [...l.offers, { from: action.from, stickerId: action.stickerId }] }
            : l
        ),
      };

    case "ACCEPT_OFFER": {
      const listing = state.listings.find((l) => l.id === action.listingId);
      if (!listing) return state;
      const offer = listing.offers[action.offerIndex];
      if (!offer) return state;
      return {
        ...state,
        owned: addOwned(state.owned, offer.stickerId),
        listings: state.listings.filter((l) => l.id !== action.listingId),
      };
    }

    default: return state;
  }
}

interface CtxType {
  state: State;
  dispatch: React.Dispatch<Action>;
  ownsSticker: (id: string) => boolean;
  quantityOf: (id: string) => number;
  hasDupes: (id: string) => boolean;
  totalPacks: number;
}

const Ctx = createContext<CtxType | null>(null);

export function StickersProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("gp_stickers");
      if (saved) dispatch({ type: "LOAD", state: JSON.parse(saved) });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("gp_stickers", JSON.stringify(state));
    } catch {}
  }, [state]);

  const value = useMemo<CtxType>(() => ({
    state,
    dispatch,
    ownsSticker: (id) => (state.owned.find((o) => o.stickerId === id)?.quantity ?? 0) >= 1,
    quantityOf:  (id) => state.owned.find((o) => o.stickerId === id)?.quantity ?? 0,
    hasDupes:    (id) => (state.owned.find((o) => o.stickerId === id)?.quantity ?? 0) >= 2,
    totalPacks:  state.packs.reduce((a, p) => a + p.quantity, 0),
  }), [state]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStickers() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStickers must be used inside <StickersProvider />");
  return v;
}
