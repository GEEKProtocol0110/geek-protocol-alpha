#!/usr/bin/env node
/**
 * lint:claims — enforce ECONOMY.md §19.1.
 *
 * Fails the build if a banned marketing claim appears in the web source.
 *
 * The homepage said "All Hope. No Hype." while promising on-chain settlement
 * the software does not perform. This script is what stops those claims coming
 * back the next time someone writes copy in a hurry: a claim about settlement,
 * finality, or on-chain records now has to survive a grep before it ships.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("../src", import.meta.url).pathname;

/**
 * Each rule is a pattern plus the honest replacement. The `why` is included in
 * the failure output so the person who hits it understands the reason rather
 * than just working around the regex.
 */
const BANNED = [
  {
    id: "instant-onchain-payout",
    pattern: /paid in \$?GEEK the moment you finish|instant.{0,20}real settlement|settlement lands on kaspa/i,
    replacement:
      "Earn internal Alpha GEEK balances while we test Proof-of-Learning. On-chain KRC-20 withdrawals are not enabled yet.",
    why: "KRC-20 transfer is a stub. No reward is settled on-chain.",
  },
  {
    id: "settlement-seconds",
    pattern: /under \d+\s*[- ]?second(s)? settlement|settle[sd]? .{0,20}in under \d+ seconds/i,
    replacement: "(remove — there is no settlement path to time)",
    why: "There is no settlement, so there is no settlement time.",
  },
  {
    id: "direct-to-wallet",
    pattern: /direct rewards to your wallet|rewards? (sent|paid) (directly )?to your wallet/i,
    replacement: "Rewards are credited to your internal Alpha balance.",
    why: "Nothing is sent to a user wallet.",
  },
  {
    id: "millisecond-finality",
    pattern: /finality in milliseconds|millisecond finality|instant finality/i,
    replacement: "Rapid block inclusion and growing proof-of-work confirmation confidence.",
    why: "Proof-of-work confidence is probabilistic; block production is not finality.",
  },
  {
    id: "krc20-native",
    pattern: /krc-?20[- ]native|native krc-?20 token standard/i,
    replacement: "Live KRC-20 token on Kaspa",
    why: "KRC-20 runs through Kasplex and compatible indexers; it is not a native consensus token standard.",
  },
  {
    id: "fastest-smart-contract-chain",
    pattern: /fastest smart[- ]contract (blockchain|chain)/i,
    replacement:
      "Kaspa is a fair-launched proof-of-work blockDAG operating at 10 blocks per second, now supporting covenant-based programmability through Toccata.",
    why: "Unfalsifiable superlative that invites argument and is not accurate as stated.",
  },
  {
    id: "onchain-reputation",
    pattern:
      /(every )?achievement.{0,30}(recorded )?on[- ]chain|reputation is permanent|skill profiles? live on[- ]chain|on[- ]chain (identity|reputation)/i,
    replacement:
      "Build a persistent GEEK Protocol knowledge profile. Future releases will explore portable and on-chain achievement proofs.",
    why: "XP, streaks, profiles and achievements are database records.",
  },
  {
    id: "no-signups-no-database",
    pattern: /no passwords, ?no ?signups|no central database holding your data/i,
    replacement:
      "Connect with KasWare or create an Alpha account. Wallet users retain control of their wallet; email accounts use a protocol-managed encrypted wallet during Alpha.",
    why: "The product offers email/password accounts with protocol-managed custodial wallets.",
  },
  {
    id: "ace-settles-onchain",
    pattern: /A\.?C\.?E\.?[^.]{0,60}settle[sd]?[^.]{0,20}on[- ]chain/i,
    replacement: "A.C.E. is the character and future intelligence layer.",
    why: "A.C.E. provides presentation and tips; the payout worker handles reward jobs.",
  },
  {
    id: "team-allocation",
    pattern: /team (and|&) advisors?\s*[:\-]?\s*\d+\s*%/i,
    replacement:
      "Distinguish total minted supply, tokens actually controlled by the project, and the intended use of project-held reserves.",
    why: "A genesis allocation table contradicts the fair-launch story and reads as an insider allocation.",
  },
  {
    id: "staking-claim",
    pattern: /staking\s*[:\-]?\s*\d+\s*%|stake your \$?GEEK|staking rewards/i,
    replacement: "(remove — there is no staking system)",
    why: "No staking system exists.",
  },
  {
    id: "mainnet-ready",
    pattern: /kaspa mainnet ready|mainnet[- ]ready|live on kaspa mainnet/i,
    replacement: "Mainnet KRC-20 payouts: in development.",
    why: "Mainnet GEEK deployment and payouts are unfinished.",
  },
];

/** Copy inside these files is allowed to quote the banned strings. */
const EXEMPT = [/lint-claims\.mjs$/, /\/legal\//, /honesty/i, /\.test\.tsx?$/];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(tsx?|mdx?|css)$/.test(full)) out.push(full);
  }
  return out;
}

const violations = [];

for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file);
  if (EXEMPT.some((re) => re.test(file))) continue;

  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (line.includes("claims-lint-ignore")) return;
    for (const rule of BANNED) {
      if (rule.pattern.test(line)) {
        violations.push({ file: rel, line: i + 1, rule, text: line.trim().slice(0, 160) });
      }
    }
  });
}

if (violations.length === 0) {
  console.log("lint:claims — clean. No banned claims in the web source.");
  process.exit(0);
}

console.error(`\nlint:claims — ${violations.length} banned claim(s) found:\n`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  [${v.rule.id}]`);
  console.error(`    ${v.text}`);
  console.error(`    why:     ${v.rule.why}`);
  console.error(`    instead: ${v.rule.replacement}\n`);
}
console.error("See ECONOMY.md §19.1. Add `claims-lint-ignore` on the line only after review.\n");
process.exit(1);
