/**
 * The product principle, asserted.
 *
 * These tests exist to stop a future balance tweak quietly turning the game
 * into "a quiz with a fighting animation" — or into a fight where the stats
 * matter more than the answers.
 */

import { describe, expect, it } from "vitest";
import {
  COMBO_CAP,
  QUESTION_MS,
  comboMultiplier,
  playerMaxHp,
  resolveAnswer,
  speedTier,
} from "../combat";
import { battleReducer, createBattle } from "../engine";
import { FIGHTERS, getBoss, getFighter } from "../roster";
import { getQuestions } from "../questions";

const giga = getFighter("giga");
const boss = getBoss(1);
const noCrit = () => 0.999; // never rolls a crit
const alwaysCrit = () => 0;

describe("speed tiers", () => {
  it("rewards a fast answer with a higher tier", () => {
    expect(speedTier(QUESTION_MS * 0.9, 75)).toBe("critical");
    expect(speedTier(QUESTION_MS * 0.6, 75)).toBe("heavy");
    expect(speedTier(QUESTION_MS * 0.3, 75)).toBe("standard");
    expect(speedTier(QUESTION_MS * 0.1, 75)).toBe("light");
  });

  it("gives faster fighters wider windows", () => {
    // A moment that is only 'heavy' for slow Titan-X is 'critical' for Nova.
    const boundary = QUESTION_MS * 0.745;
    expect(speedTier(boundary, 45)).toBe("heavy");
    expect(speedTier(boundary, 95)).toBe("critical");
  });

  it("clamps out-of-range clocks", () => {
    expect(speedTier(-500, 75)).toBe("light");
    expect(speedTier(QUESTION_MS * 5, 75)).toBe("critical");
  });
});

describe("correctness is a gate, not a scalar", () => {
  it("never damages the boss on a wrong answer, however fast", () => {
    const r = resolveAnswer({
      correct: false,
      remainingMs: QUESTION_MS,
      fighter: giga,
      boss,
      combo: 8,
      specialReady: true,
      rng: alwaysCrit,
    });
    expect(r.target).toBe("player");
    expect(r.tier).toBe("miss");
  });

  it("always damages the boss on a correct answer, however slow", () => {
    const r = resolveAnswer({
      correct: true,
      remainingMs: 1,
      fighter: giga,
      boss,
      combo: 0,
      specialReady: false,
      rng: noCrit,
    });
    expect(r.target).toBe("boss");
    expect(r.damage).toBeGreaterThan(0);
  });

  it("scales damage monotonically with answer speed", () => {
    const at = (remainingMs: number) =>
      resolveAnswer({
        correct: true,
        remainingMs,
        fighter: giga,
        boss,
        combo: 0,
        specialReady: false,
        rng: noCrit,
      }).damage;

    const light = at(QUESTION_MS * 0.1);
    const standard = at(QUESTION_MS * 0.3);
    const heavy = at(QUESTION_MS * 0.6);
    const critical = at(QUESTION_MS * 0.9);

    expect(light).toBeLessThan(standard);
    expect(standard).toBeLessThan(heavy);
    expect(heavy).toBeLessThan(critical);
  });
});

describe("combo", () => {
  it("increases damage but stops scaling at the cap", () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(COMBO_CAP)).toBeGreaterThan(comboMultiplier(0));
    expect(comboMultiplier(COMBO_CAP + 50)).toBe(comboMultiplier(COMBO_CAP));
  });
});

describe("defense", () => {
  it("reduces incoming damage but never to zero", () => {
    const tank = resolveAnswer({
      correct: false, remainingMs: 0, fighter: getFighter("titan-x"),
      boss, combo: 0, specialReady: false, rng: noCrit,
    });
    const glass = resolveAnswer({
      correct: false, remainingMs: 0, fighter: getFighter("vex"),
      boss, combo: 0, specialReady: false, rng: noCrit,
    });
    expect(tank.damage).toBeGreaterThan(0);
    expect(tank.damage).toBeLessThan(glass.damage);
  });
});

describe("special attack", () => {
  it("multiplies damage and is labelled with the fighter's move", () => {
    const base = resolveAnswer({
      correct: true, remainingMs: QUESTION_MS * 0.9, fighter: giga,
      boss, combo: 0, specialReady: false, rng: noCrit,
    });
    const special = resolveAnswer({
      correct: true, remainingMs: QUESTION_MS * 0.9, fighter: giga,
      boss, combo: 0, specialReady: true, rng: noCrit,
    });
    expect(special.damage).toBeGreaterThan(base.damage);
    expect(special.label).toBe(giga.specialName);
  });
});

describe("battle loop", () => {
  const questions = getQuestions(1);

  function answerCorrectly(state: ReturnType<typeof createBattle>) {
    const q = state.questions[state.questionIndex];
    return battleReducer(state, {
      type: "ANSWER",
      index: q.correctIndex,
      remainingMs: QUESTION_MS * 0.9,
      rng: noCrit,
    });
  }

  it("arms the special within a level-1 battle, not after it is already over", () => {
    // Regression: with a flat 5-hit threshold the level-1 boss died first, so
    // the headline move could never be seen in a player's first fight.
    let s = battleReducer(createBattle(giga, 1), { type: "BEGIN" });
    let armed = false;
    for (let i = 0; i < questions.length; i++) {
      s = answerCorrectly(s);
      if (s.specialReady) armed = true;
      s = battleReducer(s, { type: "ADVANCE" });
      if (s.phase !== "question") break;
    }
    expect(armed).toBe(true);
  });

  it("consumes the charge when the special lands", () => {
    let s = battleReducer(createBattle(giga, 3), { type: "BEGIN" });
    while (s.phase === "question" && !s.specialReady) {
      s = answerCorrectly(s);
      s = battleReducer(s, { type: "ADVANCE" });
    }
    expect(s.specialReady).toBe(true);

    s = answerCorrectly(s);
    expect(s.lastResult?.special).toBe(true);
    expect(s.specialCharge).toBe(0);
    expect(s.specialReady).toBe(false);
  });

  it("charges faster on fast answers than slow ones", () => {
    const begin = () => battleReducer(createBattle(giga, 3), { type: "BEGIN" });
    const answerAt = (s: ReturnType<typeof createBattle>, remainingMs: number) =>
      battleReducer(s, {
        type: "ANSWER",
        index: s.questions[s.questionIndex].correctIndex,
        remainingMs,
        rng: noCrit,
      });

    expect(answerAt(begin(), QUESTION_MS * 0.9).specialCharge).toBeGreaterThan(
      answerAt(begin(), QUESTION_MS * 0.3).specialCharge
    );
  });

  it("resets the combo and damages the player on a wrong answer", () => {
    let s = battleReducer(createBattle(giga, 1), { type: "BEGIN" });
    s = answerCorrectly(s);
    s = battleReducer(s, { type: "ADVANCE" });
    expect(s.combo).toBe(1);

    const q = s.questions[s.questionIndex];
    const wrong = (q.correctIndex + 1) % q.options.length;
    s = battleReducer(s, { type: "ANSWER", index: wrong, remainingMs: 5000, rng: noCrit });

    expect(s.combo).toBe(0);
    expect(s.playerHp).toBeLessThan(s.playerMaxHp);
    expect(s.lastResult?.target).toBe("player");
  });

  it("treats a timeout as a miss", () => {
    let s = battleReducer(createBattle(giga, 1), { type: "BEGIN" });
    s = battleReducer(s, { type: "TIMEOUT", rng: noCrit });
    expect(s.lastResult?.tier).toBe("miss");
    expect(s.playerHp).toBeLessThan(s.playerMaxHp);
  });

  it("ignores answers outside the question phase", () => {
    const s = createBattle(giga, 1); // still in 'intro'
    const same = battleReducer(s, { type: "ANSWER", index: 0, remainingMs: 100 });
    expect(same).toBe(s);
  });

  it("reaches victory when the boss runs out of HP", () => {
    let s = battleReducer(createBattle(getFighter("titan-x"), 1), { type: "BEGIN" });
    for (let i = 0; i < questions.length; i++) {
      s = battleReducer(s, {
        type: "ANSWER",
        index: s.questions[s.questionIndex].correctIndex,
        remainingMs: QUESTION_MS,
        rng: alwaysCrit,
      });
      s = battleReducer(s, { type: "ADVANCE" });
      if (s.phase === "victory" || s.phase === "defeat") break;
    }
    expect(s.phase).toBe("victory");
    expect(s.bossHp).toBe(0);
  });

  it("is a defeat if the boss survives the whole bank", () => {
    let s = battleReducer(createBattle(giga, 1), { type: "BEGIN" });
    for (let i = 0; i < questions.length; i++) {
      const q = s.questions[s.questionIndex];
      s = battleReducer(s, {
        type: "ANSWER",
        index: (q.correctIndex + 1) % q.options.length,
        remainingMs: 5000,
        rng: noCrit,
      });
      s = battleReducer(s, { type: "ADVANCE" });
      if (s.phase === "victory" || s.phase === "defeat") break;
    }
    expect(s.phase).toBe("defeat");
  });
});

describe("endurance mode (the daily quiz)", () => {
  const questions = getQuestions(1);

  it("does not end the run when the player is knocked out", () => {
    // Reward integrity: the attempt only scores if every question is answered,
    // so a KO must never cut the run short.
    let s = battleReducer(
      createBattle(getFighter("vex"), 5, { mode: "endurance", questions }),
      { type: "BEGIN" }
    );
    let sawZeroHp = false;
    for (let i = 0; i < questions.length; i++) {
      s = battleReducer(s, { type: "RESOLVE", correct: false, index: 0, remainingMs: 0, rng: noCrit });
      if (s.playerHp <= 0) sawZeroHp = true;
      s = battleReducer(s, { type: "ADVANCE" });
      if (i < questions.length - 1) {
        expect(s.phase).toBe("question");
      }
    }
    expect(sawZeroHp).toBe(true);
    expect(s.answers).toHaveLength(questions.length);
    expect(s.phase).toBe("defeat");
  });

  it("does not end the run early when the boss drops", () => {
    let s = battleReducer(
      createBattle(getFighter("titan-x"), 1, { mode: "endurance", questions }),
      { type: "BEGIN" }
    );
    for (let i = 0; i < questions.length; i++) {
      s = battleReducer(s, {
        type: "RESOLVE", correct: true, index: 0, remainingMs: QUESTION_MS, rng: alwaysCrit,
      });
      s = battleReducer(s, { type: "ADVANCE" });
    }
    expect(s.bossHp).toBe(0);
    expect(s.answers).toHaveLength(questions.length);
    expect(s.phase).toBe("victory");
  });

  it("resolves from the server verdict, not the local answer key", () => {
    const s = battleReducer(
      battleReducer(createBattle(giga, 1, { mode: "endurance", questions }), { type: "BEGIN" }),
      // Index 0 is deliberately NOT the local correctIndex; the server says it
      // is right, and the server wins.
      { type: "RESOLVE", correct: true, index: 0, remainingMs: QUESTION_MS, rng: noCrit }
    );
    expect(s.lastResult?.target).toBe("boss");
    expect(s.combo).toBe(1);
  });

  it("arcade mode still ends the moment the boss drops", () => {
    let s = battleReducer(createBattle(getFighter("titan-x"), 1), { type: "BEGIN" });
    let ended = 0;
    for (let i = 0; i < questions.length; i++) {
      s = battleReducer(s, {
        type: "ANSWER", index: s.questions[s.questionIndex].correctIndex,
        remainingMs: QUESTION_MS, rng: alwaysCrit,
      });
      s = battleReducer(s, { type: "ADVANCE" });
      if (s.phase === "victory") { ended = i + 1; break; }
    }
    expect(ended).toBeGreaterThan(0);
    expect(ended).toBeLessThan(questions.length);
  });
});

describe("roster integrity", () => {
  it("keeps every fighter's hull in a narrow band", () => {
    const hps = FIGHTERS.map(playerMaxHp);
    expect(Math.max(...hps) / Math.min(...hps)).toBeLessThan(1.4);
  });

  it("ships ten questions per battle with a valid answer index", () => {
    for (const level of [1, 2, 3]) {
      const qs = getQuestions(level);
      expect(qs).toHaveLength(10);
      for (const q of qs) {
        expect(q.options).toHaveLength(4);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.options.length);
        expect(q.explanation.length).toBeGreaterThan(10);
      }
    }
  });
});
