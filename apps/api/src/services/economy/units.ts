/**
 * GEEK atomic-unit arithmetic.
 *
 * The rule this file exists to enforce: **no JavaScript floating-point number
 * ever touches token accounting.** `0.1 + 0.2 !== 0.3` is a rounding curiosity
 * in most code and an insolvency bug in a ledger. Everything here is `bigint`
 * in memory and `Prisma.Decimal` at the database boundary.
 *
 * 1 GEEK = 100_000_000 atomic units (8 decimals).
 */

import { Prisma } from "@prisma/client";

/** Atomic units in one whole GEEK. */
export const GEEK = 100_000_000n;

/** Number of decimal places GEEK uses. */
export const GEEK_DECIMALS = 8;

/**
 * Parse a human GEEK amount into atomic units.
 *
 * Accepts a string ("12.5"), a bigint (already atomic — returned as-is), or a
 * number. Numbers are accepted only because reward tables are authored as
 * numbers; they are stringified first, so `0.1` becomes exactly `10_000_000n`
 * rather than `9_999_999n`.
 *
 * Excess decimal places are FLOORED, never rounded up: the protocol must never
 * promise an atomic unit it does not hold.
 */
export function toAtomic(value: string | number | bigint): bigint {
  if (typeof value === "bigint") return value;

  const raw = typeof value === "number" ? numberToDecimalString(value) : value.trim();
  if (!/^-?\d*(\.\d*)?$/.test(raw) || raw === "" || raw === "." || raw === "-") {
    throw new TypeError(`Not a valid GEEK amount: ${JSON.stringify(value)}`);
  }

  const negative = raw.startsWith("-");
  const unsigned = negative ? raw.slice(1) : raw;
  const [whole = "0", frac = ""] = unsigned.split(".");

  // Truncate (floor) rather than round the fractional part.
  const fracPadded = (frac + "0".repeat(GEEK_DECIMALS)).slice(0, GEEK_DECIMALS);
  const result = BigInt(whole || "0") * GEEK + BigInt(fracPadded || "0");
  return negative ? -result : result;
}

/**
 * A `number` can hold more precision than it can print with `String()` in
 * exponential form, so normalise scientific notation before parsing.
 */
function numberToDecimalString(n: number): string {
  if (!Number.isFinite(n)) throw new TypeError(`Not a finite GEEK amount: ${n}`);
  if (!String(n).includes("e") && !String(n).includes("E")) return String(n);
  // toFixed handles the exponent; 8 decimals is all GEEK can represent anyway.
  return n.toFixed(GEEK_DECIMALS);
}

/** Render atomic units as a plain decimal string, e.g. `1250000000n` → "12.5". */
export function fromAtomic(atomic: bigint | Prisma.Decimal | string): string {
  const v = toBigInt(atomic);
  const negative = v < 0n;
  const abs = negative ? -v : v;
  const whole = abs / GEEK;
  const frac = abs % GEEK;
  const fracStr = frac.toString().padStart(GEEK_DECIMALS, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fracStr ? "." + fracStr : ""}`;
}

/**
 * Atomic units as a `number`, for display and analytics ONLY.
 * Never feed the result back into accounting.
 */
export function toDisplayNumber(atomic: bigint | Prisma.Decimal | string): number {
  return Number(fromAtomic(atomic));
}

/** Coerce whatever the database or a caller handed us into a bigint. */
export function toBigInt(value: bigint | Prisma.Decimal | string | number): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") {
    if (!Number.isInteger(value)) {
      throw new TypeError(`Atomic amounts must be integers, got ${value}`);
    }
    return BigInt(value);
  }
  if (typeof value === "string") return BigInt(value);
  // Prisma.Decimal — these columns are Decimal(30,0), so toFixed(0) is lossless.
  return BigInt(value.toFixed(0));
}

/** Wrap a bigint for a `Decimal(30,0)` column. */
export function toDecimal(atomic: bigint): Prisma.Decimal {
  return new Prisma.Decimal(atomic.toString());
}

/**
 * Legacy bridge: the deprecated `geekBalance` column is `Decimal(20,8)` in
 * whole GEEK. Used only to keep the shadow column in step during migration.
 */
export function toLegacyGeek(atomic: bigint): Prisma.Decimal {
  return new Prisma.Decimal(fromAtomic(atomic));
}

/**
 * Split an amount by a basis-point rate with **no dust loss**.
 *
 * The share is floored and the remainder is returned as the counterpart, so
 * `share + remainder === amount` holds exactly for every input. This is what
 * makes the 70/30 rule reconcile to the atomic unit.
 */
export function splitByBps(amount: bigint, bps: bigint): { share: bigint; remainder: bigint } {
  if (amount < 0n) throw new RangeError("Cannot split a negative amount");
  if (bps < 0n || bps > 10_000n) throw new RangeError(`bps out of range: ${bps}`);
  const share = (amount * bps) / 10_000n;
  return { share, remainder: amount - share };
}

/**
 * The 70/30 recycle-and-burn split (ECONOMY.md §4).
 * `recycle` takes the remainder so nothing is ever lost or invented.
 */
export function recycleAndBurn(amount: bigint): { recycle: bigint; burn: bigint } {
  const { share: burn, remainder: recycle } = splitByBps(amount, 3_000n);
  return { recycle, burn };
}

/** Apply a percentage bonus, floored. `pct` is a whole percent (10 = +10%). */
export function applyPct(amount: bigint, pct: number): bigint {
  if (!Number.isFinite(pct)) throw new TypeError(`Bad percentage: ${pct}`);
  // Convert to basis points as an integer to stay off floats.
  const bps = BigInt(Math.round(pct * 100));
  return (amount * bps) / 10_000n;
}

/** Smallest of a list of bigints. Used everywhere a cap is applied. */
export function minBig(...values: bigint[]): bigint {
  return values.reduce((a, b) => (b < a ? b : a));
}

/** Largest of a list of bigints. */
export function maxBig(...values: bigint[]): bigint {
  return values.reduce((a, b) => (b > a ? b : a));
}

/** Clamp to zero — a cap that has been exceeded yields 0, never a negative. */
export function clampPositive(value: bigint): bigint {
  return value > 0n ? value : 0n;
}

/** Format for logs and user-facing strings: "12.5 GEEK". */
export function formatGeek(atomic: bigint | Prisma.Decimal | string): string {
  return `${fromAtomic(atomic)} GEEK`;
}
