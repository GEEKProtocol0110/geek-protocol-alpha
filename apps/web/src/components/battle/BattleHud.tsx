"use client";

/**
 * Top HUD — both nameplates, the question counter, streak and score.
 *
 * Everything the player needs to read mid-fight without leaving the arena.
 */

import HpBar from "./HpBar";
import type { BattleState } from "@/lib/battle/types";
import { SPECIAL_THRESHOLD } from "@/lib/battle/combat";

interface Props {
  state: BattleState;
  playerHit: boolean;
  bossHit: boolean;
  /** Remounts the combo badge so its CSS kick replays on every change. */
  comboKey: number;
}

export default function BattleHud({ state, playerHit, bossHit, comboKey }: Props) {
  const { fighter, boss } = state;
  const bossPct = Math.max(0, Math.round((state.bossHp / boss.maxHp) * 100));

  return (
    <div className="w-full">
      <div className="flex items-start gap-3 sm:gap-6">
        {/* ── Player plate ── */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span
              className="gp-arcade truncate text-sm sm:text-lg"
              style={{ color: fighter.color }}
            >
              {fighter.name}
            </span>
            <span className="gp-pixel shrink-0 text-[9px] sm:text-[10px] text-[var(--text-3)]">
              LV.{String(boss.level).padStart(2, "0")}
            </span>
          </div>
          <div className="mt-1">
            <HpBar
              current={state.playerHp}
              max={state.playerMaxHp}
              color={fighter.color}
              shaking={playerHit}
            />
          </div>
          <div className="gp-pixel mt-1 text-[9px] sm:text-[10px] text-[var(--text-2)]">
            {Math.max(0, Math.round(state.playerHp))} / {state.playerMaxHp} HP
          </div>
        </div>

        {/* ── Question counter ── */}
        <div className="shrink-0 text-center">
          <div
            className="gp-arcade border-2 px-2 py-1 text-base leading-none sm:px-4 sm:py-2 sm:text-2xl"
            style={{
              borderColor: "var(--ink)",
              background: "var(--surface-2)",
              boxShadow: "var(--shadow-hard-sm)",
              color: "var(--gp-white)",
            }}
          >
            {String(state.questionIndex + 1).padStart(2, "0")}
            <span className="text-[var(--text-3)]">/{state.questions.length}</span>
          </div>
          <div className="gp-pixel mt-1 text-[8px] text-[var(--text-3)]">QUESTION</div>
        </div>

        {/* ── Boss plate ── */}
        <div className="min-w-0 flex-1 text-right">
          <div className="flex items-baseline justify-end gap-2">
            <span className="gp-pixel shrink-0 text-[9px] sm:text-[10px] text-[var(--text-3)]">
              LV.{String(boss.level + 1).padStart(2, "0")}
            </span>
            <span className="gp-arcade truncate text-sm sm:text-lg" style={{ color: boss.color }}>
              {boss.name}
            </span>
          </div>
          <div className="mt-1">
            <HpBar
              current={state.bossHp}
              max={boss.maxHp}
              color={boss.color}
              align="right"
              shaking={bossHit}
            />
          </div>
          <div className="gp-pixel mt-1 text-[9px] sm:text-[10px] text-[var(--text-2)]">
            {bossPct}% · {Math.max(0, Math.round(state.bossHp))} HP
          </div>
        </div>
      </div>

      {/* ── Streak / special / score strip ── */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            key={comboKey}
            className={`gp-arcade border-2 px-2 py-1 text-xs sm:text-sm ${
              state.combo > 0 ? "bf-combo-pop" : ""
            }`}
            style={{
              borderColor: "var(--ink)",
              background: state.combo > 0 ? "var(--gp-pink)" : "var(--surface-2)",
              color: state.combo > 0 ? "var(--ink)" : "var(--text-3)",
              boxShadow: "var(--shadow-hard-sm)",
            }}
          >
            COMBO ×{state.combo}
          </span>

          {/* Special meter — five pips, one per consecutive correct answer. */}
          <div className="flex items-center gap-1">
            {Array.from({ length: SPECIAL_THRESHOLD }, (_, i) => (
              <span
                key={i}
                className={`h-3 w-3 border-2 ${
                  state.specialReady ? "bf-charged" : ""
                }`}
                style={{
                  borderColor: "var(--ink)",
                  background:
                    i < state.specialCharge ? "var(--gp-gold)" : "var(--surface-3)",
                }}
              />
            ))}
            {state.specialReady && (
              <span className="gp-pixel bf-charged ml-1 text-[9px] text-[var(--gp-gold)]">
                SPECIAL READY
              </span>
            )}
          </div>
        </div>

        <div className="gp-pixel flex items-center gap-3 text-[9px] sm:text-[10px]">
          <span style={{ color: "var(--gp-cyan)" }}>{state.xp} XP</span>
          <span style={{ color: "var(--gp-violet)" }}>{state.skillPoints} SP</span>
          <span style={{ color: "var(--gp-gold)" }}>{state.coins} ⬢</span>
        </div>
      </div>
    </div>
  );
}
