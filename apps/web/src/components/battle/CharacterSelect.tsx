"use client";

/**
 * Fighter select.
 *
 * Deliberately framed as picking a combatant, not an avatar: the roster reads
 * as a lineup, the preview idles and posts stats, and the commit button is
 * phrased as entering a fight.
 */

import { useState } from "react";
import { Starfield } from "@/components/Starfield";
import FighterSprite from "./FighterSprite";
import { FIGHTERS } from "@/lib/battle/roster";
import { playerMaxHp } from "@/lib/battle/combat";
import type { Fighter, Rarity } from "@/lib/battle/types";

const RARITY_COLOR: Record<Rarity, string> = {
  common: "var(--gp-slate)",
  rare: "var(--gp-cyan)",
  epic: "var(--gp-violet)",
  legendary: "var(--gp-gold)",
};

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="gp-pixel w-14 shrink-0 text-[9px] text-[var(--text-3)]">{label}</span>
      <div
        className="h-3 flex-1 border-2"
        style={{ borderColor: "var(--ink)", background: "var(--surface-3)" }}
      >
        <div className="h-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="gp-pixel w-6 text-right text-[9px] text-[var(--text-2)]">{value}</span>
    </div>
  );
}

export default function CharacterSelect({ onSelect }: { onSelect: (f: Fighter) => void }) {
  const [active, setActive] = useState<Fighter>(FIGHTERS[0]);

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--surface-0)" }}>
      <Starfield />
      <div className="gp-dot-grid" aria-hidden />

      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <div className="text-center">
          <div className="gp-pixel mb-2 text-[10px] text-[var(--gp-cyan)]">SPACE FIGHTER PROTOCOL</div>
          <h1
            className="gp-arcade text-3xl sm:text-5xl"
            style={{
              color: "var(--gp-white)",
              textShadow: "4px 4px 0 var(--gp-cyan-dark), 8px 8px 0 var(--ink)",
            }}
          >
            CHOOSE YOUR FIGHTER
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm text-[var(--text-2)] sm:text-base">
            Your answers are the controls. Correct hits, fast hits harder, wrong
            gives the boss an opening.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* ── Roster ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:order-2 lg:grid-cols-2">
            {FIGHTERS.map((f) => {
              const selected = f.id === active.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActive(f)}
                  className="border-2 p-3 text-center transition-transform hover:-translate-y-1"
                  style={{
                    borderColor: selected ? f.color : "var(--ink)",
                    background: selected ? "var(--surface-3)" : "var(--surface-1)",
                    boxShadow: selected ? `6px 6px 0 0 ${f.colorDark}` : "var(--shadow-hard-sm)",
                  }}
                  aria-pressed={selected}
                >
                  <FighterSprite
                    id={f.id}
                    color={f.color}
                    colorDark={f.colorDark}
                    className="mx-auto h-20 w-auto sm:h-24"
                  />
                  <div className="gp-arcade mt-2 text-xs sm:text-sm" style={{ color: f.color }}>
                    {f.name}
                  </div>
                  <div
                    className="gp-pixel mt-1 text-[8px]"
                    style={{ color: RARITY_COLOR[f.rarity] }}
                  >
                    {f.rarity.toUpperCase()}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Preview ── */}
          <div
            className="border-2 p-5 lg:order-1"
            style={{
              borderColor: "var(--ink)",
              background: "var(--surface-1)",
              boxShadow: "var(--shadow-hard)",
            }}
          >
            <div className="flex items-start gap-4">
              <div className="bf-idle shrink-0">
                <FighterSprite
                  id={active.id}
                  color={active.color}
                  colorDark={active.colorDark}
                  className="h-32 w-auto sm:h-40"
                />
              </div>
              <div className="min-w-0">
                <h2 className="gp-arcade text-2xl sm:text-3xl" style={{ color: active.color }}>
                  {active.name}
                </h2>
                <div className="gp-pixel mt-1 text-[9px] text-[var(--text-3)]">{active.title}</div>
                <div
                  className="gp-pixel mt-2 inline-block border-2 px-2 py-1 text-[8px]"
                  style={{
                    borderColor: "var(--ink)",
                    background: RARITY_COLOR[active.rarity],
                    color: "var(--ink)",
                  }}
                >
                  {active.rarity.toUpperCase()}
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-[var(--text-2)]">
              {active.description}
            </p>

            <div className="mt-5 space-y-2">
              <StatRow label="ATTACK" value={active.stats.attack} color="var(--gp-danger)" />
              <StatRow label="DEFENSE" value={active.stats.defense} color="var(--gp-cyan)" />
              <StatRow label="SPEED" value={active.stats.speed} color="var(--gp-success)" />
              <StatRow label="CRIT" value={active.stats.critical} color="var(--gp-gold)" />
            </div>

            <div className="mt-4 flex items-center justify-between border-2 px-3 py-2"
              style={{ borderColor: "var(--gp-outline)", background: "var(--surface-2)" }}>
              <span className="gp-pixel text-[9px] text-[var(--text-3)]">HULL</span>
              <span className="gp-arcade text-lg" style={{ color: active.color }}>
                {playerMaxHp(active)} HP
              </span>
            </div>

            <div className="mt-3 border-2 px-3 py-2"
              style={{ borderColor: "var(--gp-gold)", background: "var(--surface-2)" }}>
              <span className="gp-pixel text-[9px] text-[var(--gp-gold)]">SPECIAL</span>
              <div className="gp-arcade text-sm" style={{ color: "var(--gp-white)" }}>
                {active.specialName}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelect(active)}
              className="gp-arcade mt-5 w-full border-2 px-6 py-4 text-lg transition-transform hover:-translate-y-[2px] active:translate-y-[1px]"
              style={{
                borderColor: "var(--ink)",
                background: active.color,
                color: "var(--ink)",
                boxShadow: `6px 6px 0 0 ${active.colorDark}`,
              }}
            >
              SELECT FIGHTER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
