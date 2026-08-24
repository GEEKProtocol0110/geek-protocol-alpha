"use client";

/**
 * Victory and defeat.
 *
 * Defeat deliberately shares the same layout and the same reward rows as
 * victory — you always leave with XP and a readable reason you lost. Losing
 * should read as "one more run", never as a wall.
 */

import FighterSprite from "./FighterSprite";
import BossSprite from "./BossSprite";
import type { BattleState } from "@/lib/battle/types";
import { battleSummary } from "@/lib/battle/engine";
import { BOSSES } from "@/lib/battle/roster";

interface Props {
  state: BattleState;
  onNext: () => void;
  onReplay: () => void;
  onRoster: () => void;
}

function Row({ label, value, color, delay }: { label: string; value: string; color: string; delay: number }) {
  return (
    <div
      className="bf-row-in flex items-center justify-between border-2 px-3 py-2"
      style={{
        borderColor: "var(--gp-outline)",
        background: "var(--surface-2)",
        animationDelay: `${delay}ms`,
      }}
    >
      <span className="gp-pixel text-[9px] text-[var(--text-3)]">{label}</span>
      <span className="gp-arcade text-base sm:text-lg" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

export default function ResultScreen({ state, onNext, onReplay, onRoster }: Props) {
  const s = battleSummary(state);
  const won = state.phase === "victory";
  const hasNextLevel = state.boss.level < BOSSES.length;
  const accent = won ? "var(--gp-cyan)" : "var(--gp-danger)";

  // The one line that tells the player what to fix.
  const advice = !won
    ? s.accuracy < 50
      ? "Accuracy is the bottleneck — a wrong answer is a free hit for the boss."
      : s.bestCombo < 3
        ? "You know the material. Chain answers without a miss to unlock your special."
        : "Close run. Answer faster on the ones you already know to raise your damage tier."
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
      style={{ background: "rgba(5, 5, 11, 0.92)" }}
    >
      <div
        className="bf-card-in w-full max-w-lg border-2 p-5 sm:p-7"
        style={{
          borderColor: "var(--ink)",
          background: "var(--surface-1)",
          boxShadow: `10px 10px 0 0 ${won ? "var(--gp-cyan-dark)" : "var(--gp-danger-dark)"}`,
        }}
      >
        <div className="text-center">
          <div className={won ? "bf-idle" : "bf-ko"} style={{ display: "inline-block" }}>
            {won ? (
              <FighterSprite
                id={state.fighter.id}
                color={state.fighter.color}
                colorDark={state.fighter.colorDark}
                className="mx-auto h-24 w-auto sm:h-28"
              />
            ) : (
              <BossSprite
                bossId={state.boss.id}
                color={state.boss.color}
                colorDark={state.boss.colorDark}
                className="mx-auto h-24 w-auto sm:h-28"
              />
            )}
          </div>

          <h2
            className="gp-arcade mt-3 text-4xl sm:text-5xl"
            style={{
              color: "var(--gp-white)",
              textShadow: `4px 4px 0 ${won ? "var(--gp-cyan-dark)" : "var(--gp-danger-dark)"}, 8px 8px 0 var(--ink)`,
            }}
          >
            {won ? "VICTORY" : "DEFEATED"}
          </h2>
          <div className="gp-pixel mt-2 text-[10px]" style={{ color: accent }}>
            {won ? `${state.boss.name} DESTROYED` : `${state.boss.name} WINS`}
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <Row label="XP EARNED" value={`+${s.xp}`} color="var(--gp-cyan)" delay={0} />
          <Row label="SKILL POINTS" value={`+${s.skillPoints}`} color="var(--gp-violet)" delay={70} />
          <Row label="COINS" value={`+${s.coins}`} color="var(--gp-gold)" delay={140} />
          <Row
            label="CORRECT"
            value={`${s.correct}/${s.answered}`}
            color="var(--gp-white)"
            delay={210}
          />
          <Row label="ACCURACY" value={`${s.accuracy}%`} color="var(--gp-white)" delay={280} />
          <Row
            label="FASTEST"
            value={s.fastestMs === null ? "—" : `${(s.fastestMs / 1000).toFixed(1)}s`}
            color="var(--gp-white)"
            delay={350}
          />
          <Row label="BEST COMBO" value={`×${s.bestCombo}`} color="var(--gp-pink)" delay={420} />
        </div>

        {advice && (
          <div
            className="bf-row-in mt-4 border-2 px-3 py-2"
            style={{
              borderColor: "var(--gp-gold)",
              background: "var(--surface-2)",
              animationDelay: "490ms",
            }}
          >
            <div className="gp-pixel mb-1 text-[9px]" style={{ color: "var(--gp-gold)" }}>
              NEXT RUN
            </div>
            <p className="text-sm leading-snug text-[var(--text-2)]">{advice}</p>
          </div>
        )}

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {won && hasNextLevel ? (
            <button
              type="button"
              onClick={onNext}
              className="gp-arcade border-2 px-4 py-3 text-base transition-transform hover:-translate-y-[2px] active:translate-y-[1px]"
              style={{
                borderColor: "var(--ink)",
                background: "var(--gp-cyan)",
                color: "var(--ink)",
                boxShadow: "var(--shadow-hard-cyan)",
              }}
            >
              NEXT LEVEL
            </button>
          ) : (
            <button
              type="button"
              onClick={onReplay}
              className="gp-arcade border-2 px-4 py-3 text-base transition-transform hover:-translate-y-[2px] active:translate-y-[1px]"
              style={{
                borderColor: "var(--ink)",
                background: won ? "var(--gp-gold)" : "var(--gp-cyan)",
                color: "var(--ink)",
                boxShadow: won ? "6px 6px 0 0 var(--gp-gold-dark)" : "var(--shadow-hard-cyan)",
              }}
            >
              {won ? "RUN IT BACK" : "TRY AGAIN"}
            </button>
          )}

          <button
            type="button"
            onClick={won && hasNextLevel ? onReplay : onRoster}
            className="gp-arcade border-2 px-4 py-3 text-base text-[var(--text-1)] transition-transform hover:-translate-y-[2px] active:translate-y-[1px]"
            style={{
              borderColor: "var(--ink)",
              background: "var(--surface-2)",
              boxShadow: "var(--shadow-hard-sm)",
            }}
          >
            {won && hasNextLevel ? "REPLAY" : "CHANGE FIGHTER"}
          </button>
        </div>
      </div>
    </div>
  );
}
