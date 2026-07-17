# Geek Protocol - System Architecture

> **Version**: Alpha (v0.1.0)  
> **Last Updated**: January 2026

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐ │
│  │   Browser    │      │  KasWare     │      │   Mobile     │ │
│  │  (Next.js)   │◄────►│   Wallet     │      │    (PWA)     │ │
│  └──────────────┘      └──────────────┘      └──────────────┘ │
│         │                      │                      │        │
└─────────┼──────────────────────┼──────────────────────┼────────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API GATEWAY LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│             ┌───────────────────────────────┐                  │
│             │    Fastify API Server         │                  │
│             │  (apps/api/src/routes/)       │                  │
│             ├───────────────────────────────┤                  │
│             │ ► /auth    - Wallet login     │                  │
│             │ ► /quiz    - Start/submit     │                  │
│             │ ► /rewards - Claim payout     │                  │
│             │ ► /leaderboard - Rankings     │                  │
│             │ ► /admin   - Question mgmt    │                  │
│             └───────────────────────────────┘                  │
│                         │                                       │
│                         ├── Rate Limiting                       │
│                         ├── JWT Auth Middleware                │
│                         ├── HMAC Attempt Validation            │
│                         └── CORS & Security Headers            │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────┐   ┌────────────────┐   ┌────────────────┐ │
│  │  Quiz Engine   │   │ Reward Logic   │   │  Leaderboard   │ │
│  ├────────────────┤   ├────────────────┤   ├────────────────┤ │
│  │ • Shuffle Qs   │   │ • Calculate    │   │ • XP ranking   │ │
│  │ • Validate     │   │   payouts      │   │ • Score calc   │ │
│  │ • Score calc   │   │ • Queue job    │   │ • Streak mgmt  │ │
│  │ • Anti-cheat   │   │ • Status track │   │ • Pagination   │ │
│  └────────────────┘   └────────────────┘   └────────────────┘ │
│                                                                 │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐              ┌─────────────────────┐  │
│  │   PostgreSQL DB     │              │      Redis          │  │
│  ├─────────────────────┤              ├─────────────────────┤  │
│  │ • users             │              │ • Job queues        │  │
│  │ • questions         │              │ • Rate limit cache  │  │
│  │ • quiz_attempts     │              │ • Session store     │  │
│  │ • rewards           │              │ • Leaderboard cache │  │
│  │ • leaderboard_cache │              └─────────────────────┘  │
│  └─────────────────────┘                                       │
│           │                                                     │
│           └─────► Prisma ORM (Type-safe queries)               │
│                                                                 │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKGROUND WORKERS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Reward Processing Worker                       │  │
│  │        (apps/api/src/workers/rewards.ts)                 │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  1. Dequeue reward job from Redis                        │  │
│  │  2. Verify user eligibility (min score, $GEEK balance)   │  │
│  │  3. Call Kaspa RPC to send transaction                   │  │
│  │  4. Update reward status in DB                           │  │
│  │  5. Retry on failure (exponential backoff)               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────┐          ┌────────────────────┐        │
│  │   Kaspa Network    │          │  Kasplex API       │        │
│  ├────────────────────┤          ├────────────────────┤        │
│  │ • Mainnet RPC      │          │ • KRC-20 balance   │        │
│  │ • Transaction      │          │ • Token metadata   │        │
│  │   broadcast        │          │ • Transfer history │        │
│  │ • Confirmations    │          └────────────────────┘        │
│  └────────────────────┘                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### Frontend (Next.js 15 - App Router)
**Location**: `apps/web/src/`

| Component | Purpose |
|-----------|---------|
| `app/landing/` | Marketing landing page with hero, features, FAQ |
| `app/play/` | Quiz gameplay interface (timer, questions, results) |
| `app/dashboard/` | User profile, stats, lore, achievements |
| `app/leaderboard/` | Global rankings table |
| `components/WalletProvider.tsx` | KasWare wallet connection context |
| `lib/questions.ts` | MVP question bank (client-safe) |

**Key Tech**: React Server Components, Client Components, Tailwind CSS, Framer Motion

---

### Backend API (Fastify)
**Location**: `apps/api/src/`

| Route | Methods | Purpose |
|-------|---------|---------|
| `/auth` | POST `/nonce`, POST `/verify`, POST `/logout` | Wallet authentication flow |
| `/quiz` | POST `/start`, POST `/submit` | Quiz lifecycle |
| `/rewards` | GET `/user/:userId`, GET `/attempt/:attemptId` | Reward status lookup |
| `/leaderboard` | GET `/top`, GET `/user/:userId` | Rankings |
| `/admin` | GET `/attempts`, GET `/rewards`, POST `/questions` | Internal tooling |
| `/health` | GET `/` | Liveness check |

**Middleware**:
- `authMiddleware`: Optional JWT verification (attaches `userId` to request)
- Rate limiting: 100 req/min per IP (configurable)
- CORS: Whitelist frontend origin

---

### Database Schema (Prisma + PostgreSQL)
**Location**: `apps/api/prisma/schema.prisma`

**Core Models**:

```prisma
model User {
  id            String   @id @default(cuid())
  walletAddress String   @unique
  xp            Int      @default(0)
  level         Int      @default(1)
  streak        Int      @default(0)
  lastAttemptAt DateTime?
  attempts      QuizAttempt[]
  rewards       Reward[]
}

model Question {
  id            String   @id @default(cuid())
  category      String
  prompt        String
  options       String[] // JSON array
  correctIndex  Int
  difficulty    Difficulty
  tags          String[]
  active        Boolean  @default(true)
  version       Int      @default(1)
}

model QuizAttempt {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  category      String
  questionIds   String[] // IDs of questions shown
  answers       Int[]    // User's selected indices
  score         Int      // Correct answers count
  scorePct      Float    // Percentage (0-100)
  startedAt     DateTime
  finishedAt    DateTime
  timeSeconds   Int
  reward        Reward?
}

model Reward {
  id            String   @id @default(cuid())
  attemptId     String   @unique
  attempt       QuizAttempt @relation(fields: [attemptId], references: [id])
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  amount        Int      // satoshis
  status        RewardStatus // PENDING | SENT | CONFIRMED | FAILED
  txid          String?
  error         String?
  createdAt     DateTime @default(now())
  confirmedAt   DateTime?
}
```

---

### Shared Validation Schemas
**Location**: `packages/shared/src/index.ts`

Uses **Zod** for runtime type checking and API contract enforcement.

**Examples**:
- `StartQuizRequestSchema`: Validates category selection
- `SubmitQuizRequestSchema`: Validates attempt ID, token, answers array
- `AdminQuestionImportSchema`: Validates bulk question uploads

**Why shared?**
- Backend validates incoming requests
- Frontend validates user input before submission
- Single source of truth for types

---

## Security Model

### Authentication Flow
1. Frontend requests nonce from `/auth/nonce`
2. User signs nonce with KasWare wallet (EIP-191 style message)
3. Frontend sends signature + wallet address to `/auth/verify`
4. Backend verifies signature, creates JWT, sets `HttpOnly` cookie
5. Subsequent requests include JWT in `Authorization: Bearer <token>` or cookie

### Anti-Cheat Measures
- **HMAC Attempt Tokens**: Each quiz start generates a server-signed token that must be included on submit (prevents replay attacks)
- **Rate Limiting**: IP-based throttling (100 req/min)
- **Answer Concealment**: Questions sent without `correctIndex` field
- **Time Validation**: Server checks if submission falls within 15-minute window
- **Database Constraints**: Unique indexes prevent duplicate attempts

### Future Enhancements
- Wallet staking requirement (must hold 1000 $GEEK to earn)
- Machine learning anomaly detection (flag suspicious patterns)
- Captcha for high-value rewards

---

## Deployment Architecture

### Development
```
localhost:3000  → Next.js dev server
localhost:3002  → Fastify API
localhost:5432  → PostgreSQL (Docker)
localhost:6379  → Redis (Docker)
```

**Command**: `docker-compose up`

---

### Production (Example - AWS)

```
┌─────────────────────────────────────────────┐
│            Vercel / AWS CloudFront          │ (CDN)
│                  ↓                          │
│         apps/web (Next.js SSR)              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         AWS ALB (Load Balancer)             │
│                  ↓                          │
│     apps/api (ECS/Fargate Containers)       │
│                  ↓                          │
│  ┌──────────────────┐   ┌────────────────┐ │
│  │   RDS Postgres   │   │ ElastiCache    │ │
│  │   (Multi-AZ)     │   │   Redis        │ │
│  └──────────────────┘   └────────────────┘ │
└─────────────────────────────────────────────┘
```

**Infrastructure as Code**: Docker Compose (dev) → Terraform or CDK (prod)

---

## Data Flow Examples

### Quiz Start Flow
```
1. User → [POST /quiz/start] → API
2. API → authMiddleware() → extract userId from JWT
3. API → Prisma.question.findMany() → fetch random questions
4. API → makeAttemptToken() → generate HMAC token
5. API → Prisma.quizAttempt.create() → log attempt in DB
6. API → Response: { attemptId, attemptToken, questions }
7. User → Frontend renders quiz interface
```

### Quiz Submit Flow
```
1. User → [POST /quiz/submit] → API (with attemptToken)
2. API → verifyAttemptToken() → validate HMAC signature
3. API → Prisma.question.findMany() → fetch correct answers
4. API → calculateScore() → compare user answers vs correct
5. API → Prisma.quizAttempt.update() → save results
6. IF score >= 75%:
   API → Redis.enqueue() → create reward job
7. API → Response: { score, scorePct, correctAnswers, rewardId? }
8. Background Worker → process reward async
```

### Reward Processing (Background)
```
1. Worker → Redis.dequeue() → pull reward job
2. Worker → Prisma.reward.findUnique() → get reward details
3. Worker → Kaspa RPC → sendTransaction(userWallet, amount)
4. Worker → Prisma.reward.update({ status: 'SENT', txid })
5. Worker → setTimeout() → check confirmation after 30s
6. Worker → Kaspa RPC → getTransaction(txid) → check confirmations
7. Worker → Prisma.reward.update({ status: 'CONFIRMED' })
```

---

## Scaling Considerations

### Current Capacity (Alpha)
- **Concurrent Users**: ~1,000 (single API instance)
- **Database**: ~10K quiz attempts/day
- **Redis**: ~100K job queue ops/day

### Scaling Paths
1. **Horizontal API Scaling**: Add more Fastify instances behind ALB
2. **Database Read Replicas**: Separate read queries (leaderboard) from writes
3. **Redis Cluster**: Shard queue by user ID hash
4. **CDN Caching**: Static assets + quiz results (short TTL)
5. **Question Bank Sharding**: Partition by category for parallel fetching

---

## Monitoring & Observability

### Metrics to Track
- **API**: Request rate, error rate, p95 latency
- **Database**: Query duration, connection pool usage
- **Rewards**: Queue length, success rate, failed transaction count
- **User**: Churn rate, daily actives, quiz completion rate

### Tools (Future)
- **Logging**: Pino (structured JSON logs) → AWS CloudWatch or Datadog
- **Tracing**: OpenTelemetry → Jaeger or Honeycomb
- **Alerts**: PagerDuty for critical failures (reward worker down, DB unreachable)

---

## Further Reading

- [Deployment Guide](../DEPLOYMENT.md)
- [Security Policy](../../SECURITY.md)
- [Token Flow](../TOKEN_FLOW.md)
- [Proof of Learning](../PROOF_OF_LEARNING.md)

---

*Architecture evolves. This is v0.1.0-alpha. Contributions welcome.*
