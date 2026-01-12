# Domain Setup: www.geekprotocol.xyz

## Overview
This document outlines how to configure www.geekprotocol.xyz to point to your Geek Protocol landing page on Vercel.

## Current Status
✅ Landing page is fully configured and enhanced with:
- Comprehensive story sections
- Impact section explaining how Geek Protocol changes lives
- 8 categories of knowledge
- Roadmap with phases
- Kaspa honor section
- Resources and links
- Call-to-action sections
- Live community links (X, Telegram)

## Landing Page Content

### What Visitors See
When someone visits www.geekprotocol.xyz, they land on a complete narrative experience:

1. **Hero Section** - Bold introduction to Geek Protocol
2. **Story Section** - The Problem, The Solution, Coming Q1 2026
3. **Impact Section** - How Geek Protocol changes lives:
   - Your Knowledge Has Value
   - Compete Without Gatekeeping
   - Instant Rewards, Real Settlement
   - Build Your On-Chain Reputation

4. **8 Categories Section** - Quiz categories:
   - 🎮 Video Games
   - 💻 Technology
   - 🚀 Science Fiction
   - 🎬 Movies
   - 📺 Anime
   - 📚 Comics
   - 🏛️ History
   - 🌟 Pop Culture

5. **Core Systems** - 6 key features:
   - The Gauntlet (10 rapid-fire questions)
   - $GEEK Rewards (KRC-20 token)
   - Live Leaderboards
   - Kasware Auth
   - Sub-6 Second Settlements
   - Built on Kaspa

6. **Roadmap Section** - Three phases:
   - Phase 0: Alpha (Now Live)
   - Phase 1: Signal (Q1 2026)
   - Phase 2: Economy (H2 2026)

7. **Resources & Links** - All important resources:
   - 📖 Litepaper (Coming Soon)
   - 🔗 Kaspa Official (Live)
   - 💻 GitHub Repository (Live)
   - 🎮 Play the Game (Coming Soon)
   - 👥 Community (Live - Telegram)
   - 🐦 Follow Updates (Live - X/Twitter)

8. **Call-to-Action** - Join links:
   - Follow on X
   - Join Community on Telegram

## Domain Configuration Steps

### Step 1: DNS Setup
You need to update your domain registrar's DNS settings to point to Vercel:

**For www.geekprotocol.xyz:**
- Add CNAME record: `www.geekprotocol.xyz` → `cname.vercel.sh`

**For geekprotocol.xyz (root):**
- Add A records pointing to Vercel's IP addresses:
  - `76.76.19.132`
  - `76.76.19.133`
  - `76.76.19.134`
  - `76.76.19.135`

### Step 2: Vercel Project Setup
1. Go to your Vercel project dashboard
2. Navigate to Settings → Domains
3. Add both domains:
   - www.geekprotocol.xyz
   - geekprotocol.xyz
4. Vercel will verify the domain once DNS is configured

### Step 3: Verify Configuration
After DNS changes propagate (can take 24-48 hours):
1. Visit www.geekprotocol.xyz
2. You should see the full landing page
3. All links should work properly

## Deployment

### Current Build Configuration
- **Build Command**: `cd apps/web && npm run build`
- **Output Directory**: `apps/web/.next`
- **Framework**: Next.js
- **Dev Command**: `npm run dev:web`
- **Region**: iad1 (US East)

### Deploy to Vercel
```bash
# Push to main branch
git push origin main

# Vercel automatically deploys on push to main
# No manual deployment needed
```

### Local Testing
```bash
# Run dev server
npm run dev

# Open http://localhost:3000 in browser
# You should see the complete landing page
```

## Features by Status

### Live Features (Accessible Now)
- ✅ Complete landing page at root `/`
- ✅ X/Twitter link: https://x.com/geekonkas
- ✅ Telegram community: https://t.me/GEEKonKAScommunity
- ✅ GitHub repository: https://github.com/GEEKProtocol0110/geek-protocol-alpha
- ✅ Kaspa official link: https://kaspa.org

### Coming Soon (Q1 2026)
- 🎮 `/play` - Enter the Geek Gauntlet
- 📊 `/dashboard` - Track progress and rewards
- 🏆 `/leaderboard` - Global rankings
- 👤 `/profile` - Personal performance page
- 📋 `/litepaper` - Technical documentation

## Key Resources Links

| Resource | URL | Status |
|----------|-----|--------|
| Play Game | /play | Coming Soon |
| Dashboard | /dashboard | Coming Soon |
| Leaderboard | /leaderboard | Coming Soon |
| Profile | /profile | Coming Soon |
| Litepaper | /litepaper | Coming Soon |
| X/Twitter | https://x.com/geekonkas | Live |
| Telegram | https://t.me/GEEKonKAScommunity | Live |
| GitHub | https://github.com/GEEKProtocol0110/geek-protocol-alpha | Live |
| Kaspa | https://kaspa.org | Live |

## Next Steps

1. **Configure DNS** at your domain registrar
2. **Wait for DNS propagation** (24-48 hours)
3. **Verify domains** in Vercel dashboard
4. **Test landing page** at www.geekprotocol.xyz
5. **Monitor deployment** for any issues

## Support

For issues with:
- **Domain mapping**: Check Vercel dashboard → Domains
- **Deployment errors**: Check Vercel dashboard → Deployments
- **Content updates**: Edit `/apps/web/src/components/LandingPage.tsx`
- **Configuration**: Check `next.config.ts` and `vercel.json`
