/**
 * economy:reconcile — verify the books (ECONOMY.md §14.4, §20).
 *
 * Checks, in order:
 *
 *   I4  every user's four buckets equal the sum of their ledger deltas
 *   I1-3 no bucket is negative
 *   I5  total user liability is covered by treasury backing (solvency)
 *       every treasury account equals the sum of its ledger deltas
 *       the deprecated geekBalance shadow column still matches availableBalance
 *
 * Exits non-zero on any drift, so it can gate CI and be scheduled hourly.
 *
 *   npm run economy:reconcile
 *   npm run economy:reconcile -- --json     # machine-readable
 *   npm run economy:reconcile -- --quiet    # only print problems
 */

import { PrismaClient } from "@prisma/client";
import { toBigInt, fromAtomic, toAtomic } from "../services/economy/units";
import { treasuryBalances, userLiabilities } from "../services/economy/treasury";
import { getRules } from "../services/economy/config";
import { TREASURY_ACCOUNTS, isTreasuryBucket, treasuryAccountOf } from "../services/economy/types";

const prisma = new PrismaClient();

const BUCKET_FIELD = {
  PENDING: "pendingBalance",
  AVAILABLE: "availableBalance",
  LOCKED: "lockedBalance",
  WITHDRAWN: "withdrawnBalance",
} as const;

interface Drift {
  kind: "USER" | "TREASURY" | "SHADOW" | "NEGATIVE" | "SOLVENCY";
  subject: string;
  bucket?: string;
  expected: string;
  actual: string;
  delta: string;
}

async function main() {
  const asJson = process.argv.includes("--json");
  const quiet = process.argv.includes("--quiet") || asJson;
  const log = (msg: string) => {
    if (!quiet) console.log(msg);
  };

  const drifts: Drift[] = [];

  // ---- I4: per-user ledger vs stored buckets --------------------------------
  log("Reconciling user balances against the ledger...");

  // Aggregate ledger deltas per user per bucket, in SQL — a full ledger scan in
  // JavaScript would not survive a real transaction volume.
  const ledgerRows = await prisma.$queryRaw<
    Array<{ userId: number; bucket: string; delta: string }>
  >`
    SELECT "userId", bucket, SUM(delta)::text AS delta
    FROM (
      SELECT "userId", "balanceBucketTo" AS bucket, "amountAtomic" AS delta
        FROM "economy_transactions"
       WHERE "userId" IS NOT NULL
         AND "status" <> 'FAILED'
         AND "balanceBucketTo" IN ('PENDING','AVAILABLE','LOCKED','WITHDRAWN')
      UNION ALL
      SELECT "userId", "balanceBucketFrom" AS bucket, -"amountAtomic" AS delta
        FROM "economy_transactions"
       WHERE "userId" IS NOT NULL
         AND "status" <> 'FAILED'
         AND "balanceBucketFrom" IN ('PENDING','AVAILABLE','LOCKED','WITHDRAWN')
    ) legs
    GROUP BY "userId", bucket
  `;

  const expected = new Map<number, Record<string, bigint>>();
  for (const row of ledgerRows) {
    const perUser = expected.get(row.userId) ?? {};
    perUser[row.bucket] = BigInt(row.delta ?? "0");
    expected.set(row.userId, perUser);
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      pendingBalance: true,
      availableBalance: true,
      lockedBalance: true,
      withdrawnBalance: true,
      geekBalance: true,
    },
  });

  for (const user of users) {
    const exp = expected.get(user.id) ?? {};

    for (const [bucket, field] of Object.entries(BUCKET_FIELD)) {
      const actual = toBigInt(user[field as keyof typeof user] as never);
      const want = exp[bucket] ?? 0n;

      if (actual !== want) {
        drifts.push({
          kind: "USER",
          subject: `${user.username} (#${user.id})`,
          bucket,
          expected: fromAtomic(want),
          actual: fromAtomic(actual),
          delta: fromAtomic(actual - want),
        });
      }

      // I1-I3: no negative balances, whatever the ledger says.
      if (actual < 0n) {
        drifts.push({
          kind: "NEGATIVE",
          subject: `${user.username} (#${user.id})`,
          bucket,
          expected: "0 or more",
          actual: fromAtomic(actual),
          delta: fromAtomic(actual),
        });
      }
    }

    // The deprecated shadow column must track availableBalance exactly. A
    // mismatch means some caller is still writing geekBalance directly —
    // which is the whole reason the column is kept during migration.
    const shadow = toAtomic(user.geekBalance.toString());
    const available = toBigInt(user.availableBalance);
    if (shadow !== available) {
      drifts.push({
        kind: "SHADOW",
        subject: `${user.username} (#${user.id})`,
        bucket: "geekBalance",
        expected: fromAtomic(available),
        actual: fromAtomic(shadow),
        delta: fromAtomic(shadow - available),
      });
    }
  }

  // ---- Treasury accounts vs ledger -----------------------------------------
  log("Reconciling treasury accounts against the ledger...");

  const treasuryRows = await prisma.$queryRaw<Array<{ bucket: string; delta: string }>>`
    SELECT bucket, SUM(delta)::text AS delta
    FROM (
      SELECT "balanceBucketTo" AS bucket, "amountAtomic" AS delta
        FROM "economy_transactions"
       WHERE "status" <> 'FAILED' AND "balanceBucketTo" LIKE 'TREASURY_%'
      UNION ALL
      SELECT "balanceBucketFrom" AS bucket, -"amountAtomic" AS delta
        FROM "economy_transactions"
       WHERE "status" <> 'FAILED' AND "balanceBucketFrom" LIKE 'TREASURY_%'
    ) legs
    GROUP BY bucket
  `;

  const expectedTreasury: Record<string, bigint> = {};
  for (const account of TREASURY_ACCOUNTS) expectedTreasury[account] = 0n;
  for (const row of treasuryRows) {
    if (!isTreasuryBucket(row.bucket)) continue;
    expectedTreasury[treasuryAccountOf(row.bucket)] = BigInt(row.delta ?? "0");
  }

  const actualTreasury = await treasuryBalances(prisma);
  for (const account of TREASURY_ACCOUNTS) {
    const want = expectedTreasury[account] ?? 0n;
    const have = actualTreasury[account] ?? 0n;
    if (want !== have) {
      drifts.push({
        kind: "TREASURY",
        subject: account,
        expected: fromAtomic(want),
        actual: fromAtomic(have),
        delta: fromAtomic(have - want),
      });
    }
  }

  // ---- I5: solvency ---------------------------------------------------------
  log("Checking solvency...");
  const rules = await getRules(prisma);
  const liabilities = await userLiabilities(prisma);
  const backing =
    (actualTreasury.REWARD_RESERVE ?? 0n) +
    (actualTreasury.CREATOR_REWARD_POOL ?? 0n) +
    (actualTreasury.TOURNAMENT_POOL ?? 0n) +
    (actualTreasury.OPERATIONS_TREASURY ?? 0n) +
    (actualTreasury.WITHDRAWAL_HOT_WALLET ?? 0n);

  const solvencyRatio =
    liabilities.totalUserLiability === 0n
      ? Infinity
      : Number(fromAtomic(backing)) / Number(fromAtomic(liabilities.totalUserLiability));

  if (backing < liabilities.totalUserLiability) {
    drifts.push({
      kind: "SOLVENCY",
      subject: "protocol",
      expected: `backing >= ${fromAtomic(liabilities.totalUserLiability)}`,
      actual: fromAtomic(backing),
      delta: fromAtomic(backing - liabilities.totalUserLiability),
    });
  }

  // ---- Report ---------------------------------------------------------------
  const totalDrift = drifts.reduce((sum, d) => sum + absBig(toAtomic(d.delta)), 0n);
  const ok = drifts.length === 0;

  await prisma.reconciliationRun.create({
    data: {
      ok,
      usersChecked: users.length,
      driftCount: drifts.length,
      totalDriftAtomic: totalDrift.toString(),
      solvencyRatio: Number.isFinite(solvencyRatio) ? solvencyRatio : 0,
      report: { drifts: drifts.slice(0, 200) } as never,
    },
  });

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          ok,
          usersChecked: users.length,
          driftCount: drifts.length,
          totalDrift: fromAtomic(totalDrift),
          solvencyRatio: Number.isFinite(solvencyRatio) ? solvencyRatio : null,
          liabilities: {
            pending: fromAtomic(liabilities.totalPending),
            available: fromAtomic(liabilities.totalAvailable),
            locked: fromAtomic(liabilities.totalLocked),
            total: fromAtomic(liabilities.totalUserLiability),
          },
          backing: fromAtomic(backing),
          drifts,
        },
        null,
        2
      )
    );
  } else {
    console.log("\n" + "=".repeat(72));
    console.log(`Users checked:      ${users.length}`);
    console.log(`Total liability:    ${fromAtomic(liabilities.totalUserLiability)} GEEK`);
    console.log(`  pending:          ${fromAtomic(liabilities.totalPending)} GEEK`);
    console.log(`  available:        ${fromAtomic(liabilities.totalAvailable)} GEEK`);
    console.log(`  locked:           ${fromAtomic(liabilities.totalLocked)} GEEK`);
    console.log(`Treasury backing:   ${fromAtomic(backing)} GEEK`);
    console.log(
      `Solvency ratio:     ${Number.isFinite(solvencyRatio) ? solvencyRatio.toFixed(4) : "n/a (no liability)"}` +
        (Number.isFinite(solvencyRatio) && solvencyRatio < rules.treasury.solvencyWarnRatio
          ? `  ⚠ below warn threshold ${rules.treasury.solvencyWarnRatio}`
          : "")
    );
    console.log("=".repeat(72));

    if (ok) {
      console.log("\n✓ Reconciled. No drift.\n");
    } else {
      console.log(`\n✗ ${drifts.length} discrepancies (total drift ${fromAtomic(totalDrift)} GEEK):\n`);
      for (const d of drifts.slice(0, 50)) {
        console.log(
          `  [${d.kind}] ${d.subject}${d.bucket ? ` · ${d.bucket}` : ""}\n` +
            `        expected ${d.expected}, stored ${d.actual}  (delta ${d.delta})`
        );
      }
      if (drifts.length > 50) console.log(`  ... and ${drifts.length - 50} more`);
      console.log("");
    }
  }

  process.exitCode = ok ? 0 : 1;
}

function absBig(v: bigint): bigint {
  return v < 0n ? -v : v;
}

main()
  .catch((err) => {
    console.error("economy:reconcile failed:", err);
    process.exitCode = 2;
  })
  .finally(() => prisma.$disconnect());
