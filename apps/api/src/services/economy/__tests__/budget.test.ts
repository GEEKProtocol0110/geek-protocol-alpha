/**
 * Budget and per-user cap enforcement.
 *
 * The property that matters: concurrent grants can never sum to more than the
 * budget. A budget that can be over-consumed is unfunded GEEK by another name.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { consumeBudget, consumeUserCap, consumeUserCount, releaseBudget, utcDayKey, utcMonthKey, utcWeekKey } from "../budget";
import { toAtomic, fromAtomic } from "../units";
import type { Tx } from "../ledger";

interface BudgetRow {
  id: number;
  name: string;
  enabled: boolean;
  dailyLimitAtomic: string;
  monthlyLimitAtomic: string;
  treasuryAccount: string;
}

interface PeriodRow {
  id: number;
  budgetId: number;
  periodType: string;
  periodKey: string;
  consumedAtomic: bigint;
  grantCount: number;
}

interface CapRow {
  id: number;
  userId: number;
  capName: string;
  periodKey: string;
  consumedAtomic: bigint;
  count: number;
}

let budgets: BudgetRow[];
let periods: PeriodRow[];
let caps: CapRow[];
let nextId: number;

function periodKeyOf(p: PeriodRow) {
  return `${p.budgetId}|${p.periodType}|${p.periodKey}`;
}

/** In-memory stand-in for the budget tables. */
function fakeTx(): Tx {
  const tx = {
    async $executeRaw() {
      return 1; // advisory locks
    },

    rewardBudget: {
      async findUnique({ where }: { where: { name: string } }) {
        return budgets.find((b) => b.name === where.name) ?? null;
      },
    },

    rewardBudgetPeriod: {
      async findUnique({ where }: { where: Record<string, { budgetId: number; periodType: string; periodKey: string }> }) {
        const k = Object.values(where)[0];
        return periods.find((p) => periodKeyOf(p) === `${k.budgetId}|${k.periodType}|${k.periodKey}`) ?? null;
      },
      async upsert({ where, create }: { where: Record<string, { budgetId: number; periodType: string; periodKey: string }>; create: Record<string, unknown> }) {
        const k = Object.values(where)[0];
        const existing = periods.find((p) => periodKeyOf(p) === `${k.budgetId}|${k.periodType}|${k.periodKey}`);
        if (existing) return existing;
        const row: PeriodRow = {
          id: ++nextId,
          budgetId: k.budgetId,
          periodType: k.periodType,
          periodKey: k.periodKey,
          consumedAtomic: 0n,
          grantCount: 0,
          ...(create as object),
        } as PeriodRow;
        periods.push(row);
        return row;
      },
      async update({ where, data }: { where: { id: number }; data: Record<string, unknown> }) {
        const row = periods.find((p) => p.id === where.id)!;
        const consumed = data.consumedAtomic;
        if (consumed !== undefined) {
          if (consumed && typeof consumed === "object" && "increment" in consumed) {
            row.consumedAtomic += BigInt(String((consumed as { increment: unknown }).increment));
          } else {
            // A direct set. The value may be a string or a Prisma.Decimal, both
            // of which stringify to an integer for a Decimal(30,0) column.
            row.consumedAtomic = BigInt(String(consumed));
          }
        }
        if (data.grantCount) row.grantCount += 1;
        return row;
      },
    },

    userRewardCap: {
      async findUnique({ where }: { where: Record<string, { userId: number; capName: string; periodKey: string }> }) {
        const k = Object.values(where)[0];
        return caps.find((c) => c.userId === k.userId && c.capName === k.capName && c.periodKey === k.periodKey) ?? null;
      },
      async upsert({ where }: { where: Record<string, { userId: number; capName: string; periodKey: string }> }) {
        const k = Object.values(where)[0];
        let row = caps.find((c) => c.userId === k.userId && c.capName === k.capName && c.periodKey === k.periodKey);
        if (!row) {
          row = { id: ++nextId, userId: k.userId, capName: k.capName, periodKey: k.periodKey, consumedAtomic: 0n, count: 0 };
          caps.push(row);
        }
        return row;
      },
      async update({ where, data }: { where: { id: number }; data: Record<string, { increment?: unknown }> }) {
        const row = caps.find((c) => c.id === where.id)!;
        if (data.consumedAtomic?.increment !== undefined) {
          row.consumedAtomic += BigInt(String(data.consumedAtomic.increment));
        }
        if (data.count?.increment !== undefined) row.count += Number(data.count.increment);
        return row;
      },
    },
  };

  return tx as unknown as Tx;
}

beforeEach(() => {
  nextId = 0;
  periods = [];
  caps = [];
  budgets = [
    {
      id: 1,
      name: "DAILY_QUIZ",
      enabled: true,
      dailyLimitAtomic: toAtomic("1000").toString(),
      monthlyLimitAtomic: toAtomic("100000").toString(),
      treasuryAccount: "REWARD_RESERVE",
    },
    {
      id: 2,
      name: "TOURNAMENT",
      enabled: false,
      dailyLimitAtomic: "0",
      monthlyLimitAtomic: "0",
      treasuryAccount: "TOURNAMENT_POOL",
    },
  ];
});

describe("consumeBudget", () => {
  it("grants the full request when there is room", async () => {
    const tx = fakeTx();
    const r = await consumeBudget(tx, "DAILY_QUIZ", toAtomic("10"));
    expect(fromAtomic(r.granted)).toBe("10");
    expect(r.exhausted).toBe(false);
  });

  it("grants a partial amount rather than overspending", async () => {
    const tx = fakeTx();
    await consumeBudget(tx, "DAILY_QUIZ", toAtomic("995"));
    const r = await consumeBudget(tx, "DAILY_QUIZ", toAtomic("50"));

    expect(fromAtomic(r.granted)).toBe("5");
    expect(r.exhausted).toBe(true);
  });

  it("grants nothing once the budget is spent", async () => {
    const tx = fakeTx();
    await consumeBudget(tx, "DAILY_QUIZ", toAtomic("1000"));
    const r = await consumeBudget(tx, "DAILY_QUIZ", toAtomic("1"));

    expect(r.granted).toBe(0n);
    expect(r.exhausted).toBe(true);
  });

  it("never exceeds the budget under concurrent load", async () => {
    const tx = fakeTx();
    // 200 concurrent grants of 10 GEEK against a 1000 GEEK budget.
    // At most 100 can succeed in full.
    const results = await Promise.all(
      Array.from({ length: 200 }, () => consumeBudget(tx, "DAILY_QUIZ", toAtomic("10")))
    );

    const total = results.reduce((sum, r) => sum + r.granted, 0n);
    expect(total).toBe(toAtomic("1000"));
    expect(total).toBeLessThanOrEqual(toAtomic("1000"));
    expect(results.filter((r) => r.granted > 0n)).toHaveLength(100);
  });

  it("returns nothing for a disabled budget", async () => {
    const tx = fakeTx();
    const r = await consumeBudget(tx, "TOURNAMENT", toAtomic("10"));
    expect(r.granted).toBe(0n);
    expect(r.exhausted).toBe(true);
  });

  it("returns nothing for an unknown budget rather than inventing one", async () => {
    const tx = fakeTx();
    const r = await consumeBudget(tx, "NOT_A_BUDGET", toAtomic("10"));
    expect(r.granted).toBe(0n);
    expect(r.exhausted).toBe(true);
  });

  it("respects the monthly ceiling as well as the daily one", async () => {
    budgets[0].monthlyLimitAtomic = toAtomic("15").toString();
    const tx = fakeTx();

    const first = await consumeBudget(tx, "DAILY_QUIZ", toAtomic("10"));
    const second = await consumeBudget(tx, "DAILY_QUIZ", toAtomic("10"));

    expect(fromAtomic(first.granted)).toBe("10");
    // Daily has 990 left, but the month only has 5.
    expect(fromAtomic(second.granted)).toBe("5");
  });

  it("ignores a zero or negative request", async () => {
    const tx = fakeTx();
    expect((await consumeBudget(tx, "DAILY_QUIZ", 0n)).granted).toBe(0n);
    expect((await consumeBudget(tx, "DAILY_QUIZ", -toAtomic("5"))).granted).toBe(0n);
  });
});

describe("releaseBudget", () => {
  it("returns budget after a reversal", async () => {
    const tx = fakeTx();
    await consumeBudget(tx, "DAILY_QUIZ", toAtomic("1000"));
    expect((await consumeBudget(tx, "DAILY_QUIZ", toAtomic("10"))).granted).toBe(0n);

    await releaseBudget(tx, "DAILY_QUIZ", toAtomic("100"));
    expect(fromAtomic((await consumeBudget(tx, "DAILY_QUIZ", toAtomic("10"))).granted)).toBe("10");
  });

  it("never drives consumption below zero", async () => {
    const tx = fakeTx();
    await consumeBudget(tx, "DAILY_QUIZ", toAtomic("10"));
    await releaseBudget(tx, "DAILY_QUIZ", toAtomic("999999"));

    // Full budget available again, not more than the limit.
    const r = await consumeBudget(tx, "DAILY_QUIZ", toAtomic("2000"));
    expect(r.granted).toBe(toAtomic("1000"));
  });
});

describe("consumeUserCap", () => {
  it("caps a user at their limit", async () => {
    const tx = fakeTx();
    const limit = toAtomic("15");

    const first = await consumeUserCap(tx, 1, "daily:quiz", utcDayKey(), toAtomic("10"), limit);
    const second = await consumeUserCap(tx, 1, "daily:quiz", utcDayKey(), toAtomic("10"), limit);
    const third = await consumeUserCap(tx, 1, "daily:quiz", utcDayKey(), toAtomic("10"), limit);

    expect(fromAtomic(first.allowed)).toBe("10");
    expect(fromAtomic(second.allowed)).toBe("5");
    expect(third.allowed).toBe(0n);
    expect(second.capped).toBe(true);
  });

  it("treats a zero limit as no cap, not as a total block", async () => {
    // An unconfigured cap must never silently stop paying real players.
    const tx = fakeTx();
    const r = await consumeUserCap(tx, 1, "unset", utcDayKey(), toAtomic("10"), 0n);
    expect(fromAtomic(r.allowed)).toBe("10");
    expect(r.capped).toBe(false);
  });

  it("keeps users independent", async () => {
    const tx = fakeTx();
    const limit = toAtomic("10");
    await consumeUserCap(tx, 1, "daily:quiz", utcDayKey(), limit, limit);
    const other = await consumeUserCap(tx, 2, "daily:quiz", utcDayKey(), limit, limit);
    expect(other.allowed).toBe(limit);
  });

  it("keeps periods independent", async () => {
    const tx = fakeTx();
    const limit = toAtomic("10");
    await consumeUserCap(tx, 1, "daily:quiz", "2026-08-17", limit, limit);
    const tomorrow = await consumeUserCap(tx, 1, "daily:quiz", "2026-08-18", limit, limit);
    expect(tomorrow.allowed).toBe(limit);
  });
});

describe("consumeUserCount", () => {
  it("enforces a count limit", async () => {
    const tx = fakeTx();
    const results = [];
    for (let i = 0; i < 5; i++) {
      results.push(await consumeUserCount(tx, 1, "powerup:FIFTY_FIFTY", utcDayKey(), 3));
    }
    expect(results.filter((r) => r.allowed)).toHaveLength(3);
    expect(results[3].allowed).toBe(false);
    expect(results[2].remaining).toBe(0);
  });
});

describe("period keys", () => {
  it("uses UTC days, not local days", () => {
    // 23:30 UTC on the 17th is still the 17th, whatever the server's timezone.
    expect(utcDayKey(new Date("2026-08-17T23:30:00.000Z"))).toBe("2026-08-17");
    expect(utcDayKey(new Date("2026-08-18T00:30:00.000Z"))).toBe("2026-08-18");
  });

  it("uses UTC calendar months", () => {
    expect(utcMonthKey(new Date("2026-08-31T23:59:59.000Z"))).toBe("2026-08");
    expect(utcMonthKey(new Date("2026-09-01T00:00:00.000Z"))).toBe("2026-09");
  });

  it("produces ISO week keys", () => {
    expect(utcWeekKey(new Date("2026-08-17T12:00:00.000Z"))).toMatch(/^\d{4}-W\d{2}$/);
    // Days in the same ISO week share a key.
    expect(utcWeekKey(new Date("2026-08-17T00:00:00.000Z"))).toBe(
      utcWeekKey(new Date("2026-08-20T00:00:00.000Z"))
    );
  });
});
