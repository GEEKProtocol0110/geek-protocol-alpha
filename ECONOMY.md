# GEEK Protocol — Economic Model

**Status: Alpha Stage 1 (internal balances only).**
No real KRC-20 transfer, purchase, withdrawal, or burn is enabled by this document.
Everything below describes rules the software enforces; the
[Operational Status](#22-operational-status) section states which parts are live,
which are simulated, and which are disabled.

---

## 0. The one architectural rule

> **No GEEK may be credited, spent, locked, burned, withdrawn, or distributed
> except through `EconomyService`, and every movement writes an
> `EconomyTransaction` row inside the same database transaction.**

The Gauntlet, Daily Quiz, CCE, stickers, power-ups, marketplace, purchases and
withdrawals do **not** touch `user.availableBalance` (or any other bucket)
directly. They call the service. This is the rule that prevents duplicate
credits and insolvency.

Enforced mechanically by `npm run lint:economy` (see §21), which fails the build
if any file outside `src/services/economy/` writes to a balance field.

---

## 1. Units

GEEK uses **8 decimals**.

```
1 GEEK = 100_000_000 atomic units (a.u.)
```

* Every amount in the ledger and every balance bucket is stored as
  `Decimal(30, 0)` holding **integer atomic units**.
* No JavaScript `number` is ever used for token accounting. The codebase uses
  `bigint` in memory and `Prisma.Decimal` at the database boundary.
* Display conversion happens once, at the API response boundary
  (`formatGeek()`), and never feeds back into accounting.

| Helper | Meaning |
|---|---|
| `toAtomic("12.5")` | `1_250_000_000n` |
| `fromAtomic(1_250_000_000n)` | `"12.5"` |
| `GEEK` | `100_000_000n` |

Rounding is always **floor** (truncate toward zero) so the protocol never
creates a fraction of an atomic unit it does not hold.

---

## 2. Balance structure

Every user has four balances. There is no single `geekBalance`.

| Bucket | Meaning | Spendable | Withdrawable |
|---|---|---|---|
| `pendingBalance` | Earned, still under validation / hold | No | No |
| `availableBalance` | Cleared, spendable inside the protocol | Yes | Yes |
| `lockedBalance` | Committed to a Gauntlet round, marketplace offer, withdrawal, or tournament | No | No |
| `withdrawnBalance` | Cumulative total successfully settled on-chain | — | Already gone |

`withdrawnBalance` is a **lifetime counter**, not a spendable pool. It only ever
increases.

### 2.1 Invariants

```
I1.  availableBalance >= 0        for all users
I2.  pendingBalance   >= 0        for all users
I3.  lockedBalance    >= 0        for all users
I4.  For every user: sum of all ledger deltas into a bucket
     == the stored value of that bucket                          (§14.3)
I5.  SUM(availableBalance + pendingBalance + lockedBalance)
     <= RewardReserve + WithdrawalHotWallet + OperationsTreasury  (solvency)
I6.  Every EconomyTransaction has a unique idempotencyKey
I7.  BURN_CONFIRMED requires a non-null onChainRevealTxid
```

I1–I3 are enforced by database `CHECK` constraints, not just application code.
I4–I5 are verified by `npm run economy:reconcile` (§20).

### 2.2 Legal bucket transitions

```
TREASURY:<bucket>  ──▶ pending        reward granted, under validation
pending            ──▶ available      validation period cleared
pending            ──▶ TREASURY:...   fraud reversal / expiry
available          ──▶ locked         entry fee, offer, withdrawal request
locked             ──▶ TREASURY:...   fee consumed (→ 70/30 split)
locked             ──▶ available      refund / release / cancelled withdrawal
locked             ──▶ withdrawn      on-chain settlement confirmed
available          ──▶ TREASURY:...   purchase of power-up / sticker / listing fee
TREASURY:...       ──▶ available      direct credit (cashout, marketplace sale)
TREASURY:A         ──▶ TREASURY:B     internal treasury movement (recycle, burn)
```

Anything not in this table is rejected by `assertLegalTransition()`.

---

## 3. Treasury structure

Eight accounting buckets, each a row in `TreasuryAccount`:

| Account | Purpose |
|---|---|
| `REWARD_RESERVE` | Funds all gameplay rewards. Depleted by rewards, refilled by recycling. |
| `CREATOR_REWARD_POOL` | Funds CCE creator + reviewer rewards and royalties. |
| `TOURNAMENT_POOL` | Funds tournament prize pools. |
| `OPERATIONS_TREASURY` | Platform revenue: fee share, unrecycled remainder. |
| `BURN_PENDING` | Accrued burn obligation, not yet on-chain. |
| `BURN_CONFIRMED` | Cumulative burned, each tranche backed by a reveal txid. |
| `WITHDRAWAL_HOT_WALLET` | Backs outstanding withdrawal obligations. |
| `EMERGENCY_RESERVE` | Untouchable except by an audited admin action. Backstops I5. |

### 3.1 Health endpoint

`GET /api/economy/health` (public, cached 30 s) returns:

```jsonc
{
  "treasury": { "REWARD_RESERVE": "…", … },     // all 8 buckets
  "liabilities": {
    "totalPending":  "…",
    "totalAvailable":"…",
    "totalLocked":   "…",
    "totalWithdrawalObligations": "…",
    "totalUserLiability": "…"                   // pending+available+locked
  },
  "burns": { "pending": "…", "confirmed": "…" },
  "remainingRewardCapacity": "…",               // reserve − liability − emergency floor
  "solvencyRatio": 1.42,                         // backing / liability
  "circuitBreakers": { "REWARDS": "OPEN", … },
  "stage": "ALPHA_STAGE_1"
}
```

`remainingRewardCapacity` is the number that matters: when it reaches zero the
protocol stops creating rewards rather than creating unfunded GEEK.

---

## 4. The 70/30 recycle-and-burn rule

Every **eligible platform fee or forfeited entry** is split:

```
70%  →  REWARD_RESERVE     (transactionType: REWARD_POOL_RECYCLE)
30%  →  BURN_PENDING       (transactionType: BURN_PENDING)
```

Eligible sources: Gauntlet entry fees consumed, power-up purchases, sticker pack
purchases, marketplace fees, crafting fees, duplicate conversion fees,
tournament entry fees, listing fees.

Split arithmetic (exact, no float, no dust loss):

```ts
const burn    = (amount * 30n) / 100n;   // floor
const recycle = amount - burn;           // remainder — always exactly reconciles
```

The remainder goes to the reward pool, so `recycle + burn === amount` always
holds and no atomic unit is ever lost or invented.

### 4.1 Burn lifecycle

```
1.  Fee consumed          → 30% booked to BURN_PENDING     (status CONFIRMED, internal)
2.  Admin opens a batch   → BurnBatch(status=OPEN) accumulates pending burn
3.  Admin approves batch  → status=APPROVED, amount frozen
4.  Worker sends on-chain → commit txid + reveal txid recorded, status=BROADCAST
5.  Indexer confirms      → BURN_PENDING −x, BURN_CONFIRMED +x, status=CONFIRMED
```

**A burn is never marked confirmed without a real on-chain reveal txid**
(invariant I7, enforced in `confirmBurnBatch()`). During Alpha the pipeline stops
at step 2: burn accrues in `BURN_PENDING` and nothing is broadcast.

---

## 5. Daily Quiz

| Rule | Alpha value | Config key |
|---|---|---|
| Rewarded plays per account per UTC day | 1 | `dailyQuiz.rewardedPlaysPerDay` |
| Questions per quiz | 10 | `dailyQuiz.questionCount` |
| Practice replays | Unlimited, **0 GEEK** | `dailyQuiz.practiceAllowed` |
| Minimum score for any reward | 6 / 10 correct | `dailyQuiz.minCorrectForReward` |
| Base reward per correct answer | 0.5 GEEK | `dailyQuiz.baseRewardPerCorrect` |
| Speed bonus | +10% if avg answer < 5 s (validated) | `dailyQuiz.speedBonusPct` |
| Streak bonus | +5% per consecutive day | `dailyQuiz.streakBonusPctPerDay` |
| Streak bonus hard cap | +50% (day 10) | `dailyQuiz.streakBonusMaxPct` |
| Per-user daily cap | 15 GEEK | `dailyQuiz.perUserDailyCapGeek` |
| Global daily budget | 50 000 GEEK | `budgets.DAILY_QUIZ.dailyGeek` |
| Minimum account age | 24 h | `dailyQuiz.minAccountAgeHours` |
| Anti-cheat risk threshold | reject above 70 | `dailyQuiz.maxRiskScore` |
| Validation hold | 24 h pending → available | `dailyQuiz.pendingHoldHours` |

### 5.1 Formula

```
base    = correctCount × baseRewardPerCorrect
speed   = base × speedBonusPct            (only if timings validated server-side)
streak  = base × min(streakDays × 5%, 50%)
gross   = base + speed + streak
reward  = min(gross, perUserDailyRemaining, globalBudgetRemaining)
```

If `correctCount < minCorrectForReward` → reward is **0**, the attempt still
records XP. If the anti-cheat risk score exceeds the threshold → reward is 0 and
the attempt is flagged; no ledger entry is created for a zero reward.

Rewards land in `pendingBalance` (`DAILY_REWARD`) and clear to `availableBalance`
after the hold via the `economy-clearing` worker (`PENDING_CLEARED`).

Duplicate-account control: the daily key is
`daily:{userId}:{utcDate}` **and** `daily:wallet:{walletAddress}:{utcDate}`, so
several accounts sharing one wallet collectively get one rewarded play.

---

## 6. Geek Gauntlet

Ten rounds of ten questions. Round 1 is free; rounds 2–10 charge an entry fee.

### 6.1 Round table (single source of truth)

Stored in `EconomyConfig.gauntletRounds`, served by `GET /api/gauntlet/config`,
**read by the website** — the homepage must never hardcode these numbers (§19.4).

| Round | Entry fee | Reward / correct | Max round reward | Break-even | Label |
|---:|---:|---:|---:|---:|---|
| 1 | 0 | 10 | 100 | — | INITIATION |
| 2 | 40 | 20 | 200 | 2 correct | BASIC PROTOCOLS |
| 3 | 100 | 40 | 400 | 3 correct | NETWORK LAYER |
| 4 | 200 | 80 | 800 | 3 correct | DATA STREAMS |
| 5 | 400 | 150 | 1 500 | 3 correct | GRID ACCESS |
| 6 | 750 | 280 | 2 800 | 3 correct | DEEP PROTOCOL |
| 7 | 1 250 | 450 | 4 500 | 3 correct | CIPHER DESCENT |
| 8 | 2 000 | 700 | 7 000 | 3 correct | CORE BREACH |
| 9 | 3 500 | 1 100 | 11 000 | 4 correct | OMNISCIENT GATE |
| 10 | 6 000 | 1 800 | 18 000 | 4 correct | APEX PROTOCOL |

Question timer: **20 seconds** (`gauntlet.questionSeconds`). The client, the
anti-cheat validator and the website all read this one value.

### 6.2 Round settlement (one database transaction)

```
ENTRY   available −fee  → locked +fee        GAUNTLET_ENTRY      (before questions served)
--- player answers, server validates ---
SETTLE  locked   −fee   → consumed           GAUNTLET_FEE_CONSUMED
        consumed ×70%   → REWARD_RESERVE     REWARD_POOL_RECYCLE
        consumed ×30%   → BURN_PENDING       BURN_PENDING
REWARD  REWARD_RESERVE −r → available +r     GAUNTLET_REWARD
```

All four movements occur in a single `prisma.$transaction` with
`Serializable` isolation. A crash at any point leaves the fee either fully
locked (retryable) or fully settled — never half.

Rewards go **straight to `availableBalance`**, not pending: the round is
validated at submit time, so there is nothing left to clear.

### 6.3 Player options after a round

* **Continue** — pay the next round's fee.
* **Cash out** — end the run, keep everything already credited. (Because rewards
  are credited per round, cash-out is a no-op on balances; it closes the run and
  writes a `GAUNTLET_CASHOUT` audit row of amount 0 for the run summary.)
* **End voluntarily** — same as cash out.
* **Blocked** — if `availableBalance < nextRoundFee`, the next round is refused
  with `402` and the run is closed.

### 6.4 Modifiers

| Modifier | Price | Effect | Limit |
|---|---:|---|---|
| `double_down` | 1.0× round fee (i.e. fee doubles) | 2× reward per correct answer | 1 per round |
| `safety_net` | 0.1× round fee | Refunds 50% of the base fee if < 5 correct | 1 per round |
| `hot_streak` | 0.25× round fee | 1.5× reward on first 5 answers while unbroken | 1 per round, rounds 3+ |

Modifier surcharges are ordinary fees: they follow the 70/30 rule. A safety-net
refund is `GAUNTLET_REFUND` drawn from `REWARD_RESERVE`, and is counted against
the Gauntlet budget.

### 6.5 Enforced constraints

* One active run per user (unique partial index on `(userId) WHERE NOT completed`).
* Write-once answers (Redis `HSETNX`, per question).
* No client-provided scores — scoring is server-side from the signed token.
* No duplicate claims — round submit lock, plus ledger idempotency key
  `gauntlet:round:{runId}:{round}:{purpose}`.
* Entry fee charged exactly once per `(runId, round)`.
* Reward credited exactly once per `(runId, round)`.
* `gauntlet.maxRewardPerRunGeek` = 40 000 GEEK.
* `budgets.GAUNTLET.dailyGeek` = 250 000 GEEK.
* Automatic shutdown: if `remainingRewardCapacity` < `gauntlet.shutdownFloorGeek`
  the `GAUNTLET` circuit breaker trips and new runs are refused (existing runs
  can still cash out).

---

## 7. Community Content Engine

### 7.1 Creator rewards

| Rule | Alpha value | Config key |
|---|---|---|
| Approval reward | 5 GEEK | `cce.approvalRewardGeek` |
| Usage royalty per serve | 0.05 GEEK | `cce.royaltyPerServeGeek` |
| Daily royalty cap per creator | 50 GEEK | `cce.royaltyDailyCapGeek` |
| Weekly royalty cap per creator | 200 GEEK | `cce.royaltyWeeklyCapGeek` |
| Lifetime royalty cap per question | 1 000 GEEK | `cce.royaltyLifetimeCapPerQuestionGeek` |
| Self-play royalty | **None** — creator playing own question earns 0 | — |
| Removed / fraudulent question | Royalties stop; unpaid pending reversed | — |
| Max pending submissions per creator | 10 | `cce.maxPendingSubmissions` |
| Submissions per day | 20 | `cce.maxSubmissionsPerDay` |

Creator rewards are funded from `CREATOR_REWARD_POOL`.

### 7.2 Reviewer rewards

| Gate | Alpha value |
|---|---|
| Reward per valid review | 0.1 GEEK |
| Daily review cap | 20 reviews |
| Minimum account age | 7 days |
| Minimum level | 3 |
| Minimum real quiz wins | 5 |
| Minimum review time | 15 s |
| Self-review | Forbidden |
| Per-creator reviews per week | 3 |
| Minimum reviewer accuracy (after 20 reviews) | 60% |

### 7.3 Clearing

All CCE rewards begin as `pendingBalance`. They clear to `availableBalance` when:

* **Creator approval reward** — the question reaches a final decision *and*
  survives `cce.approvalClearingHours` (72 h) without a fraud flag.
* **Royalties** — after `cce.royaltyClearingHours` (24 h).
* **Reviewer reward** — after the reviewed question reaches a final decision, or
  after `cce.reviewClearingHours` (168 h) if it never resolves.

Coordinated abuse → `FRAUD_REVERSAL` moves the pending amount back to
`CREATOR_REWARD_POOL` and suspends the account's CCE eligibility.

---

## 8. XP and GEEK are separate

**XP is reputation. GEEK is value. XP never converts to GEEK.**

The legacy `PointsConversionTransaction` path (points → GEEK at 100:1) is
**disabled** and the route now returns `410 Gone`. It was the one place where
unlimited reputation could be minted into spendable currency.

| XP unlocks | GEEK pays for |
|---|---|
| Levels | Gauntlet entry fees |
| CCE eligibility | Tournament entry |
| Cosmetic items, titles | Power-ups |
| Achievements | Sticker packs |
| Tournament access | Marketplace purchases |
| Review permissions | Character customisation |
| | Future on-chain withdrawals |

---

## 9. Stickers, Dust and the marketplace

| Sink | Price | 70/30? |
|---|---:|---|
| Standard sticker pack (5) | 100 GEEK | Yes |
| Premium sticker pack (5, 1 rare+) | 400 GEEK | Yes |
| Crafting fee | 250 GEEK + 500 Dust | Yes (GEEK portion) |
| Duplicate → Dust conversion fee | 10 GEEK | Yes |
| Marketplace listing fee | 25 GEEK | Yes |
| Marketplace trade fee | 5% of sale price | Yes |
| Character customisation | 500 GEEK | Yes |
| Seasonal collection pack | 750 GEEK | Yes |

### 9.1 Geek Dust

Dust is a **non-withdrawable crafting resource**. It is not GEEK, has no ledger
bucket, and **cannot be converted back into GEEK** in any direction. Duplicates
convert *into* Dust; Dust converts only into stickers and crafting outputs.

### 9.2 Marketplace settlement

A sale of price `P` with fee rate `f`:

```
buyer.available  −P                     MARKETPLACE_PURCHASE
seller.available +(P − P×f)             MARKETPLACE_SALE
fee = P×f        → 70% REWARD_RESERVE   REWARD_POOL_RECYCLE
                 → 30% BURN_PENDING     BURN_PENDING
```

Self-dealing control: a trade is rejected when buyer and seller share a wallet
address, a device fingerprint, or a signup IP within `market.selfDealWindowDays`
(30). Flagged trades settle into `pendingBalance` for manual review.

---

## 10. Power-ups

| Power-up | Price | Modes | Daily limit | Affects reward eligibility |
|---|---:|---|---:|---|
| `FIFTY_FIFTY` | 50 GEEK | Daily, Gauntlet | 3 | Marks run **assisted** |
| `SKIP_QUESTION` | 75 GEEK | Daily, Gauntlet | 2 | Marks run **assisted** |
| `EXTRA_TIME` | 40 GEEK | Daily, Gauntlet | 3 | Marks run **assisted** |
| `SAFETY_NET` | 0.1× round fee | Gauntlet only | 1 / round | No |
| `DOUBLE_GEEK` | 1.0× round fee | Gauntlet only | 1 / round | No (it *is* the wager) |

Anti-pay-to-win rules:

* Power-ups **cannot** be bought mid-question; only between questions.
* A run using `FIFTY_FIFTY`, `SKIP_QUESTION` or `EXTRA_TIME` is flagged
  `assisted = true`.
* **Competitive leaderboards separate standard from assisted runs.** The default
  leaderboard shows standard runs only; assisted runs appear on their own board.
* Purchases are `POWERUP_PURCHASE` and follow the 70/30 rule.
* Daily limits are enforced by the economy service, not the client.

---

## 11. Reward budgets

Every reward source draws from a named budget with a daily and a monthly ceiling.

| Budget | Daily (GEEK) | Monthly (GEEK) |
|---|---:|---:|
| `DAILY_QUIZ` | 50 000 | 1 200 000 |
| `GAUNTLET` | 250 000 | 6 000 000 |
| `CCE_CREATOR` | 20 000 | 500 000 |
| `CCE_REVIEWER` | 5 000 | 120 000 |
| `TOURNAMENT` | 0 (disabled) | 0 |
| `PROMOTION` | 0 (disabled) | 0 |
| `REFERRAL` | 0 (disabled) | 0 |
| `SEASONAL` | 0 (disabled) | 0 |

Budget periods are **UTC days** and **UTC calendar months**. Consumption is
recorded atomically in the same transaction as the reward, so two concurrent
requests cannot both consume the last of a budget.

### 11.1 When a budget is exhausted

1. **No unfunded reward is created.** The grant returns
   `{ granted: 0n, reason: "BUDGET_EXHAUSTED" }`.
2. Gameplay continues in **practice / XP-only mode**.
3. The API returns a clear, user-facing message:
   *"Today's reward budget is fully allocated. You can keep playing for XP —
   GEEK rewards resume at 00:00 UTC."*
4. An `EconomyAlert` row is written and the admin dashboard shows it.

All reward values and budgets are editable through
`PUT /api/admin/economy/config` (audited), **without changing source code**.

---

## 12. Withdrawals

**Withdrawals are disabled.** `economy.withdrawalsEnabled = false`, and the
route returns `503` with an explicit Alpha message. They stay disabled until
real KRC-20 commit/reveal transfers are implemented **and** audited.

When enabled, the flow is:

```
1. Validate Kaspa address (prefix + bech32m checksum + network match)
2. Atomically: available −amount → locked +amount    WITHDRAWAL_LOCK
   (guarded by a per-user advisory lock, so two concurrent requests
    cannot both pass the balance check — see §16.2)
3. Enforce min (100 GEEK), max (50 000 GEEK), daily limit (100 000 GEEK)
4. Apply withdrawal fee (1% or 10 GEEK minimum) → 70/30 rule
5. Queue the transaction
6. Store onChainCommitTxid, then onChainRevealTxid
7. Confirm via indexer (N confirmations)
8. locked −amount → withdrawnBalance +amount        WITHDRAWAL_CONFIRMED
9. On permanent failure: locked −amount → available WITHDRAWAL_RELEASE
```

* One in-flight withdrawal per user (`WITHDRAWAL_SINGLE_FLIGHT` lock). A user
  can never submit two withdrawals against the same available balance.
* KYC required above `withdrawal.kycThresholdGeek` (10 000 GEEK).
* **No fake transaction IDs, ever.** `DEMO_MODE` no longer fabricates a
  `withdraw_tx_…` string; it refuses to settle instead.

---

## 13. Purchases

**Fiat purchases are disabled.** `economy.purchasesEnabled = false`, route
returns `503`, pending legal review and Stripe hardening.

Before enabling, all of the following must be true:

* Stripe webhook verifies the **raw** request body (`addContentTypeParser` with
  `parseAs: "buffer"` — a JSON-parsed body cannot produce a valid signature).
* Webhook processing is idempotent (unique `stripeEventId`).
* No `Purchase` row is created with an empty `stripeSessionId` — the session is
  created first, and the row is written with the real id.
* GEEK is credited **only** on verified `payment_status === "paid"`.
* `charge.refunded` and `charge.dispute.created` are handled → `REFUND` /
  `FRAUD_REVERSAL`.
* Purchased GEEK enters `pendingBalance` for a settlement hold of
  `purchase.settlementHoldDays` (7 days), and is **not withdrawable** until the
  chargeback-risk window passes and compliance rules exist.
* All processing is transactional.

---

## 14. The economic ledger

`EconomyTransaction` is **append-only**. There is no update path and no delete
path in the service; a reversal is a *new* row of the opposite direction
referencing the original.

### 14.1 Columns

| Column | Notes |
|---|---|
| `id` | cuid |
| `userId` | nullable (treasury-only movements) |
| `transactionType` | enum, §14.2 |
| `amountAtomic` | `Decimal(30,0)`, always **positive**; direction comes from the buckets |
| `balanceBucketFrom` | `PENDING`/`AVAILABLE`/`LOCKED`/`WITHDRAWN`/`TREASURY_*`/`EXTERNAL` |
| `balanceBucketTo` | same domain |
| `referenceType` | `GAUNTLET_ROUND`, `QUIZ_ATTEMPT`, `QUESTION`, `REVIEW`, `WITHDRAWAL`, … |
| `referenceId` | free-form id of the referenced entity |
| `status` | `PENDING` / `CONFIRMED` / `REVERSED` / `FAILED` |
| `idempotencyKey` | **unique**, required |
| `onChainCommitTxid` | nullable |
| `onChainRevealTxid` | nullable |
| `metadata` | JSON |
| `createdAt` / `confirmedAt` / `reversedAt` | timestamps |
| `reversalOfId` | set on reversal rows |

### 14.2 Transaction types

```
DAILY_REWARD            GAUNTLET_ENTRY          GAUNTLET_REWARD
GAUNTLET_CASHOUT        GAUNTLET_REFUND         GAUNTLET_FEE_CONSUMED
CCE_CREATOR_REWARD      CCE_REVIEW_REWARD       CREATOR_ROYALTY
POWERUP_PURCHASE        STICKER_PACK_PURCHASE   STICKER_CRAFT_FEE
MARKETPLACE_SALE        MARKETPLACE_PURCHASE    MARKETPLACE_FEE
MARKETPLACE_LISTING_FEE TOURNAMENT_ENTRY        TOURNAMENT_REWARD
REWARD_POOL_RECYCLE     BURN_PENDING            BURN_CONFIRMED
WITHDRAWAL_LOCK         WITHDRAWAL_CONFIRMED    WITHDRAWAL_RELEASE
PURCHASE_PENDING        PURCHASE_CONFIRMED      REFUND
PENDING_CLEARED         ADMIN_ADJUSTMENT        FRAUD_REVERSAL
TREASURY_FUNDING        ACHIEVEMENT_REWARD      STREAK_REWARD
```

### 14.3 Idempotency

Every write supplies an `idempotencyKey`. The key is a deterministic function of
*what happened*, never of the current time:

```
daily:{userId}:{utcDate}
gauntlet:entry:{runId}:{round}
gauntlet:reward:{runId}:{round}
cce:approval:{questionId}
cce:royalty:{questionId}:{sessionId}
cce:review:{questionId}:{reviewerId}
powerup:{userId}:{powerupId}:{contextId}
withdrawal:lock:{withdrawalId}
purchase:confirm:{stripeSessionId}
burn:confirm:{batchId}
```

Re-submitting the same key returns the **original** transaction and performs no
balance movement. This is what makes BullMQ retries, browser double-clicks and
webhook redelivery safe.

### 14.4 Reconciliation

`npm run economy:reconcile` recomputes each user's four buckets from the ledger
and compares them to the stored values (I4), then checks solvency (I5) and
per-treasury-account sums. Non-zero drift exits non-zero and prints the
offending rows. It runs in CI and is scheduled hourly in production.

---

## 15. Anti-abuse controls

| Vector | Control |
|---|---|
| Multiple accounts, one wallet | Rewards keyed on wallet as well as user id |
| Account farming | Device fingerprint + signup IP clustering; cluster daily cap |
| Repeated device / network patterns | `AbuseSignal` rows; > `abuse.clusterThreshold` accounts per fingerprint → all pending held |
| Impossible answer speed | `validateAttemptTiming` against the server-signed issue time |
| Automated answering | Behaviour scoring (mouse/keyboard/focus entropy) |
| Answer leakage | Answer key never leaves the server; commit-then-reveal per question |
| CCE review rings | Per-creator weekly cap, random assignment, hidden authorship, accuracy floor |
| Marketplace self-dealing | Shared-identity checks; flagged trades held in pending |
| Repeated withdrawal failures | 3 failures → withdrawals suspended for the account |
| Referral farming | Referral budget is 0 in Alpha |
| Demo-mode claims | `DEMO_MODE` grants **zero** GEEK; rewards are XP-only |

**Flagged rewards remain in `pendingBalance` and can never be withdrawn.**
Clearing checks the flag at clear time, not at grant time.

---

## 16. Concurrency

### 16.1 Isolation

Every balance movement runs in `prisma.$transaction(..., { isolationLevel: "Serializable" })`.
Serialization failures (`40001`) are retried up to 3 times with jitter.

### 16.2 Advisory locks

Before reading a balance for a check-then-act operation (entry fee, withdrawal,
purchase), the transaction takes a Postgres advisory lock keyed on the user id:

```sql
SELECT pg_advisory_xact_lock(hashtext('geek:user:' || $1));
```

This is what makes "check balance, then debit" safe against the classic double
spend of two simultaneous requests both seeing sufficient funds.

### 16.3 Guarantees under retry

* Debits use a conditional update (`WHERE availableBalance >= amount`) and fail
  the transaction if zero rows are affected — so even without the lock the
  balance can never go negative.
* The unique `idempotencyKey` is the second line of defence: a retry that gets
  past everything else collides on insert and returns the original row.

---

## 17. Administrative controls

`/api/admin/economy/*`, all admin-gated, all audited to `AdminAuditLog`.

| Action | Endpoint |
|---|---|
| Pause / resume all rewards | `POST /breakers/REWARDS` |
| Pause withdrawals | `POST /breakers/WITHDRAWALS` |
| Pause purchases | `POST /breakers/PURCHASES` |
| Pause CCE rewards | `POST /breakers/CCE` |
| Set daily budgets | `PUT /budgets/:name` |
| Change reward tables | `PUT /config` |
| Set withdrawal limits | `PUT /config` |
| Inspect a user ledger | `GET /users/:id/ledger` |
| Review flagged transactions | `GET /flagged` |
| Release / reverse a pending reward | `POST /transactions/:id/release`, `/reverse` |
| Queue health | `GET /queues` |
| Hot-wallet balance | `GET /health` |
| Total liabilities | `GET /health` |
| Initiate a burn batch | `POST /burns/batch`, `POST /burns/:id/approve` |

Every admin action records actor, action, target, before/after values, IP and
user-agent. The audit log is append-only.

---

## 18. Emergency controls (circuit breakers)

| Breaker | Trips when | Effect |
|---|---|---|
| `REWARDS` | `remainingRewardCapacity <= 0` | All GEEK rewards stop; XP continues |
| `GAUNTLET` | Reward capacity < gauntlet floor | No new runs; existing runs may cash out |
| `WITHDRAWALS` | Hot wallet < obligations, or 24 h volume > limit, or payout failure rate > 20% | Withdrawal submission refused |
| `PURCHASES` | Duplicate-payment activity detected | Checkout refused |
| `CCE` | Creator pool exhausted | CCE rewards stop; submission/review continue for XP |
| `ALL` | Redis worker heartbeat older than 120 s, or indexer unreliable | Everything economic pauses |

States: `OPEN` (healthy), `TRIPPED` (automatic), `MANUAL_PAUSE` (admin).
A tripped breaker requires an explicit admin reset — it never auto-recovers into
paying out, because the condition that tripped it needs a human to confirm.

**Gameplay always continues in practice / XP-only mode while economics are
paused.** Players are told exactly why.

---

## 19. Website ↔ backend consistency

The website is part of the economy's honesty surface. These rules are binding.

### 19.1 Claims that must not appear

| Banned claim | Required replacement |
|---|---|
| "Get paid in $GEEK the moment you finish" | "Earn internal Alpha GEEK balances while we test Proof-of-Learning" |
| "Settlement lands on Kaspa in under 6 seconds" | *(removed — no settlement exists)* |
| "Instant Rewards, Real Settlement" | "Instant Alpha Balances, Settlement In Development" |
| "Direct rewards to your wallet" | "On-chain KRC-20 withdrawals are not enabled yet" |
| "Finality in milliseconds, not minutes" | "Rapid block inclusion and growing proof-of-work confirmation confidence" |
| "KRC-20 native" | "Live KRC-20 token on Kaspa" |
| "fastest smart contract blockchain" | "a fair-launched proof-of-work blockDAG at 10 blocks per second, now supporting covenant-based programmability through Toccata" |
| "Every achievement recorded on-chain" | "Build a persistent GEEK Protocol knowledge profile. Future releases will explore portable and on-chain achievement proofs." |
| "No passwords, no signups, no central database" | "Connect with KasWare or create an Alpha account. Wallet users retain control of their wallet; email accounts use a protocol-managed encrypted wallet during Alpha." |
| A.C.E. "settles rewards on-chain" | A.C.E. is the character and future intelligence layer |
| Fixed CCE rates as promises | "Qualified creators and accurate reviewers can earn configurable Alpha rewards. Rates and limits are being tested and may change before Beta." |

Enforced by `npm run lint:claims`, which greps the web source for the banned
phrases and fails the build.

### 19.2 Roadmap truth

| Milestone | Real status |
|---|---|
| Alpha platform | ✅ Live |
| Internal reward balances | ✅ Live |
| Mainnet KRC-20 payouts | 🔧 In development |
| Public beta | ⏳ Upcoming |
| First tournament | ⏳ Upcoming |

Public beta and "first tournament" must **not** be shown as complete.

### 19.3 Token allocation

The homepage may not present genesis percentages. It must distinguish:

* **Total minted supply** — what the fair launch minted.
* **Tokens actually controlled by the project** — the only honest denominator.
* **Community / treasury contributions** — how the project came to hold them.
* **Target use of project-held reserves** — intent, labelled as intent.
* **Future economic policy** — explicitly not yet decided.

"Team and Advisors: 15%" is removed. The **staking claim is removed** — there is
no staking system.

### 19.4 Dynamic economy

The site reads `GET /api/economy/public-config` for round fees, rewards, the
question timer, CCE rates and budget status. **No economy number is hardcoded in
the web app.** This is what stops the site and the game drifting apart.

### 19.5 Required UI

* A persistent **Public Alpha** status banner (§19.6).
* Meaningful server-rendered fallback values (never `0 categories`,
  `0-second timer`).
* Empty states: *"No ranked players yet. Complete the Daily Quiz or Gauntlet to
  become the first."*
* Guest practice round before login is required.
* Terms of Use, Privacy Policy, Alpha Risk Disclosure, Cookie notice, Reward
  disclaimer, Custodial-wallet disclosure, Age requirement, Community-content
  terms, Acceptable-use policy — as real pages.
* System status indicators and a "Report a problem" link.

### 19.6 The banner text

> **Public Alpha** — Core gameplay, profiles, leaderboards and the Community
> Content Engine are in active testing. Rewards currently appear as internal
> Alpha balances. Real KRC-20 payouts and withdrawals are not enabled. Economic
> parameters may change before Beta.

---

## 20. Operational scripts

| Command | Purpose |
|---|---|
| `npm run economy:reconcile` | Verify I4/I5, print drift, exit non-zero on mismatch |
| `npm run economy:migrate-balances` | One-time: `geekBalance` → four buckets + genesis ledger |
| `npm run economy:seed` | Create treasury accounts, budgets, breakers, default config |
| `npm run economy:health` | Print the health report to a terminal |
| `npm run lint:economy` | Fail if balances are written outside the service |
| `npm run lint:claims` | Fail if a banned marketing claim is in the web source |

### 20.1 Migration plan for existing balances

1. Take a database snapshot.
2. Run `economy:seed` — creates treasury accounts and funds `REWARD_RESERVE`
   with `ECONOMY_GENESIS_REWARD_RESERVE_GEEK`.
3. Run `economy:migrate-balances`:
   * For each user with `geekBalance > 0`, set `availableBalance = geekBalance`,
     the other three buckets to 0.
   * Write one `ADMIN_ADJUSTMENT` ledger row per user with
     `idempotencyKey = migration:v1:{userId}`, from `TREASURY_OPERATIONS` to
     `AVAILABLE` — so the ledger reconciles from the first day.
   * Debit `OPERATIONS_TREASURY` by the same total, making the pre-existing
     liability explicit rather than silently unfunded.
4. Run `economy:reconcile` — must exit 0.
5. Keep `geekBalance` as a **read-only shadow column** for one release, updated
   by the service to equal `availableBalance`, so any missed caller is caught.
6. Drop `geekBalance` in the following release.

The migration is idempotent: re-running it is a no-op because of the
`migration:v1:{userId}` keys.

---

## 21. Testing

| Suite | What it proves |
|---|---|
| `economy.units.test.ts` | Atomic conversion, floor rounding, no float drift |
| `economy.split.test.ts` | 70/30 split is exact for every amount 0…10⁶ |
| `economy.service.test.ts` | Every legal transition, every illegal one rejected |
| `economy.idempotency.test.ts` | Same key twice → one movement, original returned |
| `economy.concurrency.test.ts` | 50 parallel debits of a balance that funds 10 → exactly 10 succeed |
| `economy.budget.test.ts` | Concurrent grants never exceed a budget |
| `economy.retry.test.ts` | BullMQ retry after partial failure double-credits nothing |
| `economy.breaker.test.ts` | A tripped breaker refuses grants |
| `economy.reconcile.test.ts` | Reconciliation detects injected drift |

`npm test` in `apps/api` runs all of them (vitest).

---

## 22. Operational status

| System | Status |
|---|---|
| Four-bucket balances | **Operational** |
| Immutable ledger + idempotency | **Operational** |
| Treasury accounting (8 buckets) | **Operational** |
| 70/30 recycle | **Operational** (recycle real, burn accrues only) |
| Reward budget engine | **Operational** |
| Circuit breakers | **Operational** |
| Gauntlet atomic fee + reward | **Operational** |
| Daily Quiz caps + clearing | **Operational** |
| CCE creator / reviewer / royalty | **Operational** |
| Power-ups | **Operational** |
| Stickers / marketplace fees | **Operational** |
| Admin economy dashboard | **Operational** |
| Economy health endpoint | **Operational** |
| Reconciliation | **Operational** |
| Pending → available clearing worker | **Operational** |
| Burn to on-chain address | **Simulated** — accrues in `BURN_PENDING`, nothing broadcast |
| KRC-20 transfer | **Unfinished** — `sendKrc20Tokens` is a stub |
| Withdrawals | **Disabled** — returns 503 |
| Fiat purchases | **Disabled** — returns 503 |
| Tournaments | **Disabled** — budget 0 |
| Referrals / promotions | **Disabled** — budget 0 |
| Points → GEEK conversion | **Removed** — returns 410 |
| KYC provider integration | **Unfinished** — records only |
| On-chain achievements / reputation | **Not built** — database records only |

---

## 23. Alpha rollout stages

| Stage | Gate to enter |
|---|---|
| **1. Internal balances only** | *(current)* No purchases, withdrawals, or real payouts |
| **2. Closed Alpha** | Reconciliation green for 7 days; abuse tests pass; budgets tuned |
| **3. Small test treasury** | KRC-20 transfer implemented; commit/reveal verified on testnet; limited real payouts |
| **4. External review** | Security + economy audit of the service and treasury |
| **5. Limited public Beta** | Legal pages live; strict daily payout caps; KYC operational |
| **6. Gradual scaling** | Driven by treasury health, retention and fraud data |

`ECONOMY_STAGE` in the environment declares the current stage. The service
refuses to enable withdrawals or purchases below Stage 5, regardless of any
other flag — a feature flag alone can never turn on real money.

**Nothing is enabled because the interface exists.** Each system must be proven
end-to-end and reviewed first.
