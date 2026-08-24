/**
 * Ledger behaviour: idempotency, concurrency, and the guards that make a
 * balance impossible to drive negative.
 *
 * These run against an in-memory fake of the pieces of Prisma the ledger uses.
 * They are not a substitute for the database-level Serializable guarantees, but
 * they pin the application-level contract: the same idempotency key never moves
 * money twice, a debit that would overdraw throws, and a budget cannot be
 * over-consumed by concurrent callers.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { applyMovement, InsufficientBalanceError, TreasuryExhaustedError } from "../ledger";
import { treasuryBucket } from "../types";
import { toAtomic, fromAtomic, recycleAndBurn } from "../units";
import { makeFakeTx, type FakeDb } from "./fakeTx";

let db: FakeDb;

beforeEach(() => {
  db = {
    users: new Map([[1, { pending: 0n, available: toAtomic("1000"), locked: 0n, withdrawn: 0n }]]),
    treasury: new Map([
      ["REWARD_RESERVE", toAtomic("1000000")],
      ["BURN_PENDING", 0n],
      ["OPERATIONS_TREASURY", 0n],
    ]),
    transactions: new Map(),
  };
});

describe("applyMovement — basics", () => {
  it("moves funds and writes exactly one ledger row", async () => {
    const tx = makeFakeTx(db);
    const result = await applyMovement(tx, {
      userId: 1,
      type: "GAUNTLET_ENTRY",
      amount: toAtomic("100"),
      from: "AVAILABLE",
      to: "LOCKED",
      idempotencyKey: "gauntlet:entry:1:2",
    });

    expect(result.applied).toBe(true);
    expect(db.users.get(1)!.available).toBe(toAtomic("900"));
    expect(db.users.get(1)!.locked).toBe(toAtomic("100"));
    expect(db.transactions.size).toBe(1);
  });

  it("refuses a zero or negative amount", async () => {
    const tx = makeFakeTx(db);
    await expect(
      applyMovement(tx, {
        userId: 1,
        type: "GAUNTLET_ENTRY",
        amount: 0n,
        from: "AVAILABLE",
        to: "LOCKED",
        idempotencyKey: "k1",
      })
    ).rejects.toThrow(RangeError);

    await expect(
      applyMovement(tx, {
        userId: 1,
        type: "GAUNTLET_ENTRY",
        amount: -toAtomic("5"),
        from: "AVAILABLE",
        to: "LOCKED",
        idempotencyKey: "k2",
      })
    ).rejects.toThrow(RangeError);
  });

  it("refuses a movement with no idempotency key", async () => {
    const tx = makeFakeTx(db);
    await expect(
      applyMovement(tx, {
        userId: 1,
        type: "GAUNTLET_ENTRY",
        amount: toAtomic("1"),
        from: "AVAILABLE",
        to: "LOCKED",
        idempotencyKey: "",
      })
    ).rejects.toThrow(/idempotencyKey/);
  });

  it("refuses an illegal transition", async () => {
    const tx = makeFakeTx(db);
    await expect(
      applyMovement(tx, {
        userId: 1,
        type: "WITHDRAWAL_CONFIRMED",
        amount: toAtomic("1"),
        from: "AVAILABLE",
        to: "WITHDRAWN",
        idempotencyKey: "bad",
      })
    ).rejects.toThrow(/Illegal balance transition/);
    expect(db.users.get(1)!.available).toBe(toAtomic("1000"));
  });

  it("refuses a user-bucket movement with no userId", async () => {
    const tx = makeFakeTx(db);
    await expect(
      applyMovement(tx, {
        type: "DAILY_REWARD",
        amount: toAtomic("1"),
        from: treasuryBucket("REWARD_RESERVE"),
        to: "AVAILABLE",
        idempotencyKey: "no-user",
      })
    ).rejects.toThrow(/no userId/);
  });
});

describe("idempotency", () => {
  it("moves money once for a repeated key, and returns the original row", async () => {
    const tx = makeFakeTx(db);
    const spec = {
      userId: 1,
      type: "DAILY_REWARD" as const,
      amount: toAtomic("5"),
      from: treasuryBucket("REWARD_RESERVE"),
      to: "AVAILABLE" as const,
      idempotencyKey: "daily:1:2026-08-17",
    };

    const first = await applyMovement(tx, spec);
    const second = await applyMovement(tx, spec);
    const third = await applyMovement(tx, spec);

    expect(first.applied).toBe(true);
    expect(second.applied).toBe(false);
    expect(third.applied).toBe(false);
    // Same transaction returned every time.
    expect(second.transactionId).toBe(first.transactionId);
    expect(third.transactionId).toBe(first.transactionId);

    // Credited once, not three times.
    expect(fromAtomic(db.users.get(1)!.available)).toBe("1005");
    expect(db.transactions.size).toBe(1);
  });

  it("survives a burst of concurrent retries of the same key", async () => {
    const tx = makeFakeTx(db);
    const spec = {
      userId: 1,
      type: "GAUNTLET_REWARD" as const,
      amount: toAtomic("50"),
      from: treasuryBucket("REWARD_RESERVE"),
      to: "AVAILABLE" as const,
      idempotencyKey: "gauntlet:reward:9:3",
    };

    const results = await Promise.all(Array.from({ length: 25 }, () => applyMovement(tx, spec)));

    expect(results.filter((r) => r.applied)).toHaveLength(1);
    expect(fromAtomic(db.users.get(1)!.available)).toBe("1050");
    expect(db.transactions.size).toBe(1);
  });

  it("distinguishes different keys for the same logical action", async () => {
    const tx = makeFakeTx(db);
    for (const round of [1, 2, 3]) {
      await applyMovement(tx, {
        userId: 1,
        type: "GAUNTLET_ENTRY",
        amount: toAtomic("10"),
        from: "AVAILABLE",
        to: "LOCKED",
        idempotencyKey: `gauntlet:entry:7:${round}`,
      });
    }
    expect(db.transactions.size).toBe(3);
    expect(fromAtomic(db.users.get(1)!.locked)).toBe("30");
  });
});

describe("overdraft protection", () => {
  it("throws rather than letting a balance go negative", async () => {
    const tx = makeFakeTx(db);
    await expect(
      applyMovement(tx, {
        userId: 1,
        type: "GAUNTLET_ENTRY",
        amount: toAtomic("1001"),
        from: "AVAILABLE",
        to: "LOCKED",
        idempotencyKey: "overdraft",
      })
    ).rejects.toThrow(InsufficientBalanceError);

    expect(db.users.get(1)!.available).toBe(toAtomic("1000"));
    expect(db.users.get(1)!.locked).toBe(0n);
  });

  it("reports what was needed and what was held", async () => {
    const tx = makeFakeTx(db);
    try {
      await applyMovement(tx, {
        userId: 1,
        type: "GAUNTLET_ENTRY",
        amount: toAtomic("6000"),
        from: "AVAILABLE",
        to: "LOCKED",
        idempotencyKey: "overdraft-2",
      });
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(InsufficientBalanceError);
      const e = err as InsufficientBalanceError;
      expect(fromAtomic(e.requested)).toBe("6000");
      expect(fromAtomic(e.available)).toBe("1000");
    }
  });

  it("sequential debits stop exactly at the balance", async () => {
    const tx = makeFakeTx(db);
    // Balance funds 10 debits of 100. An 11th must fail.
    let succeeded = 0;
    for (let i = 0; i < 20; i++) {
      try {
        await applyMovement(tx, {
          userId: 1,
          type: "GAUNTLET_ENTRY",
          amount: toAtomic("100"),
          from: "AVAILABLE",
          to: "LOCKED",
          idempotencyKey: `seq:${i}`,
        });
        succeeded++;
      } catch (err) {
        expect(err).toBeInstanceOf(InsufficientBalanceError);
      }
    }

    expect(succeeded).toBe(10);
    expect(db.users.get(1)!.available).toBe(0n);
    expect(fromAtomic(db.users.get(1)!.locked)).toBe("1000");
  });

  it("refuses to pay from an exhausted treasury account", async () => {
    db.treasury.set("REWARD_RESERVE", toAtomic("10"));
    const tx = makeFakeTx(db);

    await expect(
      applyMovement(tx, {
        userId: 1,
        type: "DAILY_REWARD",
        amount: toAtomic("11"),
        from: treasuryBucket("REWARD_RESERVE"),
        to: "PENDING",
        idempotencyKey: "treasury-dry",
      })
    ).rejects.toThrow(TreasuryExhaustedError);
  });
});

describe("70/30 settlement through the ledger", () => {
  it("consumes a locked fee with no dust left over", async () => {
    const tx = makeFakeTx(db);
    const fee = toAtomic("6000");
    db.users.set(1, { pending: 0n, available: 0n, locked: fee, withdrawn: 0n });

    const { recycle, burn } = recycleAndBurn(fee);
    await applyMovement(tx, {
      userId: 1,
      type: "REWARD_POOL_RECYCLE",
      amount: recycle,
      from: "LOCKED",
      to: treasuryBucket("REWARD_RESERVE"),
      idempotencyKey: "consume:recycle",
    });
    await applyMovement(tx, {
      userId: 1,
      type: "BURN_PENDING",
      amount: burn,
      from: "LOCKED",
      to: treasuryBucket("BURN_PENDING"),
      idempotencyKey: "consume:burn",
    });

    // The user's locked balance is exactly emptied — no residue.
    expect(db.users.get(1)!.locked).toBe(0n);
    expect(fromAtomic(db.treasury.get("BURN_PENDING")!)).toBe("1800");
    expect(db.treasury.get("REWARD_RESERVE")!).toBe(toAtomic("1000000") + recycle);
  });
});
