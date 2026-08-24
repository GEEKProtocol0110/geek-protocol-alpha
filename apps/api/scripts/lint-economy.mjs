#!/usr/bin/env node
/**
 * lint:economy — enforce ECONOMY.md §0.
 *
 * Fails the build if anything outside `src/services/economy/` writes a balance
 * column, or if a suspicious pattern that has caused real bugs here reappears.
 *
 * This is the guard that keeps the "one central Economy Service" rule true six
 * months from now, when someone adds a feature in a hurry.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = new URL("../src", import.meta.url).pathname;

/** Files permitted to move balances. */
const ALLOWED_PREFIXES = [
  `services${sep}economy${sep}`,
  `scripts${sep}economyMigrateBalances.ts`,
  `scripts${sep}economySeed.ts`,
  `scripts${sep}economyReconcile.ts`,
];

const RULES = [
  {
    id: "direct-balance-write",
    // Any Prisma data payload assigning to a balance bucket.
    pattern:
      /\b(availableBalance|pendingBalance|lockedBalance|withdrawnBalance)\s*:\s*\{?\s*(increment|decrement|set)\b/,
    message:
      "writes a balance bucket directly. Every movement must go through EconomyService (ECONOMY.md §0).",
  },
  {
    id: "legacy-geekbalance-write",
    pattern: /\bgeekBalance\s*:\s*\{\s*(increment|decrement)\b/,
    message:
      "writes the deprecated geekBalance column. It is a read-only shadow of availableBalance; use EconomyService.",
  },
  {
    id: "treasury-write",
    pattern: /\bbalanceAtomic\s*:\s*\{\s*(increment|decrement)\b/,
    message: "writes a treasury balance directly. Use applyMovement so a ledger row is written with it.",
  },
  {
    id: "fabricated-txid",
    // The specific bug this replaced: `withdraw_tx_${Date.now()}`.
    pattern: /(txid|Txid)\s*[:=]\s*[`'"](?:withdraw|burn|payout|tx)_?\$?\{?/,
    message:
      "looks like a fabricated transaction id. A txid may only ever come from a real broadcast (ECONOMY.md §12).",
  },
  {
    id: "float-token-math",
    // Multiplying/dividing by 1e8 outside the units module means float math on
    // token amounts, which is how rounding drift enters a ledger.
    pattern: /\*\s*1e8|\/\s*1e8|\*\s*100_?000_?000\b(?!n)/,
    message:
      "does token arithmetic with floating-point 1e8. Use toAtomic/fromAtomic from services/economy/units.",
  },
];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(full) && !/\.test\.ts$/.test(full)) out.push(full);
  }
  return out;
}

function isAllowed(relPath) {
  return ALLOWED_PREFIXES.some((prefix) => relPath.startsWith(prefix));
}

const violations = [];

for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file);
  if (isAllowed(rel)) continue;

  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    // An explicit opt-out, for the rare reviewed exception.
    if (line.includes("economy-lint-ignore")) return;

    for (const rule of RULES) {
      if (rule.pattern.test(line)) {
        violations.push({ file: rel, line: i + 1, rule: rule.id, message: rule.message, text: line.trim() });
      }
    }
  });
}

if (violations.length === 0) {
  console.log("lint:economy — clean. All balance movements go through EconomyService.");
  process.exit(0);
}

console.error(`\nlint:economy — ${violations.length} violation(s):\n`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  [${v.rule}]`);
  console.error(`    ${v.text}`);
  console.error(`    → ${v.message}\n`);
}
console.error("Add `// economy-lint-ignore` on the line only after review.\n");
process.exit(1);
