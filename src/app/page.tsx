import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-dvh bg-black text-white">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10">
          <p className="text-xs uppercase tracking-widest text-white/60">Geek Protocol</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight">
            All hope. No hype.
          </h1>
          <p className="mt-4 max-w-2xl text-white/70">
            Quiz2Earn MVP scaffold: 10-question round + backend score validation + reward stub.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/play"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
            >
              Start MVP Round
            </Link>
            <button
              disabled
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/60"
              title="Wallet connect comes next"
            >
              Connect Wallet (next)
            </button>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Feature title="Quiz Flow" text="Play 1 round of 10 questions (single category)." />
            <Feature title="Backend Scoring" text="Submit answers to /api/quiz/submit and validate server-side." />
            <Feature title="Rewards" text="Reward calculation stub (wire Kaspa Testnet KRC-20 send next)." />
          </div>

          <p className="mt-10 text-xs text-white/50">
            This matches the Testnet MVP scope (wallet connect, quiz, scoring, on-chain rewards).
          </p>
        </div>
      </div>
    </main>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm text-white/70">{text}</p>
    </div>
  );
}
