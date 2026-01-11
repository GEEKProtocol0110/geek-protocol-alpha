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

```bash
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

# Edit .env file with your configuration:
# - DATABASE_URL: PostgreSQL connection string
# - REDIS_HOST: Redis server hostname
# - JWT_SECRET: Strong random secret for token signing
# - HMAC_SECRET: Strong random secret for attempt validation

# Initialize database schema
npm run prisma:push

# Generate Prisma client
npm run prisma:generate

# Seed initial question bank
npm run seed

# Return to project root
cd ../..
```

### Development Workflow

```bash
# Option 1: Start all services (recommended)
npm run dev

# Option 2: Start services individually
# Terminal 1 - API Server
npm run dev:api

# Terminal 2 - Reward Worker (in apps/api directory)
cd apps/api && npm run dev:worker

# Terminal 3 - Web Application
npm run dev:web
```

**Service Endpoints:**
- 🌐 **Web Application:** http://localhost:3000
- 🔌 **API Server:** http://localhost:3002
- 🛠️ **Admin Dashboard:** http://localhost:3000/admin
- 📊 **API Health Check:** http://localhost:3002/health

### Quality Assurance

```bash
# Run end-to-end tests
npm run test -w @geek/web

# Interactive test UI mode
npm run test:ui -w @geek/web

# TypeScript type checking across all packages
npm run type-check

# Lint code for style and quality issues
npm run lint

# Build production bundles
npm run build
```

## Development Status

### ✅ Completed Features

- [x] **Quiz Engine:** Complete 10-question gameplay with multi-category support
- [x] **Server-Side Validation:** HMAC-secured attempt tokens and anti-cheat measures
- [x] **Wallet Authentication:** KasWare signature verification with nonce-based security
- [x] **Reward System:** Redis-powered background worker with idempotency guarantees
- [x] **Leaderboards:** Real-time rankings with comprehensive user statistics
- [x] **Admin Dashboard:** Complete monitoring interface for attempts and rewards
- [x] **Health Monitoring:** Multi-layer health checks with worker heartbeat tracking
- [x] **Testing Infrastructure:** Playwright E2E tests covering critical user flows
- [x] **Docker Environment:** Complete local development stack with PostgreSQL and Redis
- [x] **Monorepo Architecture:** Turborepo with shared packages and optimized builds

### 🚧 In Progress

- [ ] **Kasplex Integration:** Live $GEEK token distribution on Kaspa mainnet
- [ ] **Enhanced Anti-Cheat:** Advanced timing analysis and behavioral pattern detection
- [ ] **Mobile Optimization:** Responsive design improvements for mobile gameplay
- [ ] **Performance Analytics:** Detailed user performance insights and recommendations

### 📋 Roadmap

**Q1 2026:**
- [ ] Mainnet launch with actual $GEEK payouts
- [ ] Achievement system with NFT badges
- [ ] Daily challenges and special events
- [ ] Social features (friend challenges, team competitions)

**Q2 2026:**
- [ ] Community question submission with moderation
- [ ] Tournament system with prize pools
- [ ] Mobile native applications (iOS/Android)
- [ ] Advanced analytics dashboard

**Q3 2026:**
- [ ] Multi-language support (Spanish, Mandarin, Japanese)
- [ ] Custom quiz creation tools
- [ ] Sponsorship and branded quiz experiences
- [ ] API for third-party integrations

**Future Considerations:**
- [ ] Cross-chain compatibility (Bitcoin, Ethereum)
- [ ] AI-powered question generation
- [ ] Live multiplayer quiz battles
- [ ] Educational institution partnerships

## Contributing

We welcome contributions from developers, designers, content creators, and community members! Geek Protocol is built on the principles of open collaboration and community-driven innovation.

### How to Contribute

#### Code Contributions

1. **Fork the Repository**
   ```bash
   gh repo fork GEEKProtocol0110/geek-protocol-alpha
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-amazing-feature
   ```

3. **Make Your Changes**
   - Follow existing code style and conventions
   - Add tests for new functionality
   - Update documentation as needed
   - Ensure all tests pass: `npm run test`

4. **Commit with Conventional Commits**
   ```bash
   git commit -m "feat: add new quiz category selection"
   git commit -m "fix: resolve wallet connection timeout issue"
   git commit -m "docs: update API endpoint documentation"
   ```

5. **Push and Create Pull Request**
   ```bash
   git push origin feature/your-amazing-feature
   gh pr create --fill
   ```

#### Contribution Guidelines

**Code Standards:**
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Include tests for bug fixes and new features
- Document public APIs and complex logic

**Pull Request Process:**
1. Ensure PR description clearly explains the change
2. Link related issues (e.g., "Fixes #123")
3. Request review from maintainers
4. Address feedback and update accordingly
5. Maintain a clean commit history

**Areas for Contribution:**
- 🐛 **Bug Fixes:** Resolve issues from GitHub Issues
- ✨ **New Features:** Implement roadmap items or propose new ideas
- 📚 **Documentation:** Improve guides, API docs, or code comments
- 🎨 **UI/UX:** Enhance design and user experience
- 🧪 **Testing:** Add test coverage for existing features
- 🌐 **Localization:** Translate interface to new languages
- 📝 **Content:** Create quiz questions and categories

### Community Guidelines

- **Be Respectful:** Treat all community members with respect and kindness
- **Be Constructive:** Provide helpful feedback and suggestions
- **Be Patient:** Maintainers and contributors are often volunteers
- **Be Open:** Share knowledge and learn from others

### Getting Help

- 💬 **Telegram:** Join [GEEKonKAS Community](https://t.me/GEEKonKAScommunity) for discussions
- 🐦 **X/Twitter:** Follow [@geekonkas](https://x.com/geekonkas) for updates
- 🐛 **Issues:** Report bugs or request features on [GitHub Issues](https://github.com/GEEKProtocol0110/geek-protocol-alpha/issues)
- 📧 **Email:** Contact the core team at contact@geekprotocol.xyz

### Recognition

Contributors will be recognized in:
- GitHub Contributors list
- Monthly contributor highlights on social media
- Special contributor role in community channels
- Future token airdrops for significant contributions (when applicable)

## Security

### Reporting Security Vulnerabilities

The security of Geek Protocol and our users is our top priority. We appreciate responsible disclosure of security vulnerabilities.

**Please do NOT:**
- Create public GitHub issues for security vulnerabilities
- Disclose vulnerabilities publicly before they are addressed

**Instead:**
1. Email security concerns to: security@geekprotocol.xyz
2. Provide detailed information about the vulnerability
3. Include steps to reproduce if possible
4. Allow reasonable time for us to address the issue

**We commit to:**
- Acknowledge receipt within 48 hours
- Provide regular updates on remediation progress
- Credit researchers (if desired) once the issue is resolved
- Consider bug bounties for critical vulnerabilities (when program launches)

### Security Measures

**Authentication & Authorization:**
- KasWare signature-based authentication with nonce challenges
- JWT tokens with secure httpOnly cookies
- Session expiration and automatic refresh
- CSRF protection on state-changing operations

**Data Protection:**
- HMAC verification for quiz attempt integrity
- Server-side answer validation to prevent client manipulation
- Encrypted sensitive data in database
- Rate limiting on all public endpoints

**Infrastructure Security:**
- CORS configured for specific origins
- Helmet middleware for security headers
- Input validation with Zod schemas
- SQL injection prevention via Prisma ORM
- Redis idempotency locks for financial operations

### Best Practices for Developers

When contributing or deploying:
- Never commit secrets or API keys
- Use environment variables for configuration
- Rotate credentials regularly
- Enable 2FA on all accounts
- Keep dependencies updated
- Review security advisories: `npm audit`

## License

Copyright (c) 2026 Geek Protocol

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Acknowledgments

Built with ❤️ by the Geek Protocol team and our amazing community of contributors.

**Special Thanks:**
- Kaspa development community for blockchain infrastructure
- Open source maintainers of our core dependencies
- Early alpha testers and community members
- Everyone who believes knowledge deserves to be rewarded

---

<p align="center">
  <strong>Transform Your Knowledge into Digital Assets</strong><br/>
  <a href="https://geekprotocol.xyz">Visit Geek Protocol</a>
</p>

<p align="center">
  <sub>All hope, no hype. 🚀</sub>
</p>
