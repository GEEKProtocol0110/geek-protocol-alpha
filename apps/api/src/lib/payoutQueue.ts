import { Queue, JobsOptions } from "bullmq";
import Redis from "ioredis";
import crypto from "crypto";

/**
 * Payouts used to run through a single BullMQ queue ("reward-processing") with a
 * single worker at BullMQ's default concurrency of 1. That capped the whole
 * platform at one on-chain send at a time — a tournament finishing 10k attempts
 * in the same second drained at a few payouts per minute.
 *
 * Payouts are now sharded across N independent lanes. Each lane is its own queue
 * with its own worker and its own concurrency, so throughput is
 * LANES * CONCURRENCY concurrent sends instead of 1.
 *
 * Lane assignment is deterministic on the payout key, which matters:
 *  - the same attemptId always lands on the same lane, so a retry can never race
 *    the original on a different worker;
 *  - payouts for one user stay in order relative to each other.
 */

export const PAYOUT_LANES = Math.max(1, parseInt(process.env.PAYOUT_LANES || "8", 10));
export const PAYOUT_CONCURRENCY = Math.max(
  1,
  parseInt(process.env.PAYOUT_CONCURRENCY || "25", 10)
);

/** Pre-shard queue name. Workers still drain it so in-flight jobs aren't stranded. */
export const LEGACY_PAYOUT_QUEUE = "reward-processing";

export type PayoutType = "quiz_reward" | "purchase_reward" | "withdrawal";

export interface PayoutJob {
  attemptId: string;
  userId: number;
  rewardAmount: number;
  type: PayoutType;
  toAddress?: string;
}

export function laneName(lane: number): string {
  return `reward-processing-${lane}`;
}

export function allLaneNames(): string[] {
  return Array.from({ length: PAYOUT_LANES }, (_, i) => laneName(i));
}

/**
 * Stable lane assignment. md5 (not a security boundary here — just a uniform
 * spread) so the mapping survives process restarts and is identical across the
 * API and worker processes.
 */
export function laneFor(key: string): number {
  const digest = crypto.createHash("md5").update(key).digest();
  return digest.readUInt32BE(0) % PAYOUT_LANES;
}

/**
 * Deterministic job id — BullMQ drops a duplicate add for an id already present,
 * which makes enqueueing idempotent at the source.
 *
 * BullMQ rejects ":" in custom ids, and attemptIds come from several places
 * (uuids, Stripe session ids, numeric withdrawal ids), so the readable part is
 * sanitized and a short digest is appended to keep distinct ids distinct even if
 * sanitizing maps two of them to the same string.
 */
export function payoutJobId(job: PayoutJob): string {
  const safe = job.attemptId.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 64);
  const digest = crypto
    .createHash("sha1")
    .update(`${job.type}|${job.attemptId}`)
    .digest("hex")
    .slice(0, 10);
  return `${job.type}-${safe}-${digest}`;
}

let connection: Redis | null = null;
let queues: Queue[] | null = null;

function getConnection(): Redis {
  if (!connection) {
    connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

function getQueues(): Queue[] {
  if (!queues) {
    const conn = getConnection();
    queues = allLaneNames().map(
      (name) =>
        new Queue(name, {
          connection: conn as never,
          defaultJobOptions: {
            attempts: 5,
            backoff: { type: "exponential", delay: 2000 },
            removeOnComplete: { age: 24 * 60 * 60, count: 5000 },
            removeOnFail: { age: 7 * 24 * 60 * 60 },
          },
        })
    );
  }
  return queues;
}

/**
 * Enqueue a payout onto its lane. Safe to call twice for the same payout — the
 * deterministic jobId makes the second add a no-op while the first is still
 * queued or active.
 */
export async function enqueuePayout(job: PayoutJob, opts: JobsOptions = {}) {
  const lane = laneFor(job.attemptId);
  const queue = getQueues()[lane];
  return queue.add("process-reward", job, { jobId: payoutJobId(job), ...opts });
}

/** Per-lane depth, for /health and for spotting a hot lane. */
export async function payoutQueueDepths() {
  const qs = getQueues();
  const counts = await Promise.all(
    qs.map(async (q, i) => {
      const c: Record<string, number> = await q.getJobCounts(
        "waiting",
        "active",
        "delayed",
        "failed"
      );
      return {
        lane: i,
        name: laneName(i),
        waiting: c.waiting ?? 0,
        active: c.active ?? 0,
        delayed: c.delayed ?? 0,
        failed: c.failed ?? 0,
      };
    })
  );
  return {
    lanes: PAYOUT_LANES,
    concurrencyPerLane: PAYOUT_CONCURRENCY,
    maxParallelPayouts: PAYOUT_LANES * PAYOUT_CONCURRENCY,
    perLane: counts,
    totalWaiting: counts.reduce((sum, c) => sum + c.waiting, 0),
    totalActive: counts.reduce((sum, c) => sum + c.active, 0),
    totalFailed: counts.reduce((sum, c) => sum + c.failed, 0),
  };
}

export async function closePayoutQueues() {
  if (queues) {
    await Promise.all(queues.map((q) => q.close()));
    queues = null;
  }
  if (connection) {
    await connection.quit();
    connection = null;
  }
}
