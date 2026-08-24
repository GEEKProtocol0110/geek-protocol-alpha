"use client";

/**
 * Level intro. Names the boss, states the stakes, and teaches the one rule the
 * player needs before the first question.
 */

import { Starfield } from "@/components/Starfield";
import BossSprite from "./BossSprite";
import FighterSprite from "./FighterSprite";
import type { BattleState } from "@/lib/battle/types";

export default function LevelIntro({
  state,
  onBegin,
}: {
  state: BattleState;
  onBegin: () => void;
}) {
  const { fighter, boss } = state;

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
      style={{ background: "var(--surface-0)" }}
    >
      <Starfield />
      <div className="gp-dot-grid" aria-hidden />

      <div className="bf-card-in relative w-full max-w-2xl text-center">
        <div className="gp-pixel text-[10px] text-[var(--gp-cyan)]">
          LEVEL {String(boss.level).padStart(2, "0")}
        </div>

        <div className="mt-6 flex items-end justify-center gap-4 sm:gap-10">
          <div className="bf-idle">
            <FighterSprite
              id={fighter.id}
              color={fighter.color}
              colorDark={fighter.colorDark}
              className="h-24 w-auto sm:h-36"
            />
          </div>
          <div
            className="gp-arcade pb-6 text-2xl sm:text-4xl"
            style={{ color: "var(--gp-danger)" }}
          >
            VS
          </div>
          <div className="bf-idle-slow">
            <BossSprite
              bossId={boss.id}
              color={boss.color}
              colorDark={boss.colorDark}
              className="h-28 w-auto sm:h-44"
            />
          </div>
        </div>

        <h1
          className="gp-arcade mt-6 text-3xl sm:text-5xl"
          style={{
            color: "var(--gp-white)",
            textShadow: `4px 4px 0 ${boss.colorDark}, 8px 8px 0 var(--ink)`,
          }}
        >
          {boss.name}
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm italic text-[var(--text-2)] sm:text-base">
          “{boss.taunt}”
        </p>

        <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-2">
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
          autoFocus
          className="gp-arcade mt-8 border-2 px-10 py-4 text-xl transition-transform hover:-translate-y-[2px] active:translate-y-[1px]"
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
