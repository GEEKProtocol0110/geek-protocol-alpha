# Token Flow Architecture

## Overview

This document explains how $GEEK tokens move through the Geek Protocol system, from treasury to user wallets.

## Current State (Testnet MVP)

```
┌─────────────────┐
│  Kaspa Testnet  │
│   $GEEK Token   │
└────────┬────────┘
         │
    ┌────▼─────┐
    │ Treasury │ (Controlled by protocol)
    │  Wallet  │
    └────┬─────┘
         │
         │ (Quiz completion triggers withdrawal)
         │
    ┌────▼──────┐
    │  Reward   │ (Redis queue + worker)
    │  System   │
    └────┬──────┘
         │
         │ (TX broadcast via Kasplex API)
         │
    ┌────▼──────┐
    │   User    │ (KasWare wallet)
    │  Wallet   │
    └───────────┘
```

## Step-by-Step Flow

### 1. User Completes Quiz

```typescript
// Frontend submits answers
POST /api/quiz/submit
{
  attemptId: "att_...",
  attemptToken: "hmac_...",
  answers: [{ questionId: "...", choiceIndex: 0 }, ...]
}
```

**Server validates:**
- Attempt token signature (HMAC)
- Time constraints (realistic completion time)
- Answer correctness (server-side check)
- Single submission per attempt

### 2. Score Calculation

```typescript
const score = (correctAnswers / totalQuestions) * 100;

if (score >= MIN_SCORE_FOR_REWARD) {
  // Enqueue reward job
  await enqueueRewardJob({
    attemptId,
    userId,
    walletAddress,
    amount: correctAnswers * REWARD_SATS_PER_CORRECT
  });
}
```

**Threshold:** Configurable via `MIN_SCORE_FOR_REWARD` (default: 70%)

### 3. Reward Job Queued

```typescript
// Redis job structure
{
  id: "reward_abc123",
  attemptId: "att_xyz789",
  userId: "user_123",
  walletAddress: "kaspa:qp...",
  amount: "7500", // in satoshis
  status: "PENDING",
  createdAt: "2026-01-13T02:30:00Z"
}
```

**Redis ensures:**
- Job persistence (survives server restarts)
- Idempotency (one job per attempt)
- Rate limiting (prevents spam)

### 4. Worker Processes Job

```typescript
// Worker loop (apps/api/src/workers/rewards.ts)
while (true) {
  const job = await redis.lpop('reward_queue');
  
  if (job) {
    // Acquire lock to prevent duplicate processing
    const lock = await redis.set(`lock:${job.id}`, '1', 'NX', 'EX', 300);
    
    if (lock) {
      await processReward(job);
    }
  }
  
  await sleep(1000);
}
```

**Worker validates (again):**
- User still eligible (hasn't withdrawn already)
- Treasury has sufficient balance
- Wallet address is valid Kaspa format

### 5. TX Broadcast

```typescript
// Testnet: Kasplex API
const tx = await kasplexAPI.sendTokens({
  ticker: 'GEEK',
  from: TREASURY_ADDRESS,
  to: job.walletAddress,
  amount: job.amount,
  privateKey: TREASURY_PRIVATE_KEY
});

// Update job status
await db.reward.update({
  where: { id: job.id },
  data: {
    status: 'SENT',
    txid: tx.hash,
    sentAt: new Date()
  }
});
```

**TX includes:**
- Source: Treasury wallet
- Destination: User wallet
- Amount: `correctAnswers × REWARD_SATS_PER_CORRECT`
- Token: $GEEK (KRC-20)

### 6. Confirmation Polling

```typescript
// After delay, check TX status
setTimeout(async () => {
  const txStatus = await kaspaAPI.getTransaction(tx.hash);
  
  if (txStatus.confirmations >= 1) {
    await db.reward.update({
      where: { id: job.id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date()
      }
    });
  }
}, REWARD_CONFIRM_DELAY_MS);
```

**User sees:**
- Real-time status updates (polling every 3 seconds)
- TX hash (clickable link to block explorer)
- Confirmation status

## Reward Economics

### Configuration Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MIN_SCORE_FOR_REWARD` | 70 | Minimum accuracy (%) to earn |
| `REWARD_SATS_PER_CORRECT` | 750 | Sats paid per correct answer |
| `REWARD_CONFIRM_DELAY_MS` | 5000 | Delay before checking TX status |
| `GEEK_HOLD_REQUIREMENT` | 1000 | Min $GEEK to participate |

### Example Payouts

| Score | Correct | Amount | USD (est) |
|-------|---------|--------|-----------|
| 70% | 7/10 | 5,250 sats | $0.052 |
| 80% | 8/10 | 6,000 sats | $0.060 |
| 90% | 9/10 | 6,750 sats | $0.068 |
| 100% | 10/10 | 7,500 sats | $0.075 |

*Assumes $GEEK = $0.01/sat (hypothetical)*

## Security Considerations

### Preventing Double-Spend

```typescript
// Before processing reward
const existingReward = await db.reward.findFirst({
  where: { attemptId: job.attemptId }
});

if (existingReward) {
  throw new Error('Reward already issued');
}
```

### Treasury Safety

- Private keys stored in environment variables (never committed)
- Rate limiting on reward jobs (max 100/hour per wallet)
- Manual approval for large withdrawals (future feature)

### Audit Trail

Every reward generates:
1. Database record (PostgreSQL)
2. Blockchain TX (Kaspa)
3. Worker logs (pino)

**This creates:**
- Immutable proof of payout
- Ability to reconcile treasury balance
- Transparency for token holders

## Mainnet Transition

### Testnet (Current)
- Kasplex API for TX broadcast
- Small test payouts (750 sats/answer)
- Manual treasury refills

### Mainnet (Q2 2026)
- Direct Kaspa node integration
- Production reward amounts (TBD based on token price)
- Automated treasury management
- Multi-sig wallet security
- DAO governance over reward parameters

## Future Enhancements

### Phase 1 (Current)
✅ Basic reward queue  
✅ TX hash tracking  
✅ Status polling  

### Phase 2 (Q2 2026)
🚧 Batch processing for efficiency  
🚧 Dynamic reward adjustment based on treasury  
🚧 Streak multipliers (2x, 3x for consecutive wins)  

### Phase 3 (Q3 2026)
📝 Staking rewards for long-term holders  
📝 LP rewards for liquidity providers  
📝 Governance token voting on reward formulas  

## References

- [Reward Worker Source](../apps/api/src/workers/rewards.ts)
- [API Reward Routes](../apps/api/src/routes/rewards.ts)
- [Proof of Learning](PROOF_OF_LEARNING.md)

---

**TL;DR:** Quiz → Score → Queue → Worker → TX → Blockchain. Every step is auditable.
