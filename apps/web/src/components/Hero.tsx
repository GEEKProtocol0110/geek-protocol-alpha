import Link from "next/link";

const STATS = [
  { label: "Avg reward signal", value: "< 6s" },
  { label: "Active categories", value: "8" },
  { label: "Kaspa wallets", value: "3k+" },
  { label: "Alpha uptime", value: "99.4%" },
];

const SIGNALS = [
  { title: "Geek Gauntlet", meta: "10 rounds • 15s", detail: "Server-scored with HMAC attempt tokens." },
  { title: "Kasware Auth", meta: "Schnorr-ready", detail: "Nonce challenges and JWT sessions." },
  { title: "$GEEK Rewards", meta: "Queue health", detail: "Redis worker confirms payouts and streaks." },
];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden px-6 pb-24 pt-16 md:pt-24">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="glow-ring -left-20 top-10" />
        <div className="glow-ring -right-10 bottom-0" />
        <div className="grid-overlay" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-6xl gap-16 lg:grid-cols-2">
        <div className="space-y-8">
          <span className="badge-pill text-xs text-[var(--brand-primary)]">
            <span className="size-2 rounded-full bg-[var(--brand-primary)]" />
            Kaspa-Native Quiz2Earn
          </span>

          <div className="space-y-6">
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Your knowledge is a balance sheet. Geek Protocol turns mastery into on-chain yield.
            </h1>
            <p className="text-lg text-[var(--text-2)]">
              Built on Kaspa, charged by the $GEEK KRC-20 economy, and audited by the A.C.E. intelligence layer. Enter runs, prove signal, and let the protocol settle payouts without the hype.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/play"
              className="rounded-2xl bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-secondary)] to-[var(--brand-tertiary)] px-8 py-4 text-sm font-semibold uppercase tracking-wide text-black shadow-[0_20px_40px_rgba(55,248,255,0.25)] transition hover:scale-[1.01]"
            >
              Launch Geek Gauntlet
            </Link>
            <a
              href="/litepaper"
              className="rounded-2xl border border-white/15 px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white/80 transition hover:bg-white/5"
            >
              Read the Litepaper
            </a>
            <a
              href="https://t.me/GEEKonKAScommunity"
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-white/15 px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white/80 transition hover:bg-white/5"
            >
              Community Briefing
            </a>
          </div>

          <dl className="grid grid-cols-2 gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="text-xs uppercase tracking-wide text-white/50">{stat.label}</dt>
                <dd className="text-2xl font-semibold text-white">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="layer-card relative overflow-hidden p-8">
            <div className="flex items-center justify-between text-sm text-white/70">
              <div>
                <div className="text-xs uppercase tracking-wide text-white/40">A.C.E. Console</div>
                <div className="font-semibold text-white">Run Integrity Monitor</div>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">Alpha • Live</span>
            </div>

            <div className="mt-6 space-y-4">
              {SIGNALS.map((signal) => (
                <div key={signal.title} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-semibold text-white">{signal.title}</div>
                    <span className="text-xs text-white/50">{signal.meta}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/70">{signal.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-[var(--brand-secondary)]/20 to-transparent p-5">
              <div className="text-xs uppercase tracking-wide text-white/60">Mantra</div>
              <div className="mt-2 text-xl font-semibold text-white">All hope, no hype.</div>
              <p className="mt-2 text-sm text-white/70">Proof of attention, proof of learning, proof of play.</p>
            </div>
          </div>

          <div className="absolute -bottom-12 right-4 w-64 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 shadow-[0_25px_45px_rgba(0,0,0,0.45)] animate-float">
            <div className="text-xs uppercase tracking-wide text-white/50">Health Feed</div>
            <p className="mt-2 font-semibold text-white">Worker heartbeat synced.</p>
            <p className="text-xs text-white/60">Redis queue balanced • Reward latency &lt; 7s.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
