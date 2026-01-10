# GEEK Protocol — Monorepo Build (In Progress)

## 📁 Structure

```
geek-protocol-alpha/
├── apps/
│   ├── web/              # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/      # App router pages
│   │   │   ├── components/
│   │   │   └── lib/
│   │   ├── public/
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   └── tsconfig.json
│   │
│   └── api/              # Fastify backend
│       ├── src/
│       │   ├── index.ts       # Entry point
│       │   ├── lib/
│       │   │   └── logger.ts
│       │   └── routes/
│       │       ├── auth.ts    # Nonce + signature + JWT
│       │       ├── quiz.ts    # Start + submit
│       │       ├── rewards.ts # Reward lookup
│       │       ├── leaderboard.ts
│       │       └── admin.ts
│       ├── prisma/
│       │   └── schema.prisma  # Database schema
│       ├── package.json
│       ├── tsconfig.json
│       └── .env.local
│
├── packages/
│   └── shared/           # Shared types + schemas
│       ├── src/
│       │   └── index.ts  # Zod schemas + types
│       ├── package.json
│       └── tsconfig.json
│
├── package.json          # Workspace root
├── turbo.json           # Turbo config
├── .env.example         # Environment template
└── README.md
```

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
```

Update `.env.local` with:
- PostgreSQL connection string
- Redis host/port
- JWT secret
- Kaspa testnet RPC URL

### 3. Initialize database

```bash
cd apps/api
npx prisma migrate dev --name init
```

### 4. Run development servers

```bash
npm run dev
```

This starts:
- **Frontend** (Next.js): `http://localhost:3000`
- **Backend** (Fastify): `http://localhost:3001`

Or run individually:
```bash
npm run dev:web   # Frontend only
npm run dev:api   # Backend only
```

## 📦 Workspace Commands

- `npm run build` — Build all apps
- `npm run lint` — Lint all code
- `npm run type-check` — TypeScript check all workspaces
- `npm run dev` — Start all dev servers

## 🔑 Core Flows (To Implement)

### 1. Auth Flow ✅ (Scaffolded)
```
POST /auth/nonce → returns nonce
Client signs with KasWare
POST /auth/verify → returns JWT + session cookie
GET /auth/me → returns user profile
```

### 2. Quiz Flow (TODO)
```
POST /quiz/start → returns attemptId + questions (no answers)
POST /quiz/submit → validates + scores on server
GET /quiz/history → user's previous attempts
```

### 3. Reward Flow (TODO)
```
Worker polls for pending attempts
Checks wallet $GEEK balance (Kasplex)
Broadcasts payout transaction
Tracks confirmation + updates DB
```

## 🗄️ Database Schema

### Key Tables
- **users** — User profile (XP, level, streak)
- **questions** — Quiz questions with correct answers
- **attempts** — Quiz attempts (locked answers, scoring)
- **rewards** — Payouts (PENDING → SENT → CONFIRMED/FAILED)
- **nonces** — Auth nonces (single-use)

### Uniqueness Constraints
- `users.walletAddress` UNIQUE
- `rewards.attemptId` UNIQUE (idempotency)

## 🔐 Security Requirements

- ✅ Nonce single-use with TTL
- ✅ JWT session tokens (httpOnly cookies)
- ✅ Signature verification (TODO: integrate KasWare)
- ✅ Server-side scoring only (never trust client)
- ✅ Idempotent rewards via DB unique + Redis lock (TODO)
- ⏳ Rate limiting (TODO: Redis-based)
- ⏳ Wallet $GEEK hold requirement check (TODO: Kasplex)

## 📝 Next Steps

1. Integrate KasWare signature verification in auth
2. Implement quiz start/submit endpoints
3. Add server-side scoring logic
4. Build BullMQ reward worker
5. Add Kasplex balance checking
6. Create admin dashboard routes
7. UI: connect screen, quiz, results, leaderboard
8. E2E testing + deployment setup

## 📚 Tech Stack

- **Frontend**: Next.js 16 + React 19 + Tailwind CSS
- **Backend**: Fastify + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **Jobs**: BullMQ (background payouts)
- **Auth**: JWT + KasWare signature login
- **Monorepo**: Turbo

## 🤝 Contributing

All code must:
- Pass TypeScript strict mode
- Follow naming conventions
- Include server-side validation (Zod)
- Never trust client for critical logic

---

**Status**: Scaffolding complete. Core flows in progress.
