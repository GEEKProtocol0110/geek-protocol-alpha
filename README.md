<p align="center">
  <img src="https://storage.googleapis.com/maker-me/uploads/2024/07/08/17_51_33.914283_3b87640a-5c2f-48e0-a7d5-ec54199c0da9.png" alt="Geek Protocol Logo" width="200"/>
</p>

<h1 align="center">Geek Protocol Alpha</h1>

<p align="center">
  <strong>Your Knowledge is Now an Asset.</strong><br/>
  <em>All hope, no hype.</em>
</p>

<p align="center">
  <a href="https://geekprotocol.xyz">Website</a> •
  <a href="https://geek-litepaper-nu.vercel.app">Litepaper</a> •
  <a href="https://x.com/geekonkas">X (Twitter)</a> •
  <a href="https://t.me/GEEKonKAScommunity">Telegram</a>
</p>

---

## **About Geek Protocol**

Geek Protocol is a gamified Web3 Quiz-to-Earn platform built on **Kaspa**. Compete in high-stakes trivia, earn $GEEK tokens, and monetize your knowledge. This alpha release features the core quiz engine, KasWare wallet integration, reward orchestration, and real-time leaderboards.

## **Project Status**

**Phase:** `Alpha MVP (Active Development)`

✅ **Completed:**
- Quiz-to-Earn engine with 10-question runs
- Server-side scoring and fraud detection
- KasWare wallet authentication with signature verification
- Redis-powered reward worker with idempotency
- Real-time leaderboards (XP, level, streak)
- Admin dashboard for attempts and rewards monitoring
- Health monitoring (API + worker heartbeat)
- Playwright integration tests
- Docker Compose local dev environment

🚧 **In Progress:**
- Kasplex integration for actual $GEEK payouts
- Enhanced anti-cheat mechanisms
- Production deployment pipeline

## **Features**

### 🧠 **Quiz-to-Earn "Geek Gauntlet"**
- **10-question runs** with 15-second per-question timer (90s total)
- **8 categories:** Video Games, Sci-Fi & Fantasy, Movies & TV, Comics, Anime & Manga, Tech & Programming, History, Pop Culture
- **Server-side scoring** to prevent client manipulation
- **Instant feedback** after each question
- **Earn/Practice modes:** Connect KasWare to earn $GEEK, or play without wallet

### 🏆 **Leaderboards & Progression**
- **Real-time leaderboards** ranked by XP
- **User stats:** Level, streak, total attempts, average score
- **Profile pages** with personal performance history

### 💎 **Rewards System**
- **Automatic reward processing** via Redis worker
- **Status tracking:** PENDING → SENT → CONFIRMED
- **Idempotency locks** to prevent double-payouts
- **Real-time polling** on result page for reward updates

### 🔐 **KasWare Wallet Integration**
- **Signature-based authentication** with nonce verification
- **Session management** with JWT cookies
- **Production-ready signing** with dev fallback
- **Auto-connect flow** on wallet interaction

### 📊 **Admin Dashboard**
- View all quiz attempts with scores, times, and flags
- Monitor rewards by status (PENDING/SENT/CONFIRMED/FAILED)
- Filter by wallet address or user ID
- Bulk question import API

### 🩺 **Health Monitoring**
- **API health checks:** Database + Redis connectivity
- **Worker heartbeat:** 15s intervals with liveness tracking
- **UI indicators:** TopBar badge, play HUD, result page
- **Status endpoints:** `/health`, `/health/worker`

## **Tech Stack**

### **Frontend**
- **Framework:** Next.js 16.1.1 (App Router), React 19
- **Styling:** Tailwind CSS 4
- **State:** React hooks, client components
- **Testing:** Playwright 1.40

### **Backend**
- **API:** Fastify 4.25 with TypeScript
- **Database:** PostgreSQL (Prisma ORM)
- **Queue:** Redis + ioredis (reward worker)
- **Auth:** JWT (jose), KasWare signature verification
- **Security:** HMAC attempt tokens, nonce-based auth

### **Infrastructure**
- **Monorepo:** Turbo, npm workspaces
- **Local Dev:** Docker Compose (Postgres + Redis)
- **Blockchain:** Kaspa (KasWare wallet integration)

## **Getting Started**

### **Prerequisites**
- Node.js 20+
- Docker + Docker Compose
- KasWare wallet extension (for earn mode)

### **Installation**

```bash
# Clone repository
git clone https://github.com/GEEKProtocol0110/geek-protocol-alpha.git
cd geek-protocol-alpha

# Install dependencies
npm install

# Start Postgres + Redis
docker-compose up -d

# Set up API environment
cd apps/api
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, HMAC_SECRET

# Push Prisma schema
npm run prisma:push

# Generate Prisma client
npm run prisma:generate

# Seed questions
npm run seed
```

### **Development**

```bash
# Terminal 1: Start API server
npm run dev:api

# Terminal 2: Start reward worker
cd apps/api
npm run dev:worker

# Terminal 3: Start web app
npm run dev:web
```

**Access:**
- Web: http://localhost:3000
- API: http://localhost:3002
- Admin: http://localhost:3000/admin

### **Testing**

```bash
# Run Playwright tests
npm run test -w @geek/web

# Run with UI
npm run test:ui -w @geek/web

# Type-check
npm run type-check
```

## **Project Structure**

```
geek-protocol-alpha/
├── apps/
│   ├── api/                 # Fastify backend
│   │   ├── prisma/          # Database schema
│   │   ├── src/
│   │   │   ├── routes/      # API endpoints
│   │   │   ├── workers/     # Reward worker
│   │   │   ├── lib/         # Auth, security, logging
│   │   │   └── types/       # TypeScript definitions
│   │   └── package.json
│   └── web/                 # Next.js frontend
│       ├── src/
│       │   ├── app/         # App Router pages
│       │   ├── components/  # React components
│       │   └── lib/         # API client, utilities
│       ├── tests/           # Playwright tests
│       └── package.json
├── packages/
│   └── shared/              # Shared types & schemas
├── docker-compose.yml       # Local dev stack
└── turbo.json              # Monorepo config
```

## **API Endpoints**

### **Auth**
- `POST /api/auth/nonce` - Generate signature nonce
- `POST /api/auth/verify` - Verify KasWare signature & issue JWT
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Clear session

### **Quiz**
- `POST /api/quiz/start` - Start new quiz attempt
- `POST /api/quiz/submit` - Submit answers for scoring
- `GET /api/quiz/history/:userId` - Get user attempt history

### **Rewards**
- `GET /api/rewards/:attemptId` - Get reward status

### **Leaderboard**
- `GET /api/leaderboard/top` - Top users by XP
- `GET /api/leaderboard/user/:userId` - User stats

### **Admin**
- `GET /api/admin/attempts` - List attempts (filterable)
- `GET /api/admin/rewards` - List rewards (filterable)
- `POST /api/admin/questions/import` - Bulk import questions

### **Health**
- `GET /health` - API health (DB + Redis)
- `GET /health/worker` - Worker heartbeat status

## **Environment Variables**

### **API (.env)**
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/geekdb"
REDIS_HOST="localhost"
REDIS_PORT="6379"
JWT_SECRET="your-secret-key-here"
HMAC_SECRET="your-hmac-secret-here"
FRONTEND_URL="http://localhost:3000"
PORT="3002"
MIN_SCORE_FOR_REWARD="70"
ENABLE_REWARDS="false"
```

### **Web (.env.local)**
```bash
NEXT_PUBLIC_API_URL="http://localhost:3002"
```

## **Deployment**

The project is deployment-ready with:
- Production builds via `npm run build`
- Docker Compose for staging/production
- Health endpoints for load balancer checks
- Graceful shutdown handlers

**Recommended hosts:**
- **Web:** Vercel, Netlify, or Cloudflare Pages
- **API:** Railway, Render, or Fly.io
- **Database:** Neon, Supabase, or managed Postgres
- **Redis:** Upstash or managed Redis

## **Contributing**

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Community:**
- Join [Telegram](https://t.me/GEEKonKAScommunity) for discussions
- Follow [@geekonkas](https://x.com/geekonkas) for updates

## **Roadmap**

- [x] Quiz engine with server-side scoring
- [x] KasWare wallet integration
- [x] Reward worker with Redis queue
- [x] Leaderboards and user stats
- [x] Admin dashboard
- [x] Health monitoring
- [x] Integration tests
- [ ] Kasplex $GEEK payouts
- [ ] Enhanced anti-cheat (timing analysis, pattern detection)
- [ ] Achievement NFTs
- [ ] Community question submission
- [ ] Mobile app (React Native)

## **License**

MIT License - see LICENSE file for details.

---

**All hope, no hype.** 🚀
