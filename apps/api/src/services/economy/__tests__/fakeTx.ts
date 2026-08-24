/**
 * A minimal in-memory stand-in for the slice of `Prisma.TransactionClient` that
 * `applyMovement` uses.
 *
 * It reproduces the two properties the ledger depends on:
 *
 *   1. the unique constraint on `idempotencyKey` (a duplicate insert throws a
 *      P2002-shaped error), and
 *   2. the conditional debit — an update whose WHERE clause fails affects zero
 *      rows, which is what turns an overdraft into a thrown error.
 *
 * Nothing here tries to be a database. It exists so the contract can be tested
 * without one; the Serializable isolation and advisory locking are the
 * database's job and are exercised by the integration suite.
 */

import { Prisma } from "@prisma/client";
import type { Tx } from "../ledger";

export interface FakeUser {
  pending: bigint;
  available: bigint;
  locked: bigint;
  withdrawn: bigint;
}

export interface FakeDb {
  users: Map<number, FakeUser>;
  treasury: Map<string, bigint>;
  transactions: Map<string, { id: string; amountAtomic: string; key: string }>;
}

const COLUMN_TO_FIELD: Record<string, keyof FakeUser> = {
  pendingBalance: "pending",
  availableBalance: "available",
  lockedBalance: "locked",
  withdrawnBalance: "withdrawn",
};

/** Throws the same shape Prisma raises on a unique-constraint violation. */
function uniqueViolation(target: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
    meta: { target: [target] },
  });
}

let counter = 0;

export function makeFakeTx(db: FakeDb): Tx {
  const tx = {
    economyTransaction: {
      async create({ data }: { data: Record<string, unknown> }) {
        const key = String(data.idempotencyKey);
        if (db.transactions.has(key)) throw uniqueViolation("idempotencyKey");
        const id = `tx_${++counter}`;
        const row = { id, amountAtomic: String(data.amountAtomic), key };
        db.transactions.set(key, row);
        return { ...data, id };
      },
      async findUnique({ where }: { where: { idempotencyKey?: string; id?: string } }) {
        if (where.idempotencyKey) {
          const row = db.transactions.get(where.idempotencyKey);
          return row ? { id: row.id, amountAtomic: row.amountAtomic } : null;
        }
        for (const row of db.transactions.values()) {
          if (row.id === where.id) return { id: row.id, amountAtomic: row.amountAtomic };
        }
        return null;
      },
      async update() {
        return {};
      },
    },

    user: {
      async findUnique({ where }: { where: { id: number } }) {
        const u = db.users.get(where.id);
        if (!u) return null;
        return {
          pendingBalance: new Prisma.Decimal(u.pending.toString()),
          availableBalance: new Prisma.Decimal(u.available.toString()),
          lockedBalance: new Prisma.Decimal(u.locked.toString()),
          withdrawnBalance: new Prisma.Decimal(u.withdrawn.toString()),
        };
      },
      async update() {
        // The legacy shadow-column sync. Not modelled; not what these tests check.
        return {};
      },
    },

    treasuryAccount: {
      async findUnique({ where }: { where: { account: string } }) {
        const value = db.treasury.get(where.account);
        return value === undefined
          ? null
          : { account: where.account, balanceAtomic: new Prisma.Decimal(value.toString()) };
      },
      async upsert({
        where,
        create,
        update,
      }: {
        where: { account: string };
        create: { balanceAtomic: unknown };
        update: { balanceAtomic: { increment: unknown } };
      }) {
        const current = db.treasury.get(where.account);
        if (current === undefined) {
          db.treasury.set(where.account, BigInt(String(create.balanceAtomic)));
        } else {
          db.treasury.set(where.account, current + BigInt(String(update.balanceAtomic.increment)));
        }
        return { account: where.account };
      },
    },

    // Advisory locks are a no-op here: there is no real concurrency to serialize.
    async $executeRaw(strings: TemplateStringsArray, ...values: unknown[]) {
      const sql = strings.join("?");
      if (sql.includes("pg_advisory_xact_lock")) return 1;

      // The treasury debit: UPDATE ... WHERE balanceAtomic >= amount
      if (sql.includes("treasury_accounts")) {
        const amount = BigInt(String(values[0]));
        const account = String(values[1]);
        const held = db.treasury.get(account) ?? 0n;
        if (held < amount) return 0; // zero rows affected → caller throws
        db.treasury.set(account, held - amount);
        return 1;
      }
      return 1;
    },

    async $executeRawUnsafe(sql: string, ...params: unknown[]) {
      if (sql.includes("pg_advisory_xact_lock")) return 1;

      const column = sql.match(/"(\w+Balance)"/)?.[1];
      const field = column ? COLUMN_TO_FIELD[column] : undefined;
      if (!field) return 1;

      const amount = BigInt(String(params[0]));
      const userId = Number(params[1]);
      const user = db.users.get(userId);
      if (!user) return 0;

      const isDebit = sql.includes(`- $1`);
      if (isDebit) {
        // The conditional guard: refuse rather than go negative.
        if (user[field] < amount) return 0;
        user[field] -= amount;
      } else {
        user[field] += amount;
      }
      return 1;
    },
  };

  return tx as unknown as Tx;
}
