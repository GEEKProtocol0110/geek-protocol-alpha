# Geek Protocol Alpha Starter — Windows Setup

This repo is a working shell for the **Testnet MVP**: one 10-question quiz run, server-scored, with a stubbed reward call.

## 1) Install prerequisites

- **Node.js LTS** (recommended)
- **Git**
- **VS Code**

## 2) Fix the Windows PowerShell `npx.ps1` error (execution policy)

If you see:

> `npx : ... cannot be loaded because running scripts is disabled on this system`

Run PowerShell **as your user** (not necessarily admin) and do:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Then close and reopen PowerShell.

Alternative: use **Command Prompt** (cmd.exe) instead of PowerShell and run `npx` there.

## 3) Run the app

```powershell
cd path\to\geek-protocol-alpha
copy .env.example .env.local
npm install
npm run dev
```

Open: http://localhost:3000

## 4) Where to wire Kaspa wallet + rewards

- Wallet connect UI: start in `src/app/page.tsx` (add Connect button & address state)
- Quiz flow UI: `src/app/play/PlayClient.tsx`
- Server scoring + reward trigger: `src/app/api/quiz/submit/route.ts`

