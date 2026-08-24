/**
 * economy:health — print the economy health report to a terminal.
 * The same data the admin dashboard and `GET /api/economy/health` serve.
 */

import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { economyHealth } from "../services/economy/treasury";
import { fromAtomic } from "../services/economy/units";
import { STAGE_LABELS } from "../services/economy/config";

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 1,
  lazyConnect: true,
});

function row(label: string, value: string) {
  console.log(`  ${label.padEnd(30)} ${value.padStart(20)}`);
}

async function main() {
  // Redis is optional here: without it we simply cannot report the heartbeat.
  let redisAvailable = true;
  try {
    await redis.connect();
  } catch {
    redisAvailable = false;
  }

  const health = await economyHealth(prisma, redisAvailable ? redis : undefined);

  console.log("\nGEEK PROTOCOL — ECONOMY HEALTH");
  console.log("=".repeat(54));
  console.log(`Stage: ${health.stage} — ${STAGE_LABELS[health.stage] ?? "unknown"}\n`);

  console.log("TREASURY");
  for (const [account, value] of Object.entries(health.treasury)) {
    row(account, `${fromAtomic(value)} GEEK`);
  }

  console.log("\nUSER LIABILITIES");
  row("pending", `${fromAtomic(health.liabilities.totalPending)} GEEK`);
  row("available", `${fromAtomic(health.liabilities.totalAvailable)} GEEK`);
  row("locked", `${fromAtomic(health.liabilities.totalLocked)} GEEK`);
  row("TOTAL OWED TO USERS", `${fromAtomic(health.liabilities.totalUserLiability)} GEEK`);
  row("withdrawn (lifetime)", `${fromAtomic(health.liabilities.totalWithdrawn)} GEEK`);
  row("users", String(health.liabilities.userCount));

  console.log("\nSOLVENCY");
  row("backing", `${fromAtomic(health.backing)} GEEK`);
  row("remaining reward capacity", `${fromAtomic(health.remainingRewardCapacity)} GEEK`);
  row("solvency ratio", Number.isFinite(health.solvencyRatio) ? health.solvencyRatio.toFixed(4) : "n/a");
  row("withdrawal obligations", `${fromAtomic(health.withdrawalObligations)} GEEK`);

  console.log("\nBURNS");
  row("pending (not broadcast)", `${fromAtomic(health.burns.pending)} GEEK`);
  row("confirmed on-chain", `${fromAtomic(health.burns.confirmed)} GEEK`);

  console.log("\nCIRCUIT BREAKERS");
  for (const [name, state] of Object.entries(health.breakers)) {
    row(name, state === "OPEN" ? "open" : `▲ ${state}`);
  }
  row(
    "worker heartbeat",
    health.workerHeartbeatAgeSeconds === null ? "never seen" : `${health.workerHeartbeatAgeSeconds}s ago`
  );

  console.log("\nBUDGETS (today)");
  for (const b of health.budgets) {
    row(
      `${b.name}${b.enabled ? "" : " (off)"}`,
      `${fromAtomic(b.dailyRemaining)} / ${fromAtomic(b.dailyLimit)} GEEK left`
    );
  }

  if (health.warnings.length) {
    console.log("\n⚠ WARNINGS");
    for (const w of health.warnings) console.log(`  · ${w}`);
  } else {
    console.log("\n✓ No warnings.");
  }
  console.log("");

  process.exitCode = health.healthy ? 0 : 1;
}

main()
  .catch((err) => {
    console.error("economy:health failed:", err);
    process.exitCode = 2;
  })
  .finally(async () => {
    await prisma.$disconnect();
    redis.disconnect();
  });
