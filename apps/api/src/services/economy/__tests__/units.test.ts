/**
 * Atomic-unit arithmetic.
 *
 * These tests exist because the previous implementation did token accounting in
 * JavaScript numbers. `0.1 + 0.2 !== 0.3` is a curiosity in most code and an
 * insolvency bug in a ledger.
 */

import { describe, it, expect } from "vitest";
import {
  GEEK,
  toAtomic,
  fromAtomic,
  splitByBps,
  recycleAndBurn,
  applyPct,
  minBig,
  maxBig,
  clampPositive,
  formatGeek,
} from "../units";

describe("toAtomic", () => {
  it("converts whole GEEK", () => {
    expect(toAtomic("1")).toBe(100_000_000n);
    expect(toAtomic(1)).toBe(GEEK);
    expect(toAtomic("0")).toBe(0n);
  });

  it("converts fractional GEEK exactly", () => {
    expect(toAtomic("12.5")).toBe(1_250_000_000n);
    expect(toAtomic("0.00000001")).toBe(1n);
    expect(toAtomic("0.1")).toBe(10_000_000n);
  });

  it("does not accumulate float error across repeated additions", () => {
    // The canonical failure: 0.1 added 10 times is not 1 in float arithmetic.
    let float = 0;
    let atomic = 0n;
    for (let i = 0; i < 10; i++) {
      float += 0.1;
      atomic += toAtomic("0.1");
    }
    expect(float).not.toBe(1); // demonstrates the bug this design avoids
    expect(atomic).toBe(GEEK);
    expect(fromAtomic(atomic)).toBe("1");
  });

  it("floors excess precision rather than rounding up", () => {
    // 9 decimal places: the last digit is beyond what GEEK can represent.
    expect(toAtomic("0.123456789")).toBe(12_345_678n);
    expect(toAtomic("0.999999999")).toBe(99_999_999n);
  });

  it("passes bigints through untouched", () => {
    expect(toAtomic(42n)).toBe(42n);
  });

  it("handles a number in exponential notation", () => {
    expect(toAtomic(1e-8)).toBe(1n);
  });

  it("rejects nonsense", () => {
    expect(() => toAtomic("abc")).toThrow(TypeError);
    expect(() => toAtomic("")).toThrow(TypeError);
    expect(() => toAtomic(Number.NaN)).toThrow(TypeError);
    expect(() => toAtomic(Number.POSITIVE_INFINITY)).toThrow(TypeError);
  });
});

describe("fromAtomic", () => {
  it("round-trips", () => {
    for (const value of ["0", "1", "12.5", "0.00000001", "144000000000", "0.1"]) {
      expect(fromAtomic(toAtomic(value))).toBe(value);
    }
  });

  it("trims trailing zeros", () => {
    expect(fromAtomic(1_500_000_000n)).toBe("15");
    expect(fromAtomic(1_050_000_000n)).toBe("10.5");
  });

  it("handles the full supply without precision loss", () => {
    const supply = toAtomic("144000000000");
    expect(fromAtomic(supply)).toBe("144000000000");

    // The whole supply in atomic units is 1.44e19, well past the largest
    // integer a JavaScript number can represent exactly (9.007e15). This is why
    // the ledger is bigint and Decimal(30,0) rather than a float: a Number
    // cannot even count the protocol's own supply.
    expect(supply).toBeGreaterThan(BigInt(Number.MAX_SAFE_INTEGER));
    expect(Number.isSafeInteger(Number(supply))).toBe(false);

    // Concretely: one atomic unit above the supply is indistinguishable from
    // the supply itself once it passes through a Number. In a ledger that is a
    // silently vanishing unit.
    expect(Number(supply + 1n)).toBe(Number(supply));
    expect(fromAtomic(supply + 1n)).not.toBe(fromAtomic(supply));
  });

  it("renders negatives", () => {
    expect(fromAtomic(-1_250_000_000n)).toBe("-12.5");
  });
});

describe("splitByBps", () => {
  it("never loses or invents an atomic unit", () => {
    for (let amount = 0n; amount < 1000n; amount++) {
      for (const bps of [0n, 1n, 3_000n, 5_000n, 7_000n, 9_999n, 10_000n]) {
        const { share, remainder } = splitByBps(amount, bps);
        expect(share + remainder).toBe(amount);
        expect(share).toBeGreaterThanOrEqual(0n);
        expect(remainder).toBeGreaterThanOrEqual(0n);
      }
    }
  });

  it("rejects an out-of-range rate", () => {
    expect(() => splitByBps(100n, 10_001n)).toThrow(RangeError);
    expect(() => splitByBps(100n, -1n)).toThrow(RangeError);
  });

  it("rejects a negative amount", () => {
    expect(() => splitByBps(-1n, 3_000n)).toThrow(RangeError);
  });
});

describe("recycleAndBurn (the 70/30 rule)", () => {
  it("splits exactly, with the remainder to the reward pool", () => {
    const { recycle, burn } = recycleAndBurn(toAtomic("100"));
    expect(fromAtomic(recycle)).toBe("70");
    expect(fromAtomic(burn)).toBe("30");
  });

  it("reconciles for every amount up to 100000 atomic units", () => {
    for (let amount = 0n; amount <= 100_000n; amount++) {
      const { recycle, burn } = recycleAndBurn(amount);
      expect(recycle + burn).toBe(amount);
      // Burn is floored, so the pool never receives less than its 70% share.
      expect(burn).toBe((amount * 30n) / 100n);
    }
  });

  it("handles amounts too small to split evenly", () => {
    // 1 atomic unit: 30% floors to 0, so all of it recycles. Nothing is lost.
    const { recycle, burn } = recycleAndBurn(1n);
    expect(burn).toBe(0n);
    expect(recycle).toBe(1n);
  });

  it("reconciles for a realistic Gauntlet fee", () => {
    const { recycle, burn } = recycleAndBurn(toAtomic("6000"));
    expect(fromAtomic(recycle)).toBe("4200");
    expect(fromAtomic(burn)).toBe("1800");
    expect(recycle + burn).toBe(toAtomic("6000"));
  });
});

describe("applyPct", () => {
  it("applies a whole percentage", () => {
    expect(applyPct(toAtomic("100"), 10)).toBe(toAtomic("10"));
    expect(applyPct(toAtomic("100"), 50)).toBe(toAtomic("50"));
    expect(applyPct(toAtomic("100"), 0)).toBe(0n);
  });

  it("applies a fractional percentage without float drift", () => {
    expect(applyPct(toAtomic("100"), 2.5)).toBe(toAtomic("2.5"));
  });

  it("floors", () => {
    expect(applyPct(1n, 50)).toBe(0n);
  });
});

describe("helpers", () => {
  it("minBig / maxBig", () => {
    expect(minBig(5n, 3n, 9n)).toBe(3n);
    expect(maxBig(5n, 3n, 9n)).toBe(9n);
  });

  it("clampPositive turns an exceeded cap into zero, never a negative", () => {
    expect(clampPositive(-5n)).toBe(0n);
    expect(clampPositive(5n)).toBe(5n);
  });

  it("formatGeek", () => {
    expect(formatGeek(toAtomic("12.5"))).toBe("12.5 GEEK");
  });
});
