# Geek Protocol MVP Scaffold (Local Dev)

This repo is a **starter MVP** for Geek Protocol: a 10-question quiz round + backend scoring + reward stub.

## 1) One-time setup on Windows (new PC)

### Install
- **Node.js LTS** (recommended)
- **Git**
- **VS Code**

### Fix the "npx.ps1 cannot be loaded" error (PowerShell)
If you see:
> npx : ... cannot be loaded because running scripts is disabled

Run **PowerShell as your user** and execute:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Close and reopen PowerShell.

Alternative: run commands in **Command Prompt** instead of PowerShell.

## 2) Run the app

From the project folder:

```powershell
npm install
npm run dev
```

Then open the URL printed in the terminal (usually http://localhost:3000).

## 3) Configure env vars

Create `.env.local` in the project root:

```bash
REWARD_PER_CORRECT=10
```

## 4) What to build next (in order)

1. Wallet connect (Kaspium or another Kaspa-compatible wallet)
2. On-chain Testnet reward send for KRC-20 `$GEEK`
3. Replace in-memory questions with DB (Supabase/Postgres or MongoDB)
4. Add categories + difficulty tiers + XP/achievements
