/**
 * economy:migrate-balances — one-time migration of the legacy `geekBalance`
 * column into the four-bucket model, with a ledger entry for every user so the
 * books reconcile from day one (ECONOMY.md §20.1).
 *
 *   npm run economy:migrate-balances -- --dry-run   # report only, no writes
 *   npm run economy:migrate-balances                # apply
 *
 * Idempotent: every user's entry uses the key `migration:v1:{userId}`, so a
 * second run moves nothing.
 *
 * The pre-existing liability is debited from OPERATIONS_TREASURY rather than
 * conjured from nowhere. If the treasury cannot cover it, the script says so
 * and tells you exactly how much funding is required — an honest shortfall
 * beats a set of books that silently do not add up.
 */

import { PrismaClient } from "@prisma/client";
import { applyMovement, withEconomyTransaction, lockUser } from "../services/economy/ledger";
import { treasuryBucket } from "../services/economy/types";
import { toAtomic, toBigInt, fromAtomic, toDecimal } from "../services/economy/units";
import { ensureEconomyBootstrapped } from "../services/economy/bootstrap";
import { treasuryBalances } from "../services/economy/treasury";

const prisma = new PrismaClient();

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const autoFund = process.argv.includes("--auto-fund");

  await ensureEconomyBootstrapped(prisma);

  const users = await prisma.user.findMany({
    where: { geekBalance: { gt: 0 } },
    select: { id: true, username: true, geekBalance: true, availableBalance: true },
  });

  console.log(`Found ${users.length} users with a non-zero legacy balance.\n`);

  // Which of them have already been migrated?
  const existingKeys = new Set(
    (
      await prisma.economyTransaction.findMany({
        where: { idempotencyKey: { startsWith: "migration:v1:" } },
        select: { idempotencyKey: true },
      })
    ).map((r) => r.idempotencyKey)
  );

  const pending = users.filter((u) => !existingKeys.has(`migration:v1:${u.id}`));
  const totalAtomic = pending.reduce((sum, u) => sum + toAtomic(u.geekBalance.toString()), 0n);

  console.log(`Already migrated: ${users.length - pending.length}`);
  console.log(`To migrate:       ${pending.length}`);
  console.log(`Total to credit:  ${fromAtomic(totalAtomic)} GEEK\n`);

  if (pending.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  // Can the treasury actually cover this liability?
  const balances = await treasuryBalances(prisma);
  const operations = balances.OPERATIONS_TREASURY ?? 0n;

  if (operations < totalAtomic) {
    const shortfall = totalAtomic - operations;
    console.log(`OPERATIONS_TREASURY holds ${fromAtomic(operations)} GEEK.`);
    console.log(`Shortfall: ${fromAtomic(shortfall)} GEEK.\n`);

    if (!autoFund) {
      console.log("These balances already exist as a liability to your users, so they must be");
      console.log("backed by something. Either:");
      console.log(`  1. Fund the treasury:  ECONOMY_GENESIS_OPERATIONS_GEEK=${fromAtomic(totalAtomic)} npm run economy:seed -- --fund`);
      console.log("  2. Re-run with --auto-fund to record the shortfall as explicit genesis");
      console.log("     funding of OPERATIONS_TREASURY (it will appear in the ledger as such).\n");
      process.exitCode = 1;
      return;
    }

    if (!dryRun) {
      // Record the pre-existing liability as explicit funding. This does not
      // create backing — it makes the unbacked amount visible in the ledger and
      // on the health endpoint instead of hiding it.
      await withEconomyTransaction(prisma, (tx) =>
        applyMovement(tx, {
          type: "TREASURY_FUNDING",
          amount: shortfall,
          from: "EXTERNAL",
          to: treasuryBucket("OPERATIONS_TREASURY"),
          idempotencyKey: "migration:v1:opening-liability",
          referenceType: "MIGRATION",
          metadata: {
            note:
              "Opening liability for balances that existed before the ledger. " +
              "Recorded so the books reconcile; this is NOT evidence of on-chain backing.",
          },
        })
      );
      console.log(`Recorded ${fromAtomic(shortfall)} GEEK of opening liability.\n`);
    }
  }

  if (dryRun) {
    console.log("--dry-run: no changes written.");
    for (const u of pending.slice(0, 20)) {
      console.log(`  ${u.username} (#${u.id}): ${u.geekBalance.toString()} GEEK → availableBalance`);
    }
    if (pending.length > 20) console.log(`  ... and ${pending.length - 20} more`);
    return;
  }

  let migrated = 0;
  let failed = 0;

  for (const user of pending) {
    const amount = toAtomic(user.geekBalance.toString());
    if (amount <= 0n) continue;

    try {
      await withEconomyTransaction(prisma, async (tx) => {
        await lockUser(tx, user.id);

        // Move the legacy balance into AVAILABLE via a real ledger entry.
        await applyMovement(tx, {
          userId: user.id,
          type: "ADMIN_ADJUSTMENT",
          amount,
          from: treasuryBucket("OPERATIONS_TREASURY"),
          to: "AVAILABLE",
          referenceType: "MIGRATION",
          referenceId: "v1",
          idempotencyKey: `migration:v1:${user.id}`,
          metadata: {
            note: "Legacy geekBalance migrated to the four-bucket model",
            legacyBalance: user.geekBalance.toString(),
          },
        });

        // applyMovement already syncs the shadow column, but be explicit: after
        // migration geekBalance must equal availableBalance exactly, because
        // reconciliation treats any difference as a caller writing it directly.
        const after = await tx.user.findUnique({
          where: { id: user.id },
          select: { availableBalance: true },
        });
        if (after) {
          await tx.user.update({
            where: { id: user.id },
            data: { geekBalance: toDecimal(toBigInt(after.availableBalance)).div(1e8) },
          });
        }
      });

      migrated++;
      if (migrated % 100 === 0) console.log(`  ... ${migrated}/${pending.length}`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${user.username} (#${user.id}):`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`\nMigrated ${migrated} users. ${failed} failed.`);
  console.log("Now run: npm run economy:reconcile");
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error("economy:migrate-balances failed:", err);
    process.exitCode = 2;
  })
  .finally(() => prisma.$disconnect());
