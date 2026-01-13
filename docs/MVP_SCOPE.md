# MVP Scope: Alpha vs. Mainnet

## What You're Looking At

**geek-protocol-alpha** is a functional proof-of-concept that demonstrates core mechanics. It is NOT a finished product, but it IS a real, working system.

This document clarifies what exists, what's planned, and what needs funding/partnerships to complete.

---

## ✅ Alpha (What Works Today)

### Core Mechanics
- [x] Quiz engine with 10-question runs
- [x] 8 knowledge categories (Games, Tech, Sci-Fi, Movies, Anime, Comics, History, Pop Culture)
- [x] Server-side answer validation
- [x] Cryptographic attempt tokens (HMAC)
- [x] Real-time timer per question (15 seconds)
- [x] Score calculation (0-100%)

### Wallet Integration
- [x] KasWare wallet connection
- [x] Signature-based authentication
- [x] JWT session management
- [x] Address validation

### Reward System
- [x] Redis-backed job queue
- [x] Background worker processing
- [x] Multi-state tracking (PENDING → SENT → CONFIRMED)
- [x] TX hash storage and display
- [x] Configurable reward amounts

### Infrastructure
- [x] Monorepo with Turborepo
- [x] PostgreSQL database (Prisma ORM)
- [x] Redis for queues
- [x] Docker Compose setup
- [x] CI/CD pipeline (GitHub Actions)
- [x] Comprehensive documentation

### UI/UX
- [x] Landing page with lore
- [x] Leaderboard (global rankings)
- [x] Admin dashboard (attempt monitoring)
- [x] Result page with reward status
- [x] Responsive design (mobile-friendly)

---

## 🚧 Beta (In Development)

### Enhanced Security
- [ ] Device fingerprinting
- [ ] IP geolocation scoring
- [ ] Mouse/keyboard behavior analysis
- [ ] Proof-of-attention mechanisms

### Content Expansion
- [ ] 500+ question bank (currently ~50)
- [ ] Difficulty balancing across categories
- [ ] Community-submitted questions (moderated)
- [ ] Seasonal/themed quizzes

### User Features
- [ ] User profiles with stats
- [ ] Achievement/badge system
- [ ] Streak tracking and multipliers
- [ ] Practice mode (no rewards)

### Game Modes
- [ ] **Gauntlet** (current default)
- [ ] **Royale** (multiplayer, elimination-style)
- [ ] **Blitz** (speed-focused, shorter rounds)
- [ ] **Daily Challenge** (special rewards)

---

## 🔜 Mainnet (Q2 2026 Target)

### Kaspa Integration
- [ ] Mainnet deployment (currently testnet)
- [ ] Direct node integration (replace Kasplex API)
- [ ] Multi-sig treasury wallet
- [ ] Automated treasury management
- [ ] Production reward economics

### Token Launch
- [ ] $GEEK token distribution event
- [ ] Liquidity pool setup (Kaspa DEX)
- [ ] Staking mechanics
- [ ] Governance token functionality

### Mobile Apps
- [ ] iOS app (React Native)
- [ ] Android app (React Native)
- [ ] Push notifications
- [ ] Offline mode (cache questions)

### DAO Governance
- [ ] On-chain voting
- [ ] Treasury management proposals
- [ ] Reward parameter adjustments
- [ ] Question moderation by community

---

## 📝 Planned (Q3-Q4 2026)

### Geek Games Expansion
- [ ] **Tournament Mode** (bracket-style competitions)
- [ ] **Team Battles** (clan vs. clan)
- [ ] **Creator Tools** (build your own quizzes)
- [ ] **Sponsored Challenges** (brand partnerships)

### Geek Jr
- [ ] Child-safe version (off-chain rewards)
- [ ] Educational partnerships (schools, homeschoolers)
- [ ] Parent dashboard
- [ ] COPPA compliance

### NFT Integration
- [ ] Achievement NFTs (soulbound)
- [ ] Leaderboard trophies (tradable)
- [ ] Question creator attribution
- [ ] Limited edition collectibles

### Social Features
- [ ] Friend challenges
- [ ] Social feed (quiz results, streaks)
- [ ] Referral system
- [ ] Discord bot integration

---

## What Requires Funding

| Feature | Estimated Cost | Rationale |
|---------|---------------|-----------|
| **Security Audit** | $15k-$30k | Third-party audit before mainnet |
| **Mobile App Development** | $50k-$100k | React Native + app store fees |
| **Question Bank Expansion** | $10k-$20k | Content creators, fact-checking |
| **Marketing Campaign** | $25k-$50k | Influencers, ads, community growth |
| **Legal Compliance** | $10k-$20k | Token launch, COPPA, terms of service |
| **Infrastructure Scaling** | $5k-$10k/mo | CDN, load balancers, monitoring |

**Total for mainnet launch:** $115k-$230k

---

## What Can Be Built Now (No Funding)

- ✅ More quiz questions (community contributions)
- ✅ UI/UX improvements (open-source PRs)
- ✅ Additional game modes (code is modular)
- ✅ Testnet stress testing (community playtests)
- ✅ Documentation improvements (always welcome)

---

## Demo Mode vs. Production

### Demo Mode (DEMO_MODE=true)
- Uses fixed question set
- Simulates rewards (no actual TX)
- No wallet requirement
- Perfect for:
  - Investor demos
  - Streamer showcases
  - Developer testing

### Production Mode (DEMO_MODE=false)
- Real quiz questions
- Actual Kaspa transactions
- KasWare wallet required
- For:
  - Live testnet
  - Community beta
  - Mainnet launch

---

## Success Metrics

### Alpha (✅ Achieved)
- [x] Repo is public and documented
- [x] Core flow works end-to-end
- [x] Can demo to investors in <5 minutes
- [x] Community can contribute

### Beta (Target: March 2026)
- [ ] 100+ active users on testnet
- [ ] 500+ questions in database
- [ ] <1% cheat rate detected
- [ ] Mobile app in TestFlight/Beta

### Mainnet (Target: Q2 2026)
- [ ] $GEEK token launched
- [ ] 10,000+ quizzes completed
- [ ] $50k+ in rewards distributed
- [ ] 3+ game modes live

### Scale (Target: Q4 2026)
- [ ] 100,000+ registered users
- [ ] $1M+ in total rewards
- [ ] Mobile app downloads > 10k
- [ ] DAO governance active

---

## FAQs

**Q: Is this a finished product?**  
A: No. It's a functional MVP that proves the concept works.

**Q: Can I use this today?**  
A: Yes, on Kaspa testnet. Mainnet requires funding + security audit.

**Q: Why isn't mobile ready?**  
A: Web-first for speed. Mobile app comes after mainnet launch.

**Q: Who controls the treasury?**  
A: Currently centralized (core team). Transitions to DAO post-launch.

**Q: Can I contribute code?**  
A: Yes! See [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## Contact for Funding/Partnerships

- **Email:** team@geekprotocol.xyz
- **Telegram:** https://t.me/GEEKonKAScommunity
- **X/Twitter:** https://x.com/geekonkas

---

**TL;DR:** We have a working proof-of-concept. Mainnet launch needs $115k-$230k. Everything is open-source and auditable.
