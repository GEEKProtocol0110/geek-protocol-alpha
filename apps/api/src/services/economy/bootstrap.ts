/**
 * Economy bootstrap.
 *
 * Creates the rows the economy assumes exist: eight treasury accounts, the
 * reward budgets, the circuit breakers, and the single runtime config row.
 *
 * Idempotent — safe to run on every boot, and safe to run concurrently from
 * several instances, because everything is an upsert on a unique key.
 *
 * It deliberately does NOT fund the treasury. Funding is an explicit operator
 * action (`economy:seed --fund` or the admin endpoint), because a boot script
 * that silently mints a reward reserve is how unfunded GEEK gets created.
 */

import type { PrismaClient } from "@prisma/client";
import { ensureTreasuryAccounts } from "./treasury";
import { ensureBreakersExist } from "./breakers";
import { syncBudgetsFromRules } from "./budget";
import { DEFAULT_RULES } from "./rules";
import { invalidateConfigCache } from "./config";
import { logger } from "../../lib/logger";

export async function ensureEconomyBootstrapped(prisma: PrismaClient): Promise<void> {
  try {
    // 1. The config row first — budgets are derived from its rules.
    await prisma.economyRuntimeConfig.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        stage: Math.max(1, Math.min(6, parseInt(process.env.ECONOMY_STAGE || "1", 10) || 1)),
        rules: DEFAULT_RULES as never,
        // Real money stays off until an operator turns it on at stage 5+.
        withdrawalsEnabled: false,
        purchasesEnabled: false,
        burnEnabled: false,
      },
      update: {},
    });
    invalidateConfigCache();

    await ensureTreasuryAccounts(prisma);
    await ensureBreakersExist(prisma);
    await syncBudgetsFromRules(prisma);
  } catch (err) {
    // A bootstrap failure is serious but must not wedge the process in a crash
    // loop: gameplay and XP work without it, and grants fail closed.
    logger.error({ err }, "economy.bootstrap_failed");
    throw err;
  }
}
