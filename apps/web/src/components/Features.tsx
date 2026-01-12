const CORE_FEATURES = [
  {
    title: "Quiz2Earn Engine",
    subtitle: "Server-trusted gameplay",
    bullets: ["10-question sprint mode", "15s timers with drift protection", "Server-side scoring"],
    metric: "$GEEK rewards unlocked",
  },
  {
    title: "A.C.E. Intelligence",
    subtitle: "Anti-cheat orchestration",
    bullets: ["Attempt HMAC tokens", "Kasware identity", "Real-time anomaly detection"],
    metric: "Integrity first",
  },
  {
    title: "Kaspa Infrastructure",
    subtitle: "Instant settlement rails",
    bullets: ["Redis reward queue", "Worker heartbeat", "Wallet-level payouts"],
    metric: "< 7s confirmations",
  },
];

const VALUE_STACK = [
  {
    title: "$GEEK Token",
    description: "Native utility for staking, governance, and treasury access.",
    points: ["Earn inside Geek Gauntlet", "Unlock premium playlists", "Govern reward multipliers", "Backed by KRC-20"],
  },
  {
    title: "Operator Console",
    description: "Instrumentation for category curators and admins.",
    points: ["Live attempts feed", "Reward overrides", "Question import", "Worker insights"],
  },
];

const MILESTONES = [
  { title: "Phase 0 • Alpha", detail: "MVP live: quiz runs, rewards queue, Kasware auth." },
  { title: "Phase 1 • Signal", detail: "Advanced telemetry, XP streaks, sub-second health checks." },
  { title: "Phase 2 • Economy", detail: "Treasury-backed prize pools, staking, on-chain verification." },
];

export function Features() {
  return (
    <section id="features" className="relative py-24">
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
        <div className="glow-ring left-1/3 top-1/2" />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="mb-16 flex flex-col gap-6 text-center">
          <span className="badge-pill mx-auto text-[var(--brand-primary)]">Protocol Stack</span>
          <h2 className="text-4xl font-semibold text-white md:text-5xl">Designed for measurable, bankable knowledge.</h2>
          <p className="text-lg text-[var(--text-2)]">
            Every subsystem has a single responsibility: validate brilliance, settle rewards, and keep signal audible. No dark arts, no hidden knobs.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {CORE_FEATURES.map((feature) => (
            <article key={feature.title} className="layer-card h-full p-6 transition hover:-translate-y-1">
              <div className="text-xs uppercase tracking-wide text-white/50">{feature.subtitle}</div>
              <h3 className="mt-2 text-2xl font-semibold text-white">{feature.title}</h3>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                {feature.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)]" />
                    {bullet}
                  </li>
                ))}
              </ul>
              <div className="mt-6 text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary)]">{feature.metric}</div>
            </article>
          ))}
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="layer-card p-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-white">Value Stack</h3>
              <span className="text-xs uppercase tracking-wide text-white/50">Updated Weekly</span>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {VALUE_STACK.map((value) => (
                <div key={value.title} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <h4 className="text-lg font-semibold text-white">{value.title}</h4>
                  <p className="mt-2 text-sm text-white/70">{value.description}</p>
                  <ul className="mt-4 space-y-2 text-sm text-white/65">
                    {value.points.map((point) => (
                      <li key={point} className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-white/50" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="layer-card p-8">
            <div className="text-xs uppercase tracking-wide text-white/50">Roadmap</div>
            <h3 className="mt-2 text-2xl font-semibold text-white">From alpha to treasury-grade.</h3>
            <div className="mt-8 space-y-5">
              {MILESTONES.map((milestone, idx) => (
                <div key={milestone.title} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <span className="text-xs font-semibold text-white/40">{String(idx + 1).padStart(2, "0")}</span>
                    <span className="font-semibold text-white">{milestone.title}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/65">{milestone.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
