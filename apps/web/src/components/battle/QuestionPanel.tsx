"use client";

/**
 * The controller.
 *
 * Readability is the hard constraint here: whatever is exploding above, the
 * prompt and the four options stay high-contrast, large-target and stable.
 * The panel never moves position between questions.
 */

import { memo } from "react";
import { QUESTION_MS } from "@/lib/battle/combat";
import TimerBar from "./TimerBar";
import type { Question } from "@/lib/battle/types";

interface Props {
  question: Question;
  /** Restarts the clock and replays the entry animation. */
  questionKey: number;
  /** True for the final beat before the next question, to play the exit. */
  leaving?: boolean;
  /** Cuts the post-answer hold short. */
  onSkip?: () => void;
  /** null while the player is still deciding. */
  pickedIndex: number | null;
  revealed: boolean;
  /**
   * The right answer, supplied by whoever knows it. In the prototype that is
   * the local bank; in the daily quiz it arrives from the server only after
   * the pick is committed, so it cannot be read off the question object.
   * null means "not known yet" — nothing is marked correct.
   */
  correctIndex: number | null;
  /** Shown under a wrong answer. Falls back to the question's own text. */
  explanation?: string | null;
  /** True between the pick and the server's verdict. */
  pending?: boolean;
  /**
   * Replaces the plain-text prompt. The daily quiz passes a canvas renderer so
   * the question text is not scrapeable DOM — dropping to a bare <h2> here
   * would quietly undo that.
   */
  promptSlot?: React.ReactNode;
  onPick: (index: number) => void;
}

const KEYS = ["A", "B", "C", "D"];

function QuestionPanel({
  question,
  questionKey,
  leaving = false,
  onSkip,
  pickedIndex,
  revealed,
  correctIndex,
  explanation,
  pending = false,
  promptSlot,
  onPick,
}: Props) {
  return (
    <div
      className="bf-panel-box w-full border-2 p-2.5 sm:p-5"
      style={{
        borderColor: "var(--ink)",
        background: "var(--surface-1)",
        boxShadow: "var(--shadow-hard)",
      }}
    >
      <TimerBar durationMs={QUESTION_MS} runKey={questionKey} paused={revealed || pending} />

      <div key={questionKey} className={leaving ? "bf-q-exit" : "bf-q-enter"}>
      {!promptSlot && (
        <div className="gp-pixel mb-2 text-[9px] text-[var(--text-3)]">{question.category}</div>
      )}

      {promptSlot ?? (
        <h2
          className="bf-panel-prompt mb-3 text-base font-bold leading-snug text-[var(--text-1)] sm:mb-4 sm:text-2xl"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          {question.prompt}
        </h2>
      )}

      <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-2">
        {question.options.map((option, i) => {
          const isCorrect = correctIndex !== null && i === correctIndex;
          const isPicked = i === pickedIndex;

          // Before the reveal every option looks identical — no tell.
          let background = "var(--surface-2)";
          let color = "var(--text-1)";
          let borderColor = "var(--ink)";

          if (pending && isPicked) {
            background = "var(--surface-3)";
            borderColor = "var(--gp-cyan)";
          }

          if (revealed) {
            if (isCorrect) {
              background = "var(--gp-success)";
              color = "var(--ink)";
            } else if (isPicked) {
              background = "var(--gp-danger)";
              color = "var(--ink)";
            } else {
              background = "var(--surface-1)";
              color = "var(--text-3)";
              borderColor = "var(--gp-outline)";
            }
          }

          return (
            <button
              key={i}
              type="button"
              disabled={revealed || pending}
              onClick={() => onPick(i)}
              className="bf-panel-option flex min-h-[44px] items-center gap-2 border-2 px-2.5 py-2.5 text-left transition-transform disabled:cursor-default sm:gap-3 sm:px-3 sm:py-4 enabled:hover:-translate-y-[2px] enabled:active:translate-y-[1px]"
              style={{
                background,
                color,
                borderColor,
                boxShadow: revealed && !isCorrect && !isPicked ? "none" : "var(--shadow-hard-sm)",
              }}
            >
              <span
                className="gp-arcade flex h-6 w-6 shrink-0 items-center justify-center border-2 text-[10px] sm:h-7 sm:w-7 sm:text-xs"
                style={{
                  borderColor: "var(--ink)",
                  background: revealed && (isCorrect || isPicked) ? "var(--ink)" : "var(--surface-3)",
                  color: revealed && (isCorrect || isPicked) ? "var(--gp-white)" : "var(--text-2)",
                }}
              >
                {KEYS[i]}
              </span>
              <span className="text-[13px] font-semibold leading-tight sm:text-base">{option}</span>
            </button>
          );
        })}
      </div>

      {revealed && onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="mt-2 flex w-full items-center justify-center gap-2 border-2 px-3 py-2 text-left transition-transform hover:-translate-y-[1px] active:translate-y-[1px]"
          style={{
            borderColor: "var(--ink)",
            background: "var(--surface-2)",
            color: "var(--text-2)",
            boxShadow: "var(--shadow-hard-sm)",
          }}
        >
          <span className="gp-pixel text-[8px] sm:text-[9px]">NEXT QUESTION</span>
          <span className="gp-arcade text-xs" style={{ color: "var(--gp-cyan)" }}>→</span>
        </button>
      )}

      {/* A miss has to teach something, or the loop is just punishment. */}
      {revealed && correctIndex !== null && pickedIndex !== correctIndex && (
        <div
          className="bf-row-in mt-3 border-2 px-3 py-2"
          style={{
            borderColor: "var(--gp-danger)",
            background: "var(--surface-2)",
          }}
        >
          <div className="gp-pixel mb-1 text-[9px]" style={{ color: "var(--gp-danger)" }}>
            {pickedIndex === null ? "OUT OF TIME" : "INCORRECT"}
          </div>
          <p className="text-sm leading-snug text-[var(--text-2)]">
            {explanation ?? question.explanation}
          </p>
        </div>
      )}
      </div>
    </div>
  );
}

export default memo(QuestionPanel);
