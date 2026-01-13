# Deployment Guide

Complete guide for deploying Geek Protocol to production environments.

---

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Deployment Options](#deployment-options)
- [Testnet Treasury Setup](#testnet-treasury-setup)
- [Secret Management](#secret-management)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Services
- **PostgreSQL 14+** (database)
- **Redis 7+** (job queue)
- **Node.js 20+** (runtime)
- **Domain name** with DNS access
- **Kaspa testnet wallet** (for rewards)

### Optional Services
- **Vercel** (web hosting - recommended)
- **Railway/Fly.io** (API hosting - recommended)
- **Sentry** (error tracking)
- **LogTail** (log aggregation)

---

## Environment Variables

### API Server (apps/api/.env)

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/geek_protocol"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_URL="redis://localhost:6379"  # Alternative to HOST/PORT

# Security
JWT_SECRET="your-jwt-secret-256-bit"  # Generate with: openssl rand -base64 32
SERVER_SECRET="your-hmac-secret-256-bit"  # Generate with: openssl rand -base64 32

# Kaspa Configuration
KASPA_NETWORK="testnet"  # or "mainnet"
KASPA_TREASURY_ADDRESS="kaspatest:..."  # Your treasury wallet address
KASPA_TREASURY_KEY="encrypted:..."  # Encrypted private key (see Secret Management)

# Reward Economics
ENABLE_REWARDS="true"  # Set to "false" to disable payouts
MIN_SCORE_FOR_REWARD="70"  # Minimum score percentage
REWARD_SATS_PER_CORRECT="1000"  # Reward per correct answer (in sats)
REWARD_CONFIRM_DELAY_MS="3000"  # Delay before checking confirmation
REWARD_REQUIRE_WALLET="true"  # Require wallet verification

# Rate Limiting
RATE_LIMIT_MAX="100"  # Max requests per window
RATE_LIMIT_WINDOW_MS="900000"  # 15 minutes

# Worker Configuration
WORKER_CONCURRENCY="5"  # Number of concurrent reward jobs
WORKER_HEARTBEAT_INTERVAL="15000"  # Heartbeat interval (ms)

# Demo Mode
DEMO_MODE="false"  # Set to "true" for demo/testing

# Monitoring (Optional)
SENTRY_DSN=""  # Sentry error tracking
LOG_LEVEL="info"  # debug | info | warn | error

# API Configuration
PORT="3001"
HOST="0.0.0.0"
NODE_ENV="production"
```

### Web Client (apps/web/.env.local)

```bash
# API Connection
NEXT_PUBLIC_API_URL="https://api.geekprotocol.xyz"

# Kaspa Network
NEXT_PUBLIC_KASWARE_NETWORK="testnet"  # or "mainnet"

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=""  # Google Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=""  # Plausible Analytics

# Feature Flags
NEXT_PUBLIC_ENABLE_PRACTICE_MODE="true"
NEXT_PUBLIC_ENABLE_LEADERBOARD="true"
```

---

## Deployment Options

### Option 1: Vercel (Web) + Railway (API) [Recommended]

#### Deploy Web to Vercel

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Login and Deploy**
```bash
cd apps/web
vercel login
vercel --prod
```

3. **Configure Environment Variables**
- Go to Vercel Dashboard → Project Settings → Environment Variables
- Add all variables from `apps/web/.env.local`
- Redeploy: `vercel --prod`

4. **Set Custom Domain**
- Vercel Dashboard → Domains → Add Domain
- Update DNS records as instructed
- SSL automatically configured

#### Deploy API + Worker to Railway

1. **Install Railway CLI**
```bash
npm i -g @railway/cli
```

2. **Login and Initialize**
```bash
railway login
railway init
```

3. **Create Services**
```bash
# Create PostgreSQL
railway add postgresql

# Create Redis
railway add redis

# Deploy API
railway up
```

4. **Configure Environment Variables**
```bash
railway variables set JWT_SECRET="..."
railway variables set SERVER_SECRET="..."
railway variables set KASPA_TREASURY_ADDRESS="..."
# ... add all variables
```

5. **Start Worker**
- Add worker process in `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "cd apps/api && npm run worker",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

---

### Option 2: Docker Compose (Single VPS)

1. **Create Production Compose File**

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: geek_protocol
      POSTGRES_USER: geek
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7-alpine
    restart: always

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      DATABASE_URL: postgresql://geek:${DB_PASSWORD}@postgres:5432/geek_protocol
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      SERVER_SECRET: ${SERVER_SECRET}
      KASPA_TREASURY_ADDRESS: ${KASPA_TREASURY_ADDRESS}
      KASPA_TREASURY_KEY: ${KASPA_TREASURY_KEY}
      ENABLE_REWARDS: "true"
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis
    restart: always

  worker:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    command: npm run worker
    environment:
      DATABASE_URL: postgresql://geek:${DB_PASSWORD}@postgres:5432/geek_protocol
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      SERVER_SECRET: ${SERVER_SECRET}
      KASPA_TREASURY_ADDRESS: ${KASPA_TREASURY_ADDRESS}
      KASPA_TREASURY_KEY: ${KASPA_TREASURY_KEY}
      ENABLE_REWARDS: "true"
    depends_on:
      - postgres
      - redis
    restart: always

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: https://api.yourdomain.com
      NEXT_PUBLIC_KASWARE_NETWORK: testnet
    ports:
      - "3000:3000"
    restart: always

volumes:
  postgres_data:
```

2. **Deploy**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. **Setup Nginx Reverse Proxy**
```nginx
# /etc/nginx/sites-available/geekprotocol

server {
    listen 80;
    server_name api.geekprotocol.xyz;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name www.geekprotocol.xyz geekprotocol.xyz;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. **Enable SSL with Certbot**
```bash
sudo certbot --nginx -d api.geekprotocol.xyz -d geekprotocol.xyz -d www.geekprotocol.xyz
```

---

### Option 3: Fly.io (All-in-One)

1. **Install Fly CLI**
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Create fly.toml**
```toml
app = "geek-protocol-api"
primary_region = "iad"

[build]
  dockerfile = "apps/api/Dockerfile"

[env]
  PORT = "8080"
  NODE_ENV = "production"

[[services]]
  http_checks = []
  internal_port = 8080
  processes = ["app"]
  protocol = "tcp"
  script_checks = []

  [services.concurrency]
    hard_limit = 25
    soft_limit = 20
    type = "connections"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

3. **Deploy**
```bash
fly launch
fly secrets set JWT_SECRET="..."
fly deploy
```

---

## Testnet Treasury Setup

### 1. Create Kaspa Testnet Wallet

**Option A: KasWare Browser Extension**
1. Install KasWare extension
2. Create new wallet
3. Switch to Testnet network
4. Save seed phrase securely

**Option B: Kaspa CLI**
```bash
# Install Kaspa CLI
npm install -g @kaspa/core

# Create wallet
kaspa-wallet create --testnet

# Get address
kaspa-wallet address --testnet
```

### 2. Fund Testnet Wallet

**Faucets:**
- https://faucet.kaspanet.io (if available)
- Community faucets in Telegram/Discord

**Request Amount:**
- Minimum: 100,000 KAS (testnet)
- Recommended: 500,000 KAS for extensive testing

### 3. Configure Treasury in Environment

```bash
# Get your testnet address
KASPA_TREASURY_ADDRESS="kaspatest:qr7h5x..."

# Encrypt private key (see Secret Management section)
KASPA_TREASURY_KEY="encrypted:..."
```

### 4. Test Transaction Broadcasting

```bash
# Run test script
cd apps/api
npm run test:broadcast
```

Expected output:
```
✓ Connected to Kaspa testnet
✓ Treasury balance: 500000 KAS
✓ Test transaction broadcast: txid 0x...
✓ Transaction confirmed in 3 blocks
```

---

## Secret Management

### Generating Secrets

```bash
# JWT Secret (256-bit)
openssl rand -base64 32

# Server Secret (256-bit)
openssl rand -base64 32

# Database Password (128-bit)
openssl rand -base64 16
```

### Encrypting Treasury Private Key

**Never store private keys in plain text!**

#### Option 1: Use Environment-Specific Encryption

```bash
# Install encryption tool
npm install -g @47ng/env-encrypt

# Encrypt private key
env-encrypt --key="YOUR_MASTER_KEY" --value="your-private-key"

# Store in .env as:
KASPA_TREASURY_KEY="encrypted:abc123..."
ENCRYPTION_MASTER_KEY="your-master-key"
```

#### Option 2: Use Cloud Secret Management

**Railway Secrets:**
```bash
railway variables set KASPA_TREASURY_KEY="your-private-key"
```

**Fly.io Secrets:**
```bash
fly secrets set KASPA_TREASURY_KEY="your-private-key"
```

**Vercel Environment Variables:**
- Dashboard → Settings → Environment Variables
- Mark as "Sensitive" to hide value

### Secret Rotation Schedule

| Secret | Rotation Frequency | Procedure |
|--------|-------------------|-----------|
| JWT_SECRET | Every 90 days | Generate new, update .env, restart API |
| SERVER_SECRET | Every 180 days | Generate new, invalidates old attempt tokens |
| DATABASE_URL | Every 365 days | Update password in DB + .env |
| KASPA_TREASURY_KEY | Never (unless compromised) | Create new wallet, migrate funds |

### Compromised Secret Response

If any secret is compromised:

1. **Immediately rotate the secret**
2. **Invalidate all active sessions** (JWT)
3. **Review access logs** for suspicious activity
4. **Update incident log** in `/docs/SECURITY.md`
5. **Notify users** if user data affected

---

## Monitoring & Health Checks

### Health Endpoints

```bash
# API health
curl https://api.geekprotocol.xyz/api/health
# Expected: { "status": "ok", "uptime": 12345, "timestamp": "..." }

# Worker health
curl https://api.geekprotocol.xyz/api/health/worker
# Expected: { "status": "ok", "lastHeartbeat": "2026-01-13T...", "queueDepth": 5 }
```

### Monitoring Dashboard (Recommended)

**Setup Grafana + Prometheus:**

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
```

**Key Metrics to Track:**
- API response time (p50, p95, p99)
- Reward queue depth
- Failed transaction rate
- Database connection pool usage
- Redis memory usage
- Worker heartbeat status

### Error Tracking with Sentry

1. **Create Sentry Account**
2. **Get DSN**
3. **Add to .env:**
```bash
SENTRY_DSN="https://...@sentry.io/..."
```

4. **Verify in Sentry Dashboard**

---

## Troubleshooting

### Common Issues

#### "Cannot connect to database"
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
psql $DATABASE_URL

# Check connection string format
# postgresql://user:password@host:5432/dbname
```

#### "Redis connection refused"
```bash
# Check Redis is running
docker ps | grep redis

# Test connection
redis-cli -h localhost -p 6379 ping
# Expected: PONG

# Check firewall rules
sudo ufw status
```

#### "Worker not processing rewards"
```bash
# Check worker heartbeat
curl https://api.geekprotocol.xyz/api/health/worker

# Check Redis queue depth
redis-cli llen reward_queue

# Check worker logs
docker logs geek-protocol-worker

# Restart worker
docker restart geek-protocol-worker
```

#### "Kaspa transaction broadcasting failed"
```bash
# Check treasury balance
kaspa-wallet balance --testnet --address=kaspatest:...

# Verify network connection
curl https://api.kaspa.org/info

# Check private key encryption
# Make sure ENCRYPTION_MASTER_KEY is set correctly

# Test with small amount first
# Set REWARD_SATS_PER_CORRECT=100 for testing
```

#### "JWT token invalid"
```bash
# Check JWT_SECRET matches between services
# Restart API after changing JWT_SECRET

# Verify token expiration
# Default: 24 hours, configurable via JWT_EXPIRES_IN

# Clear user session and re-authenticate
```

### Performance Optimization

#### Database Indexing
```sql
-- Add indexes for common queries
CREATE INDEX idx_attempts_user_id ON attempts(user_id);
CREATE INDEX idx_attempts_finished_at ON attempts(finished_at DESC);
CREATE INDEX idx_rewards_status ON rewards(status);
CREATE INDEX idx_rewards_user_id ON rewards(user_id);
```

#### Redis Memory Optimization
```bash
# Set maxmemory policy
redis-cli config set maxmemory 256mb
redis-cli config set maxmemory-policy allkeys-lru
```

#### API Rate Limiting
```typescript
// Already configured in apps/api/src/index.ts
// Adjust if needed:
rateLimiter: {
  max: 100,
  timeWindow: '15 minutes'
}
```

### Logs & Debugging

#### Enable Debug Logging
```bash
# .env
LOG_LEVEL="debug"
```

#### View Logs
```bash
# Docker Compose
docker-compose logs -f api
docker-compose logs -f worker

# Railway
railway logs

# Fly.io
fly logs

# Vercel
vercel logs
```

#### Log Aggregation (Optional)
```bash
# Use Logtail/Papertrail
LOGTAIL_TOKEN="..."
```

---

## Post-Deployment Checklist

- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] Seed data loaded (questions)
- [ ] Health checks responding
- [ ] Worker heartbeat active
- [ ] SSL certificates configured
- [ ] Domain DNS propagated
- [ ] Test wallet authentication
- [ ] Test quiz submission
- [ ] Test reward payout (testnet)
- [ ] Error tracking configured (Sentry)
- [ ] Monitoring dashboard setup
- [ ] Backup strategy implemented
- [ ] Secret rotation schedule documented
- [ ] Team access configured

---

## Support & Resources

- **Documentation:** https://github.com/GEEKProtocol0110/geek-protocol-docs
- **Community:** https://t.me/GEEKonKAScommunity
- **Issues:** https://github.com/GEEKProtocol0110/geek-protocol-alpha/issues
- **Email:** support@geekprotocol.xyz (if configured)

---

## Next Steps After Deployment

1. **Monitor health endpoints** for 24 hours
2. **Test all user flows** end-to-end
3. **Invite beta testers** from community
4. **Collect feedback** and iterate
5. **Plan mainnet migration** (see `/docs/MAINNET_PLAN.md`)
