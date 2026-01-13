<p align="center">
  <img src="https://storage.googleapis.com/maker-me/uploads/2024/07/08/17_51_33.914283_3b87640a-5c2f-48e0-a7d5-ec54199c0da9.png" alt="Geek Protocol Logo" width="200"/>
</p>

<h1 align="center">Geek Protocol</h1>

<p align="center">
  <strong>Transforming Knowledge into Digital Assets</strong><br/>
  <em>The Future of Gamified Learning on Kaspa</em>
</p>

<p align="center">
  <a href="https://geekprotocol.xyz"><img src="https://img.shields.io/badge/Website-geekprotocol.xyz-blue?style=flat-square" alt="Website"/></a>
  <a href="https://geek-litepaper-nu.vercel.app"><img src="https://img.shields.io/badge/Litepaper-Read-green?style=flat-square" alt="Litepaper"/></a>
  <a href="https://x.com/geekonkas"><img src="https://img.shields.io/twitter/follow/geekonkas?style=flat-square&logo=x" alt="X"/></a>
  <a href="https://t.me/GEEKonKAScommunity"><img src="https://img.shields.io/badge/Telegram-Join-blue?style=flat-square&logo=telegram" alt="Telegram"/></a>
</p>

<p align="center">
  <a href="https://github.com/GEEKProtocol0110/geek-protocol-alpha/actions/workflows/ci.yml"><img src="https://github.com/GEEKProtocol0110/geek-protocol-alpha/actions/workflows/ci.yml/badge.svg" alt="CI Status"/></a>
  <img src="https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js" alt="Node.js"/>
  <img src="https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat-square&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License"/>
</p>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development](#development)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Community](#community)
- [License](#license)

---

## Overview

**Geek Protocol** is a pioneering Quiz-to-Earn platform built on the Kaspa blockchain, where knowledge meets opportunity. By combining competitive trivia gameplay with cryptocurrency rewards, Geek Protocol creates an ecosystem where users can monetize their expertise across multiple categories including gaming, technology, entertainment, and culture.

This repository contains the alpha release featuring a production-ready monorepo architecture with enterprise-grade security, real-time leaderboards, automated reward distribution, and comprehensive testing infrastructure.

## Core Features

### 🎮 Geek Gauntlet Quiz Engine
- **Dynamic Challenge System:** 10-question competitive runs with intelligent 15-second time limits per question
- **Multi-Category Support:** 8 distinct knowledge domains including Video Games, Technology, Sci-Fi, Movies, Anime, Comics, History, and Pop Culture
- **Server-Side Validation:** Enterprise-grade anti-cheat with cryptographic attempt tokens and HMAC verification
- **Dual Play Modes:** Earn-to-Play for $GEEK rewards or Practice mode for skill development
- **Real-Time Feedback:** Instant scoring and performance analytics after each question

### 💰 Automated Reward Distribution
- **Redis-Powered Queue:** Fault-tolerant background worker processing with guaranteed delivery
- **Multi-State Tracking:** Complete reward lifecycle (PENDING → SENT → CONFIRMED → FAILED)
- **Idempotency Guarantees:** Redis locks prevent duplicate payouts and ensure data consistency
- **Real-Time Status Updates:** Live polling on result pages for immediate reward confirmation
- **Configurable Thresholds:** Flexible scoring requirements with admin-controlled payout triggers

### 🏆 Advanced Leaderboard System
- **Live Rankings:** Real-time leaderboard updates powered by PostgreSQL with efficient indexing
- **Comprehensive Metrics:** Track XP, user levels, win streaks, total attempts, and average performance
- **User Profiles:** Detailed personal dashboards with complete attempt history and achievement tracking
- **Global Competition:** Compare performance against the entire community

### 🔐 Secure Wallet Integration
- **KasWare Authentication:** Cryptographic signature-based authentication with nonce verification
- **JWT Session Management:** Secure cookie-based sessions with automatic refresh handling
- **Production-Ready Security:** HMAC attempt tokens, CSRF protection, and rate limiting
- **Seamless UX:** Auto-connect flow with wallet state persistence

### 📊 Administrative Dashboard
- **Comprehensive Monitoring:** Real-time view of all quiz attempts with filterable metrics
- **Reward Management:** Track and audit reward distribution across all statuses
- **User Analytics:** Filter by wallet address, user ID, or performance thresholds
- **Bulk Operations:** Efficient question import API for content management

### 🩺 System Health Monitoring
- **Multi-Layer Health Checks:** Database connectivity, Redis availability, and worker heartbeat monitoring
- **Visual Indicators:** TopBar status badges, in-game HUD updates, and result page health displays
- **API Endpoints:** Dedicated `/health` and `/health/worker` endpoints for load balancer integration
- **Graceful Degradation:** System continues operation with limited functionality during partial outages

## Technology Stack

### Frontend Architecture
- **Framework:** Next.js 16.1.1 with App Router and React Server Components 19.x
- **Styling:** Tailwind CSS 4 with custom utility classes and responsive design system
- **State Management:** React hooks with client-side hydration and optimistic updates
- **Testing:** Playwright 1.40+ for comprehensive end-to-end integration testing
- **Build System:** Turbopack for lightning-fast development builds and hot module replacement

### Backend Infrastructure
- **API Server:** Fastify 4.29+ with TypeScript for high-performance RESTful endpoints
- **Database:** PostgreSQL 15+ with Prisma ORM 5.22 for type-safe database access
- **Queue System:** Redis with ioredis 5.3+ for distributed task processing
- **Authentication:** JWT (jose 5.10+) with KasWare signature verification and nonce-based challenge-response
- **Security:** HMAC attempt validation, rate limiting, helmet middleware, and CORS configuration
- **Logging:** Structured logging with pino and pino-pretty for development observability

### DevOps & Tooling
- **Monorepo:** Turborepo 2.7+ with npm workspaces for efficient multi-package management
- **Containerization:** Docker Compose for local development with PostgreSQL and Redis services
- **Type Safety:** Zod 3.25+ for runtime schema validation and TypeScript 5+ for compile-time safety
- **Code Quality:** ESLint 9+ with Next.js configuration and TypeScript strict mode

## Project Structure

```
geek-protocol-alpha/
├── apps/
│   ├── api/                 # Fastify backend server
│   │   ├── src/
│   │   │   ├── routes/      # API route handlers
│   │   │   ├── lib/         # Auth, security, utilities
│   │   │   ├── workers/     # Background reward processor
│   │   │   └── scripts/     # Database seeding
│   │   └── prisma/          # Database schema & migrations
│   └── web/                 # Next.js frontend
│       ├── src/
│       │   ├── app/         # App Router pages & layouts
│       │   ├── components/  # React components
│       │   └── lib/         # Client utilities
│       └── tests/           # Playwright E2E tests
├── packages/
│   └── shared/              # Shared types & utilities
├── .github/
│   └── workflows/           # CI/CD pipelines
└── docker-compose.yml       # Local infrastructure
```

## Quick Start

### Prerequisites
- **Node.js:** Version 20.0 or higher (LTS recommended)
- **Package Manager:** npm 11.6.2+ (included with Node.js)
- **Container Runtime:** Docker 24+ and Docker Compose 2.x
- **Browser:** Modern browser with KasWare extension installed for earning mode

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/GEEKProtocol0110/geek-protocol-alpha.git
cd geek-protocol-alpha
```

2. **Install dependencies:**

```bash
npm install
```

3. **Start infrastructure services:**

```bash
docker-compose up -d
```

4. **Configure environment variables:**

```bash
# Root (shared values for tooling + docs)
cp .env.example .env

# API service (Fastify)
cp apps/api/.env.example apps/api/.env

# Web app (Next.js)
cp apps/web/.env.example apps/web/.env.local

# Edit each file with your secrets and URLs
```

5. **Initialize the database:**

```bash
cd apps/api
npm run prisma:push
npm run prisma:generate
npm run seed
cd ../..
```

### Development

**Start all services in development mode:**

```bash
npm run dev
```

**Access the application:**
- 🌐 **Frontend:** http://localhost:3000
- 🔌 **API Server:** http://localhost:3002
- 🛠️ **Admin Dashboard:** http://localhost:3000/admin

**Run individual services:**

```bash
npm run dev:web   # Frontend only
npm run dev:api   # Backend only
```

## Configuration

### Environment Variables

The main configuration file is `.env` in the project root. Key variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/geek_protocol"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"

# API Server
PORT=3002
NODE_ENV="development"

# Security
JWT_SECRET="your-secure-jwt-secret-here"
HMAC_SECRET="your-secure-hmac-secret-here"

# Features
ENABLE_REWARDS="true"
MIN_SCORE_FOR_REWARD="70"
REWARD_SATS_PER_CORRECT="750"
```

See [.env.example](.env.example) for workspace-wide defaults, [apps/api/.env.example](apps/api/.env.example#L1-L75) for backend-specific knobs, and [apps/web/.env.example](apps/web/.env.example) for frontend variables.

### Reward Economics Configuration

Tune the reward worker directly through environment variables in `apps/api/.env` (create the file from your shell if it does not already exist):

```bash
# Minimum server-side accuracy (percentage) required before a payout job is enqueued
MIN_SCORE_FOR_REWARD=75

# Amount of $GEEK (in atomic sats) paid per correct answer — adjust to hit your treasury targets
REWARD_SATS_PER_CORRECT=750

# Simulated confirmation delay for the worker (milliseconds). Increase in production to mirror on-chain settlement.
REWARD_CONFIRM_DELAY_MS=5000

# Require a verified KasWare wallet signature before rewards progress past PENDING
REWARD_REQUIRE_WALLET=true

# Flip to "true" only when you are ready to broadcast real payouts
ENABLE_REWARDS=false

# Existing knobs (database + redis)
REDIS_HOST=localhost
REDIS_PORT=6379

# …plus DATABASE_URL, JWT_SECRET, ATTEMPT_TOKEN_SECRET, etc.
```

Once edited, restart the Fastify API and the reward worker so the new economics take effect:

```bash
npm run dev -- --filter=api   # API
node apps/api/dist/workers/rewards.js  # or tsx for TS source
```

Because payouts depend on quiz accuracy, a higher `MIN_SCORE_FOR_REWARD` tightens eligibility, while a larger `REWARD_SATS_PER_CORRECT` scales the amount linearly by the player’s correct count. `REWARD_CONFIRM_DELAY_MS` only affects user-facing status transitions (SENT ➡ CONFIRMED) and can be lengthened to simulate on-chain confirmation windows.

## Testing

- **Type checking:** `npm run type-check`
- **Linting:** `npm run lint`
- **Playwright E2E tests (CLI):** `cd apps/web && npm run test`
- **Playwright UI mode:** `cd apps/web && npm run test:ui`

> Tip: Run `npm run dev:api` and `npm run dev:web` in separate terminals when executing Playwright tests to ensure both services are online.

## Deployment

### Production build

```bash
npm run build
```

### Vercel (recommended)

1. Connect the GitHub repository to Vercel
2. Add the required environment variables in the Vercel dashboard
3. Push to `main` (or open a PR) to trigger automatic deployments
4. Monitor builds via the Vercel UI or CLI

See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for a complete go-live walkthrough.

### Docker Compose

```bash
docker-compose up --build -d
```

For production, create an override file (for example `docker-compose.prod.yml`) with hardened settings, secrets, and scaling directives.

## Community & Support

- 💬 [Telegram – GEEKonKAS Community](https://t.me/GEEKonKAScommunity)
- 🐦 [X / Twitter – @geekonkas](https://x.com/geekonkas)
- 🌐 [Website](https://geekprotocol.xyz)
- 📄 [Litepaper](https://geek-litepaper-nu.vercel.app)
- 🐛 [GitHub Issues](https://github.com/GEEKProtocol0110/geek-protocol-alpha/issues)

## Roadmap

- **Q1 2026:** Public beta launch on Kaspa mainnet
- **Q2 2026:** Mobile app releases (iOS + Android)
- **Q3 2026:** Tournament modes, clans, and seasonal ladders
- **Q4 2026:** NFT achievements, creator tools, and social layers

## Security

We take security seriously. If you discover a vulnerability, please email **security@geekprotocol.xyz** instead of opening a public issue. Include reproduction steps, impacted components, and any proof-of-concept payloads so we can respond quickly. See [SECURITY.md](SECURITY.md) for the responsible disclosure process.

## Contributing

We welcome contributions! Please review [CONTRIBUTING.md](CONTRIBUTING.md) for coding standards, commit conventions, and the end-to-end contribution workflow. High-level steps:

1. Fork the repo and create a feature branch from `main`
2. Implement changes with tests and documentation updates
3. Ensure `npm run lint`, `npm run type-check`, and `npm run build` succeed
4. Open a Pull Request describing the motivation and behavior changes

### Getting Help

- 💬 **Telegram:** Join [GEEKonKAS Community](https://t.me/GEEKonKAScommunity) for discussions
- 🐦 **X/Twitter:** Follow [@geekonkas](https://x.com/geekonkas) for updates
- 🐛 **Issues:** Report bugs or request features on [GitHub Issues](https://github.com/GEEKProtocol0110/geek-protocol-alpha/issues)

## License

MIT License - Copyright (c) 2026 Geek Protocol

---

<p align="center">
  <strong>Transform Your Knowledge into Digital Assets</strong><br/>
  <a href="https://geekprotocol.xyz">Visit Geek Protocol</a>
</p>

<p align="center">
  <sub>All hope, no hype. 🚀</sub>
</p>
