/**
 * economy:seed — create treasury accounts, budgets, breakers and the config row.
 *
 *   npm run economy:seed              # structure only, funds nothing
 *   npm run economy:seed -- --fund    # also funds from ECONOMY_GENESIS_* env vars
 *
 * Funding is opt-in and idempotent: the ledger entry uses a fixed key, so
 * running it twice funds once. It is separate from the structural seed because
 * creating a reward reserve is a real economic act, not a housekeeping step.
 */

import { PrismaClient } from "@prisma/client";
import { ensureEconomyBootstrapped } from "../services/economy/bootstrap";
import { fundTreasury, treasuryBalances } from "../services/economy/treasury";
import { withEconomyTransaction } from "../services/economy/ledger";
import { toAtomic, fromAtomic } from "../services/economy/units";
import { TREASURY_ACCOUNTS, type TreasuryAccountName } from "../services/economy/types";
import { budgetStatus } from "../services/economy/budget";

const prisma = new PrismaClient();

/** Genesis funding per account, read from the environment. */
const FUNDING_ENV: Record<TreasuryAccountName, string> = {
  REWARD_RESERVE: "ECONOMY_GENESIS_REWARD_RESERVE_GEEK",
  CREATOR_REWARD_POOL: "ECONOMY_GENESIS_CREATOR_POOL_GEEK",
  TOURNAMENT_POOL: "ECONOMY_GENESIS_TOURNAMENT_POOL_GEEK",
  OPERATIONS_TREASURY: "ECONOMY_GENESIS_OPERATIONS_GEEK",
  WITHDRAWAL_HOT_WALLET: "ECONOMY_GENESIS_HOT_WALLET_GEEK",
  EMERGENCY_RESERVE: "ECONOMY_GENESIS_EMERGENCY_RESERVE_GEEK",
  BURN_PENDING: "",
  BURN_CONFIRMED: "",
};

async function main() {
  const shouldFund = process.argv.includes("--fund");

  console.log("Bootstrapping economy structure...");
  await ensureEconomyBootstrapped(prisma);
  console.log("  ✓ runtime config, 8 treasury accounts, budgets, circuit breakers");

  if (shouldFund) {
    console.log("\nFunding treasury from environment...");
    for (const account of TREASURY_ACCOUNTS) {
      const envName = FUNDING_ENV[account];
      if (!envName) continue;

      const raw = process.env[envName];
      if (!raw) {
        console.log(`  · ${account}: ${envName} not set, skipping`);
        continue;
      }

      const amount = toAtomic(raw);
      if (amount <= 0n) continue;

      await withEconomyTransaction(prisma, (tx) =>
        fundTreasury(tx, account, amount, `treasury:genesis:${account}:v1`, "Genesis funding via economy:seed")
      );
      console.log(`  ✓ ${account}: +${fromAtomic(amount)} GEEK`);
    }
  } else {
    console.log("\nNo funding applied. Re-run with --fund to apply ECONOMY_GENESIS_* values.");
  }

  const balances = await treasuryBalances(prisma);
  console.log("\nTreasury:");
  for (const [account, value] of Object.entries(balances)) {
    console.log(`  ${account.padEnd(24)} ${fromAtomic(value).padStart(18)} GEEK`);
  }

  const budgets = await budgetStatus(prisma);
  console.log("\nBudgets (daily):");
  for (const b of budgets) {
    const state = b.enabled ? "" : "  (disabled)";
    console.log(`  ${b.name.padEnd(16)} ${fromAtomic(b.dailyLimit).padStart(12)} GEEK${state}`);
  }

  console.log("\nDone. Run `npm run economy:reconcile` to verify.");
}

main()
  .catch((err) => {
    console.error("economy:seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
