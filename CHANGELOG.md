# Changelog

All notable changes to Geek Protocol will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Beta launch with expanded question categories
- Full mainnet reward distribution
- Community-driven question submissions
- Advanced leaderboard analytics
- Mobile-optimized experience

---

## [0.1.0-alpha] - 2026-01-13

### Added

#### Core Features
- **Quiz2Earn Engine**: Complete trivia gameplay loop with 10-question rounds
- **KasWare Wallet Integration**: Seamless wallet connect/disconnect for Kaspa ecosystem
- **Reward Pipeline**: Full backend infrastructure for processing and distributing rewards (testnet-ready)
- **Leaderboard System**: Real-time rankings based on XP, score, and accuracy
- **User Profiles**: Personalized dashboard with stats, achievements, and lore
- **Authentication System**: JWT-based session management with wallet signature verification

#### Frontend (Next.js App Router)
- Landing page with animated hero section and feature showcase
- Quiz gameplay interface with real-time timer and answer selection
- Result screen with performance breakdown and reward eligibility
- Responsive design with cyberpunk/neon aesthetic
- Practice mode for unauthenticated users

#### Backend API (Fastify)
- RESTful endpoints for quiz start, submit, leaderboard, and rewards
- PostgreSQL database with Prisma ORM
- Redis queue integration for background reward processing
- HMAC-based attempt token validation
- Rate limiting and security middleware
- Admin endpoints for question management and system monitoring

#### Infrastructure
- Monorepo structure with Turborepo orchestration
- Docker Compose setup for local development
- CI/CD pipeline with GitHub Actions
- TypeScript throughout with strict type checking
- Shared validation schemas via Zod
- Comprehensive environment configuration examples

#### Documentation
- Complete README with setup instructions and architecture overview
- Security policy with responsible disclosure process
- Contributing guidelines for open-source collaboration
- Code of Conduct
- Deployment guides and checklists
- Domain setup instructions
- Funding readiness documentation

### Configuration
- Example environment files for all services
- ESLint and TypeScript configurations
- Prettier formatting rules
- Playwright e2e test setup

### Notes
- **Status**: Alpha - testnet only
- **Reward Distribution**: Disabled on mainnet pending security audit
- **Question Bank**: Limited MVP categories (General Geek)
- **Known Limitations**: Desktop-optimized UI, basic analytics

---

## Legend

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Features being phased out
- **Removed**: Deleted features
- **Fixed**: Bug fixes
- **Security**: Vulnerability patches

[unreleased]: https://github.com/GEEKProtocol0110/geek-protocol-alpha/compare/v0.1.0-alpha...HEAD
[0.1.0-alpha]: https://github.com/GEEKProtocol0110/geek-protocol-alpha/releases/tag/v0.1.0-alpha
