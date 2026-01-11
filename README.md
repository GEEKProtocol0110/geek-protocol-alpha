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

## Quick Start

### System Requirements
- **Node.js:** Version 20.0 or higher (LTS recommended)
- **Package Manager:** npm 11.6.2+ (included with Node.js)
- **Container Runtime:** Docker 24+ and Docker Compose 2.x
- **Browser:** Modern browser with KasWare extension installed for earning mode

### Installation & Setup

\`\`\`bash
# Clone the repository
git clone https://github.com/GEEKProtocol0110/geek-protocol-alpha.git
cd geek-protocol-alpha

# Install all workspace dependencies
npm install

# Start infrastructure services (PostgreSQL + Redis)
docker-compose up -d

# Navigate to API directory and configure environment
cd apps/api
cp .env.example .env

# Edit .env file with your configuration

# Initialize database schema
npm run prisma:push

# Generate Prisma client
npm run prisma:generate

# Seed initial question bank
npm run seed

# Return to project root
cd ../..
\`\`\`

### Development Workflow

\`\`\`bash
# Start all services
npm run dev
\`\`\`

**Service Endpoints:**
- 🌐 **Web Application:** http://localhost:3000
- 🔌 **API Server:** http://localhost:3002
- 🛠️ **Admin Dashboard:** http://localhost:3000/admin

## Contributing

We welcome contributions! Please fork the repository, create a feature branch, make your changes, and submit a pull request.

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
