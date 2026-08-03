/**
 * Production readiness check. Run before every deploy:
 *
 *   NODE_ENV=production npm run preflight   (from apps/api)
 *
 * Verifies configuration, then that Postgres and Redis are actually reachable
 * with the credentials provided. Exits non-zero on any blocking problem so it
 * can gate a CI pipeline.
 */
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { inspectConfig, formatProblems, IS_PRODUCTION } from "../lib/config";
import { PAYOUT_LANES, PAYOUT_CONCURRENCY } from "../lib/payoutQueue";
import { generateKeypair } from "../lib/kaspaCrypto";
import { isValidKaspaAddress, networkPrefix } from "../lib/kaspaAddress";

let failures = 0;
const ok = (m: string) => console.log(`  ✓ ${m}`);
const bad = (m: string) => {
  console.log(`  ✗ ${m}`);
  failures++;
};
const warn = (m: string) => console.log(`  ! ${m}`);

async function main() {
  console.log(`\nGeek Protocol preflight — NODE_ENV=${process.env.NODE_ENV || "development"}\n`);

  console.log("Configuration");
  const problems = inspectConfig();
  if (problems.length === 0) {
    ok("all required secrets present and non-default");
  } else {
    console.log(formatProblems(problems));
    failures += problems.filter((p) => p.level === "error").length;
  }

  console.log("\nDatabase");
  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    ok("PostgreSQL reachable");
    const [users, questions] = await Promise.all([
      prisma.user.count(),
      prisma.question.count({ where: { status: "approved" } }),
    ]);
    ok(`schema readable (${users} users, ${questions} approved questions)`);
    if (questions === 0) warn("no approved questions — quizzes will have nothing to serve");
  } catch (err) {
    bad(`PostgreSQL unreachable: ${(err as Error).message}`);
  }

  console.log("\nRedis");
  const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });
  try {
    await redis.connect();
    const pong = await redis.ping();
    if (pong === "PONG") ok("Redis reachable");
    else bad(`unexpected Redis reply: ${pong}`);

    // GETDEL backs single-use login nonces; it needs Redis 6.2+.
    const probe = `preflight:${Date.now()}`;
    await redis.set(probe, "1");
    if (typeof (redis as unknown as { getdel?: unknown }).getdel === "function") {
      await redis.getdel(probe);
      ok("GETDEL supported (required for single-use login nonces)");
    } else {
      await redis.del(probe);
      warn("GETDEL unavailable — nonce consumption falls back to DEL");
    }
  } catch (err) {
    bad(`Redis unreachable: ${(err as Error).message}`);
  }

  console.log("\nPayout pipeline");
  ok(`${PAYOUT_LANES} lanes × ${PAYOUT_CONCURRENCY} concurrency = ${PAYOUT_LANES * PAYOUT_CONCURRENCY} parallel payouts`);
  const rewardsOn = process.env.ENABLE_REWARDS === "true";
  const provider = process.env.KASPA_TRANSFER_PROVIDER || "none";
  if (!rewardsOn) {
    warn("ENABLE_REWARDS=false — balances are credited in the database only, nothing settles on-chain");
  } else if (provider === "none") {
    bad("ENABLE_REWARDS=true but KASPA_TRANSFER_PROVIDER=none — payouts will fail loudly rather than settle");
  } else {
    ok(`on-chain transfers via provider "${provider}"`);
  }
  warn("remember to run the worker process (npm run worker) — the API does not process payouts");

  console.log("\nKaspa");
  try {
    const prefix = networkPrefix();
    const w = generateKeypair(prefix);
    if (isValidKaspaAddress(w.address, prefix)) ok(`keypair generation works (${prefix})`);
    else bad("generated address failed its own validation");
  } catch (err) {
    bad(`keypair generation failed: ${(err as Error).message}`);
  }
  if (process.env.DEMO_MODE === "true") {
    if (IS_PRODUCTION) bad("DEMO_MODE=true in production disables wallet signature verification");
    else warn("DEMO_MODE=true — wallet signatures are NOT verified");
  } else {
    ok("DEMO_MODE off — wallet signatures are verified");
  }

  console.log(
    failures === 0
      ? "\nPreflight passed.\n"
      : `\nPreflight FAILED with ${failures} blocking problem(s).\n`
  );

  await prisma.$disconnect().catch(() => {});
  redis.disconnect();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Preflight crashed:", err);
  process.exit(1);
});
