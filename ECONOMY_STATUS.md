# GEEK Protocol — Economy Integration Status Report

**Date:** 17 August 2026
**Rollout stage:** 1 — internal balances only
**Scope:** the unified economic system (ECONOMY.md) and the website honesty corrections.

This is deliverable 19 from the build brief: *"A report showing what is
operational, simulated, disabled, and unfinished."*

---

## 1. The one-line summary

Every GEEK movement in the protocol now goes through a single `EconomyService`
and writes an immutable ledger row in the same database transaction. Nothing
else can change a balance — a lint rule fails the build if it tries. Withdrawals,
fiat purchases, on-chain burns and the simulated token swap are **disabled**, and
the website no longer claims any of them work.

---

## 2. Operational

Built, wired into the game, type-checked and unit-tested.

| System | Where | Notes |
|---|---|---|
| Four-bucket balances | `prisma/schema.prisma` | `pendingBalance`, `availableBalance`, `lockedBalance`, `withdrawnBalance` as `Decimal(30,0)` integer atomic units |
| Atomic-unit arithmetic | `services/economy/units.ts` | bigint throughout; no float touches token accounting |
| Immutable ledger | `services/economy/ledger.ts` | append-only `EconomyTransaction`; reversal is a new mirror row |
| Idempotency | same | unique `idempotencyKey` on every write; a replay returns the original and moves nothing |
| Overdraft protection | same | conditional `WHERE balance >= amount`; zero rows affected → throw → rollback |
| Serializable transactions + retry | same | `withEconomyTransaction`, 3 retries with jitter on 40001 |
| Advisory locks | same | `pg_advisory_xact_lock` per user for check-then-act paths |
| Treasury (8 accounts) | `services/economy/treasury.ts` | reserve, creator pool, tournament, operations, burn pending/confirmed, hot wallet, emergency |
| Solvency + reward capacity | same | `remainingRewardCapacity` is the number that stops unfunded rewards |
| Reward budget engine | `services/economy/budget.ts` | daily + monthly UTC ceilings, consumed atomically with the reward |
| Per-user caps | same | value caps and count caps, per UTC period |
| Circuit breakers | `services/economy/breakers.ts` | 8 breakers; fail **closed** if unreadable; no auto-recovery into paying |
| 70/30 recycle | `units.ts` + `service.ts` | exact split, remainder to the pool, reconciles to the atomic unit |
| Runtime config | `services/economy/config.ts`, `rules.ts` | every rate, price, cap and limit tunable without a deploy |
| Gauntlet atomic settlement | `routes/gauntlet.ts` | fee `available→locked` before questions; on submit `locked→70/30`, then reward |
| Daily Quiz | `routes/quiz.ts`, `services/dailyQuizRewards.ts` | one rewarded play per UTC day keyed on user **and** wallet; caps, holds, risk gating |
| CCE creator rewards | `routes/cce.ts` | approval reward, pending until the clearing window |
| CCE royalties | `services/cceRoyalties.ts` | per-serve, with daily/weekly/lifetime caps and no self-play earning |
| CCE reviewer rewards | `routes/cce.ts` | pending until the question resolves; daily cap |
| Power-ups | `service.ts`, `routes/gauntlet.ts` | priced, daily-limited, 70/30, and they mark a run **assisted** |
| Assisted-run separation | `schema.prisma`, `routes/gauntlet.ts` | `GauntletRun.assisted` — standard and assisted runs rank separately |
| Sticker sinks | `routes/stickers.ts` | pack purchase and duplicate→Dust conversion, both fee-recycled |
| Pending → available clearing | `workers/economy.ts` | re-checks the fraud flag **at clear time**, not at grant time |
| Economy health endpoint | `routes/economy.ts` | public: treasury, liabilities, burns, capacity, breakers, budgets |
| Public config endpoint | same | the site's single source of economic truth |
| Admin economy dashboard | `routes/adminEconomy.ts` | 20 endpoints, every mutation audited |
| Admin audit log | `schema.prisma` | actor, target, before/after, IP, user-agent; append-only |
| Anti-abuse signals | `schema.prisma`, routes | device/IP clustering fields, `AbuseSignal` rows, account suspension |
| Reconciliation | `scripts/economyReconcile.ts` | recomputes buckets from the ledger; exits non-zero on drift |
| Balance migration | `scripts/economyMigrateBalances.ts` | idempotent, writes a genesis ledger row per user |
| Architecture guard | `scripts/lint-economy.mjs` | fails the build on any balance write outside the service |
| Claims guard | `apps/web/scripts/lint-claims.mjs` | fails the build on any of 12 banned marketing claims |

**Tests:** 90 passing across 4 suites — units, transitions, ledger
(idempotency/concurrency/overdraft), budgets.

---

## 3. Simulated

Working code, real accounting, but no external effect.

| System | What is real | What is not |
|---|---|---|
| **Burn** | The 30% share is debited and credited to `BURN_PENDING` on every fee, and appears in the ledger and the health endpoint | **Nothing is broadcast.** No tokens have been sent to a burn address. `BURN_CONFIRMED` requires a real on-chain reveal txid and is 0. |
| **Token pool page** | The quote maths | There is no liquidity pool, no KAS is held, and `/pool` returns an empty trade history rather than invented trades |
| **On-chain balance display** | Read from the Kasplex indexer | It is a genuinely different number from the Alpha balance; the API labels it as such |

---

## 4. Disabled

Deliberately refused, with an honest message rather than a silent failure.

| System | Response | Gate |
|---|---|---|
| **Withdrawals** | `503 WITHDRAWALS_DISABLED` | Needs `ECONOMY_STAGE >= 5` **and** `withdrawalsEnabled` **and** an audited KRC-20 transfer. A flag alone is never enough. |
| **Fiat purchases** | `503 PURCHASES_DISABLED` | Needs stage ≥ 5, `purchasesEnabled`, and legal review |
| **Token swap (buy/sell)** | `503 SWAPS_DISABLED` | Previously credited GEEK without receiving KAS — unfunded minting |
| **Add liquidity** | `503 SWAPS_DISABLED` | Same |
| **Sticker buyback for GEEK** | `503 STICKER_BUYBACK_DISABLED` | Paid from no funded source; use the marketplace instead |
| **Points → GEEK conversion** | Route removed from the token module | Unlimited reputation → spendable currency |
| **Tournaments** | Budget 0, disabled | No tournament system exists |
| **Referrals / promotions / seasonal** | Budget 0, disabled | Not built |
| **Dust → GEEK** | No code path exists in either direction | Would turn a cosmetic drop into a mint |

---

## 5. Unfinished

Known gaps. None of them are presented to users as working.

| Item | State | Blocking |
|---|---|---|
| **KRC-20 transfer** | `sendKrc20Tokens` is still a stub | Withdrawals, real payouts, burn broadcast |
| **Commit/reveal construction** | Not implemented | Same |
| **Indexer confirmation loop** | Not implemented — `confirmWithdrawal` exists and is tested, but nothing calls it | Withdrawal settlement |
| **KYC provider integration** | Records only, no provider | Withdrawals above the threshold |
| **Marketplace UI** | `marketplaceSettle` is implemented and fee-recycled; no route or UI wired to it yet | Sticker trading |
| **Tournament system** | Ledger types and budget exist; no game mode | Tournaments |
| **On-chain achievements** | Database records only | Nothing — this is now described accurately |
| **Database migration** | **Schema changes are NOT yet applied.** `prisma db push` was not run. | See §8 |
| **Legal review** | Pages written and published; not lawyer-reviewed | Purchases, withdrawals, KYC |
| **External security audit** | Not started | Stage 4 → 5 |

---

## 6. Website corrections

All 12 banned claims removed and guarded by `npm run lint:claims`.

| Was | Now |
|---|---|
| "Get paid in $GEEK the moment you finish. Settlement lands on Kaspa in under 6 seconds" | "Finish a round and your Alpha GEEK balance updates immediately. Balances are internal during Alpha — on-chain KRC-20 withdrawals are not enabled yet." |
| "Instant Rewards, Real Settlement" | "Instant Alpha Balances, Settlement In Development" |
| "Direct rewards to your wallet" | "Every reward written to the public ledger" |
| "Finality in milliseconds, not minutes" | "Rapid block inclusion, with proof-of-work confirmation confidence that grows quickly" |
| "KRC-20 native" (4 places) | "Live KRC-20 token on Kaspa" |
| "Fastest smart contract blockchain" | "A fair-launched proof-of-work blockDAG running at 10 blocks per second, now supporting covenant-based programmability through Toccata" |
| "Build Your On-Chain Reputation" / "recorded on-chain forever" | "Build Your Knowledge Profile" — protocol records today, portable proofs planned |
| "No passwords, no signups, no central database" | Accurate description of KasWare **and** email accounts with protocol-managed encrypted wallets |
| A.C.E. "settles rewards on-chain" | A.C.E. as character and presentation layer |
| "Kaspa mainnet ready" (2 places) | "Mainnet KRC-20 payouts in development" |
| Allocation table incl. "Team & Advisors 15%", "Staking 20%" | Total minted supply / none reserved at genesis / project-held (published live) / source / intended use — and the staking claim removed entirely |
| Roadmap: public beta ✅, first tournament ✅ | Alpha ✅, internal balances ✅, mainnet payouts ⟳ in development, public beta → upcoming, first tournament → upcoming |

### Other website work

* **Live round table** — the homepage table was hardcoded and had drifted: it
  advertised 75/125/200/350/500/750/1000 GEEK per correct answer for rounds
  4–10 while the backend paid 80/150/280/450/700/1100/1800, and claimed a
  15-second timer against the game's 20. It is now a server component reading
  `GET /api/economy/public-config`. **No economy number is hardcoded in the web
  app.**
* **Alpha status banner** — site-wide, server-rendered so it is in the initial
  HTML rather than appearing after hydration.
* **Zero counters fixed** — `useCountUp` seeded state at `0`, so search engines,
  screen readers and no-JS visitors saw "0 categories", "0 questions",
  "0-second timer". It now starts at the real value and only rewinds to animate
  when JavaScript is running and motion is not reduced.
* **Leaderboard empty state** — "No ranked players yet. Complete the Daily Quiz
  or the Gauntlet to become the first."
* **Legal pages** — Terms of Use, Privacy Policy (incl. custodial-wallet
  disclosure), Alpha Risk Disclosure, Acceptable Use, Community Content Terms,
  Cookie Notice. Footers previously linked Terms/Privacy to `#` and `/`.
* **Report a problem** — `/support/report`, linked from both footers.

---

## 7. Security and correctness fixes made along the way

These were found while wiring the economy through existing code.

1. **Fabricated withdrawal txids.** Demo mode marked withdrawals `completed`
   with `withdraw_tx_${Date.now()}`. Removed; the worker now releases funds back
   to available balance with an honest reason. A lint rule blocks the pattern.
2. **Double-credit risk.** The payout worker credited `geekBalance` directly for
   quiz rewards. Rewards are now credited synchronously through the service, and
   legacy queue jobs are drained as no-ops instead of paying twice.
3. **Stripe webhook signature could never verify.** It called
   `constructEvent` on a JSON-parsed body; Stripe signs raw bytes. A raw-body
   parser is now registered for the webhook route only.
4. **Stripe webhook was not idempotent.** Redelivery credited the purchase
   again. Events are now recorded by id before processing.
5. **`Purchase` rows created with `stripeSessionId: ""`.** Two concurrent
   checkouts collided on the unique index. The session is created first.
6. **Purchases credited without checking `payment_status`.** Now only a `paid`
   session credits, into pending with a settlement hold.
7. **Gauntlet routes trusted a client-supplied `userId`.** Any user could charge
   or credit another. All Gauntlet routes now derive the user from the JWT.
8. **Unfunded token minting.** `/api/token/buy` credited GEEK with no KAS
   received. Disabled.
9. **Root `tsconfig.json` swept `apps/**`** into an ES2017 target, reporting
   errors in code that builds fine. Now excluded.
10. **A third, conflicting round table.** `src/config/quizRewards.ts` held
    entry costs and rewards that matched neither the website's table nor the
    Gauntlet's — a 10/20/30/40/50/75/100/150/200/300 curve nothing else used.
    It became unreachable when the quiz was rewired; deleted rather than left as
    a fourth source of truth.
11. **A duplicate reviewer reward constant.** `REVIEW_REWARD_GEEK = 0.1` in
    `reviewIntegrity.ts` would have silently disagreed with the tunable config
    value the ledger actually pays. Removed.
12. **A dead `$GEEK Token` footer link** pointing at `#`. Caught by the new E2E
    assertion, not by the static lint.
13. **Withdrawals were reserved but never queued.** Introduced while rewiring
    the withdrawal route: funds moved `available → locked` and nothing was ever
    enqueued, so they would have stayed locked forever. The route now enqueues
    after the reservation commits, and releases the funds if queueing fails.

---

## 8. What you need to do next

The code is complete and verified, but **the schema has not been applied to your
database.** I did not run `prisma db push` because your database has 19 real
users and that is your call to make.

```bash
cd apps/api

# 1. Back up first — this adds columns to `users` and 11 new tables.
pg_dump "$DATABASE_URL" > backup-before-economy.sql

# 2. Apply the schema.
npm run prisma:push          # or: npm run prisma:migrate  (preferred for prod)

# 3. Create treasury accounts, budgets, breakers, config row, and fund it.
npm run economy:seed -- --fund

# 4. Migrate the 19 existing balances into the four-bucket model.
npm run economy:migrate-balances -- --dry-run   # inspect first
npm run economy:migrate-balances

# 5. Verify the books. MUST exit 0.
npm run economy:reconcile

# 6. Look at the treasury.
npm run economy:health
```

Then run three processes, not two:

```bash
npm run dev                 # API
npm run dev:worker          # payouts
npm run dev:economy-worker  # clearing, breakers, heartbeat  ← NEW
```

Without the economy worker, pending rewards never clear into available balance
and no circuit breaker ever trips.

### A note on the migration

Your 19 users hold balances that predate the ledger. `economy:migrate-balances`
debits `OPERATIONS_TREASURY` to fund them, so the books reconcile. If the
treasury cannot cover the total it will refuse and tell you the shortfall,
rather than quietly creating unfunded GEEK. `--auto-fund` records the shortfall
as an explicit opening liability — visible on the health endpoint as exactly
what it is, not hidden.

---

## 9. Environment

Two `.env` files existed and **the one at `apps/api/.env` is the one the API
actually loads** — the repository root file never reached the process. Both are
now complete. The API one had three problems that would have broken the economy:

* `SECRET_KEY` was the literal placeholder `"replace-with-a-very-long-random-string"`.
* `DEMO_MODE=true` — demo mode now grants **zero** GEEK by design, so every
  reward in every mode would have paid nothing.
* `HMAC_SECRET` and `WALLET_ENCRYPTION_KEY` were missing entirely.

All new economy variables are documented inline in `apps/api/.env`,
`.env.example` and `.env.production.example`.

> **Trade-off to be aware of:** with `DEMO_MODE=false`, KasWare sign-in now
> verifies Schnorr signatures for real, so wallet login needs a genuine wallet.
> Email accounts are unaffected.

---

## 10. Verification

```bash
npm run verify     # type-check + lint:economy + lint:claims + lint:brand + test
```

| Check | Result |
|---|---|
| `apps/api` type-check | ✅ |
| `apps/web` type-check | ✅ |
| `lint:economy` | ✅ clean — all balance movements go through EconomyService |
| `lint:claims` | ✅ clean — no banned claims in the web source |
| `lint:brand` | ✅ clean |
| `vitest` (API unit) | ✅ 90/90 |
| `playwright` (web E2E) | ✅ 17/17 |
| `preflight` | ✅ passed |
| **Database migration** | ⬜ **not applied — see §8** |
| **Live end-to-end economy run** | ⬜ **not performed — depends on §8** |

### A note on the E2E suite

`apps/web/tests/quiz-flow.spec.ts` was **already failing on `main`** before this
work: four of its six tests asserted a UI that no longer exists (a "Start Run"
button and a "Run Progress / Time / Correct" HUD on `/play`, which is now just a
redirect; and a "System OK" health badge that appears nowhere in the source),
and the home-page test used `text=Geek Protocol`, which matched eight elements
and tripped Playwright's strict mode.

Its Playwright `webServer` also had the default 60-second start timeout, which a
cold Next boot exceeded when the suite ran alongside the other turbo tasks —
failing the whole run before a single test executed. Raised to 120 seconds with
server output piped through, so a real hang is distinguishable from a slow boot.

It has been rewritten against the current product, with the emphasis on the
honesty guarantees: the Alpha banner renders, the banned claims are absent from
the served HTML, no zeroed placeholder counters appear, the round table is live
or honestly unavailable, the leaderboard shows an actionable empty state, and
every legal page resolves. Those assertions caught one real defect that the
static lint could not — a `$GEEK Token` footer link still pointing at `#`.

---

## 11. Honest limitations

* The ledger tests use an in-memory fake of the Prisma client. They pin the
  application contract (idempotency, overdraft refusal, budget ceilings). They
  do **not** exercise real Serializable isolation or `pg_advisory_xact_lock` —
  that needs an integration suite against a live Postgres, which is the natural
  next piece of work.
* The economy has not been run against your live data. Reconciliation is
  expected to pass after the migration, but it has not yet been observed to.
* The 70/30 split, budgets and caps are all correct in code and tested; the
  *values* are Alpha guesses and should be tuned with real play data.
* Nothing here has had an external security or economics audit.
