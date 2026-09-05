"use client";

/**
 * Level intro. Names the boss, states the stakes, and teaches the one rule the
 * player needs before the first question.
 */

import { useEffect } from "react";
import Image from "next/image";
import { Starfield } from "@/components/Starfield";
import { PORTRAITS } from "@/lib/battle/sprites";
import type { BattleState } from "@/lib/battle/types";

export default function LevelIntro({
  state,
  onBegin,
}: {
  state: BattleState;
  onBegin: () => void;
}) {
  const { fighter, boss } = state;

  // Moving to a new screen should start at the top of it. Without this the
  // scroll position from the roster carried over, and on a short screen the
  // intro opened part-way down with the fighters cut off above the fold.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    // `min-h-screen` rather than a fixed height with `overflow-hidden`: the
    // container grows past the viewport on a phone held sideways, so the page
    // scrolls instead of the card losing its head off the top.
    <div
      className="relative flex min-h-screen items-center justify-center px-4 py-6"
      style={{ background: "var(--surface-0)" }}
    >
      <Starfield />
      <div className="gp-dot-grid" aria-hidden />

      <div className="bf-card-in relative w-full max-w-2xl text-center">
        <div className="gp-pixel text-[10px] text-[var(--gp-cyan)]">
          LEVEL {String(boss.level).padStart(2, "0")}
        </div>

        <div className="bf-intro-row mt-4 flex items-end justify-center gap-3 sm:mt-6 sm:gap-10">
          <div className="bf-sprite-idle">
            <Image
              src={PORTRAITS.giga}
              alt={fighter.name}
              width={220}
              height={300}
              unoptimized
              className="bf-intro-sprite h-20 w-auto sm:h-44"
            />
          </div>
          <div
            className="bf-intro-vs gp-arcade pb-6 text-2xl sm:text-4xl"
            style={{ color: "var(--gp-danger)" }}
          >
            VS
          </div>
          <div className="bf-sprite-idle" style={{ animationDelay: "0.6s" }}>
            <Image
              src={PORTRAITS.wraith}
              alt={boss.name}
              width={240}
              height={300}
              unoptimized
              className="bf-intro-boss h-24 w-auto sm:h-52"
            />
          </div>
        </div>

        <h1
          className="bf-intro-title gp-arcade mt-4 text-2xl sm:mt-6 sm:text-5xl"
          style={{
            color: "var(--gp-white)",
            textShadow: `4px 4px 0 ${boss.colorDark}, 8px 8px 0 var(--ink)`,
          }}
        >
          {boss.name}
        </h1>

        <p className="bf-intro-taunt mx-auto mt-3 max-w-md text-xs italic text-[var(--text-2)] sm:mt-4 sm:text-base">
          “{boss.taunt}”
        </p>

        <div className="bf-intro-rules mx-auto mt-4 grid max-w-md grid-cols-3 gap-2 sm:mt-6">
          {[
            { k: "CORRECT", v: "YOU STRIKE", c: "var(--gp-success)" },
            { k: "FAST", v: "HIT HARDER", c: "var(--gp-gold)" },
            { k: "WRONG", v: "IT STRIKES", c: "var(--gp-danger)" },
          ].map((r) => (
            <div
              key={r.k}
              className="border-2 px-2 py-2"
              style={{ borderColor: "var(--ink)", background: "var(--surface-1)" }}
            >
              <div className="gp-pixel text-[8px]" style={{ color: r.c }}>
                {r.k}
              </div>
              <div className="gp-arcade mt-1 text-[10px] text-[var(--text-1)] sm:text-xs">
                {r.v}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onBegin}
          className="bf-intro-cta gp-arcade mt-6 border-2 px-8 py-3 text-lg transition-transform hover:-translate-y-[2px] active:translate-y-[1px] sm:mt-8 sm:px-10 sm:py-4 sm:text-xl"
          style={{
            borderColor: "var(--ink)",
            background: fighter.color,
            color: "var(--ink)",
            boxShadow: `8px 8px 0 0 ${fighter.colorDark}`,
          }}
        >
          ENGAGE
        </button>
      </div>
    </div>
  );
}
