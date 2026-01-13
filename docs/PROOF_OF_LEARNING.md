# Proof of Learning

## Core Principle

**Geek Protocol validates knowledge, not luck.**

Unlike traditional quiz apps where rewards are disconnected from skill, we cryptographically prove that a user answered questions correctly within time constraints, making rewards a direct function of demonstrated knowledge.

## Reward Eligibility Requirements

A user earns $GEEK rewards **only when all four conditions are met:**

1. **Wallet is authenticated** — User must have a verified KasWare wallet address
2. **Quiz attempt is validated server-side** — Answers are scored against correct answers on the server
3. **Payout job is enqueued & processed by worker** — Reward job added to queue and executed by background worker
4. **Payout status is confirmed and displayed** — Transaction is confirmed and status visible to user

## How It Works

### 1. Quiz Initialization

```
User initiates quiz → Server generates attempt ID + HMAC token
```

The **attempt token** is a cryptographic signature that:
- Binds the quiz session to a specific user
- Includes a timestamp to prevent replay attacks
- Cannot be forged without the server's secret key

### 2. Question Delivery

```
Server sends questions + choices (answer NOT included)
Client displays questions with 15-second timer per question
```

**Anti-cheat at this layer:**
- Questions are randomized per attempt
- Timer enforced client-side (UX) and validated server-side (truth)
- Answers never sent to client

### 3. Answer Submission

```
User submits answers → Server validates:
  1. Attempt token signature
  2. Time elapsed (must be realistic)
  3. Answer correctness
  4. One submission per attempt ID
```

**Server-side validation prevents:**
- Answer inspection (client never sees correct answers)
- Time manipulation (server checks total elapsed time)
- Replay attacks (attempt tokens are single-use)
- Bot farming (rate limiting by wallet address)

### 4. Score Calculation & Reward Eligibility

```
Score = (Correct Answers / Total Questions) × 100
Payout job enqueued → reward_queue
```

**Step 1: Wallet Authentication**
- User must have authenticated wallet via KasWare
- Wallet address stored and verified in database
- Required before any reward processing begins

**Step 2: Server-Side Validation**
- Attempt token verified (HMAC signature)
- Time elapsed validated (must be realistic)
- Each answer checked against correct answers
- Score calculated: `scorePct = (correct / total) × 100`
- Reward job enqueued to Redis: `reward_queue`

**Step 3: Worker Processing**
Rewards triggered only if:
- `Score >= MIN_SCORE_FOR_REWARD` (default: 70%)
- User has valid wallet address
- No duplicate reward for same attempt
- Amount calculated: `correct × REWARD_SATS_PER_CORRECT`

Worker creates reward record with status:
- `PENDING` → Initial creation
- `SENT` → Transaction broadcast (simulated or real)
- `CONFIRMED` → Transaction confirmed on-chain

**Step 4: Status Display**
- Reward status tracked in database
- Status queryable via API endpoints
- User sees confirmation in dashboard
- Transaction hash visible (when applicable)

### 5. Reward Proof

```
Reward job enqueued → Worker validates again → TX broadcast → Hash stored
```

**Immutable audit trail:**
- Attempt ID → Score → Reward amount → TX hash
- Stored in PostgreSQL
- TX visible on Kaspa blockchain
- Cannot be altered retroactively

## Security Layers

| Layer | Protection | Implementation |
|-------|------------|----------------|
| **Network** | Rate limiting | 100 req/15min per IP |
| **Authentication** | Signature verification | KasWare wallet signatures |
| **Session** | HMAC tokens | JWT + cryptographic binding |
| **Logic** | Server-side validation | All answers checked server-side |
| **Replay** | Single-use attempts | Attempt ID expires after submission |
| **Sybil** | Wallet gating | Must hold MIN $GEEK to earn |
| **Audit** | Blockchain proof | Every reward = TX hash |

## Future Enhancements

### Phase 1 (Current Alpha)
✅ Basic server-side validation  
✅ Time-bound attempts  
✅ Cryptographic tokens  

### Phase 2 (Q2 2026)
🚧 Device fingerprinting  
🚧 IP geolocation scoring  
🚧 Behavioral analysis (mouse patterns, typing speed)  

### Phase 3 (Q3 2026)
📝 Proof-of-attention mechanisms  
📝 Social graph trust scores  
📝 DAO-based dispute resolution  

## Why This Matters

Most learn-to-earn platforms fail because:
1. **No real validation** → Bots farm rewards
2. **Centralized trust** → Platform can rug
3. **Opaque economics** → Users don't know if rewards are real

Geek Protocol solves this by:
1. **Cryptographic proof** → Can't fake knowledge
2. **Blockchain settlement** → TX hashes don't lie
3. **Open source** → Audit the code yourself

## Technical References

- [HMAC Token Implementation](../apps/api/src/lib/security.ts)
- [Reward Worker Logic](../apps/api/src/workers/rewards.ts)
- [Token Flow Diagram](TOKEN_FLOW.md)

---

**TL;DR:** You can't cheat your way to rewards. Knowledge = proof = payout.
