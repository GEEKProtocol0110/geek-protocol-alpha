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
      {/* PCB-style background with scanlines */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[#0a0e0a]" />
        {/* Circuit traces - decorative lines */}
        <div className="absolute top-20 left-10 h-[2px] w-32 bg-[#2a1a3a]" />
        <div className="absolute top-40 left-24 h-[2px] w-48 bg-[#2a1a3a]" />
        <div className="absolute bottom-40 right-10 h-[2px] w-56 bg-[#2a1a3a]" />
        <div className="absolute bottom-20 right-24 h-[2px] w-40 bg-[#2a1a3a]" />
        {/* Decorative nodes */}
        <div className="absolute top-32 left-8 size-3 rounded-full border border-[#c0c0a0] bg-[#2a1a3a]" />
        <div className="absolute bottom-32 right-8 size-3 rounded-full border border-[#c0c0a0] bg-[#2a1a3a]" />
        <div className="absolute top-1/2 left-1/2 size-4 rounded-full border border-[#c0c0a0] bg-[#2a1a3a]" />
        <div className="glow-ring -left-20 top-10" />
        <div className="glow-ring -right-10 bottom-0" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-6xl gap-16 lg:grid-cols-2">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-3 border border-[#b87333] px-3 py-1.5 text-xs tracking-widest text-[#b87333] font-mono">
            <span className="size-2 animate-pulse rounded-full bg-[#cc44ff]" />
            LIVE ON KASPA · KRC-20 NATIVE
          </div>

          <div className="space-y-6">
            <h1 className="font-['Syncopate',sans-serif] text-4xl font-bold leading-tight text-[#f0e8ff] sm:text-5xl lg:text-6xl">
              <span className="block">PROOF-OF-</span>
              <span className="block text-[#cc44ff]">LEARNING</span>
              <span className="block text-2xl text-[#ff2d78] sm:text-3xl">ON KASPA</span>
            </h1>
            <p className="text-lg text-white leading-relaxed">
              The first decentralized <strong className="text-[#00e5ff]">Quiz2Earn ecosystem</strong> where knowledge is proven through performance, not claims. Earn <strong className="text-[#ff2d78]">$GEEK tokens</strong> by demonstrating your expertise.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="border border-[#2a1a3a] px-3 py-1 font-mono text-xs tracking-wider text-[#7a5a9a]">
              ALL HOPE. NO HYPE.
            </span>
            <span className="border border-[#2a1a3a] px-3 py-1 font-mono text-xs tracking-wider text-[#7a5a9a]">
              KRC-20
            </span>
            <span className="border border-[#2a1a3a] px-3 py-1 font-mono text-xs tracking-wider text-[#7a5a9a]">
              QUIZ2EARN
            </span>
            <span className="border border-[#2a1a3a] px-3 py-1 font-mono text-xs tracking-wider text-[#7a5a9a]">
              PROOF-OF-LEARNING
            </span>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/play"
              className="relative overflow-hidden bg-[var(--gp-pink)] px-8 py-4 font-['Syncopate',sans-serif] text-sm font-bold uppercase tracking-wider text-white transition hover:shadow-[4px_4px_0px_0px_var(--gp-pink-dark)]"
            >
              <span className="relative z-10">Play Gauntlet</span>
            </Link>
            <Link
              href="/dashboard"
              className="border border-[#00e5ff] px-8 py-4 font-['Syncopate',sans-serif] text-sm font-bold uppercase tracking-wider text-[#00e5ff] transition hover:bg-[#00e5ff]/10"
            >
              Dashboard
            </Link>
          </div>

          <dl className="grid grid-cols-2 gap-px rounded-sm border border-[#2a1a3a] bg-[#2a1a3a] sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="bg-[#0d120d] p-4 text-center">
                <dt className="font-mono text-[0.62rem] uppercase tracking-wider text-[#7a5a9a]">{stat.label}</dt>
                <dd className="font-mono text-2xl font-semibold text-[#f0e8ff]">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="relative border border-[#2a1a3a] bg-[#0d120d] p-6">
            {/* Corner decorations */}
            <div className="absolute -left-px -top-px size-5 border-l-2 border-t-2 border-[#b87333]" />
            <div className="absolute -right-px -top-px size-5 border-r-2 border-t-2 border-[#b87333]" />
            <div className="absolute -bottom-px -left-px size-5 border-b-2 border-l-2 border-[#b87333]" />
            <div className="absolute -bottom-px -right-px size-5 border-b-2 border-r-2 border-[#b87333]" />

            {/* Floating chips */}
            <div className="absolute -top-3 right-6 border border-[#ff2d78] bg-[#ff2d78] px-3 py-1 font-mono text-xs font-bold tracking-wider text-white animate-float">
              LIVE ON KASPA
            </div>
            <div className="absolute -bottom-3 left-6 border border-[#00e5ff] bg-[#00e5ff] px-3 py-1 font-mono text-xs font-bold tracking-wider text-[#0a0e0a] animate-float" style={{ animationDelay: "0.5s" }}>
              KRC-20
            </div>

            <div className="flex items-center justify-between border-b border-[#2a1a3a] pb-4">
              <div className="font-mono text-xs tracking-widest text-[#7a5a9a]">// SYS_PANEL_001 · GEEK_PROTOCOL</div>
              <div className="flex items-center gap-2 font-mono text-xs text-[#cc44ff]">
                <span className="size-1.5 animate-pulse rounded-full bg-[#cc44ff]" />
                ONLINE
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px bg-[#2a1a3a]">
              <div className="bg-[#0a0e0a] p-4 text-center">
                <span className="block font-mono text-2xl text-[#ff2d78]">144B</span>
                <span className="font-mono text-[0.62rem] uppercase tracking-wider text-[#7a5a9a]">Total Supply</span>
              </div>
              <div className="bg-[#0a0e0a] p-4 text-center">
                <span className="block font-mono text-2xl text-[#00e5ff]">30%</span>
                <span className="font-mono text-[0.62rem] uppercase tracking-wider text-[#7a5a9a]">Quiz Rewards</span>
              </div>
              <div className="bg-[#0a0e0a] p-4 text-center">
                <span className="block font-mono text-2xl text-[#cc44ff]">10</span>
                <span className="font-mono text-[0.62rem] uppercase tracking-wider text-[#7a5a9a]">Gauntlet Rounds</span>
              </div>
              <div className="bg-[#0a0e0a] p-4 text-center">
                <span className="block font-mono text-2xl text-[#ffaa00]">1KAS</span>
                <span className="font-mono text-[0.62rem] uppercase tracking-wider text-[#7a5a9a]">= 100K GEEK</span>
              </div>
            </div>

            <div className="mt-px space-y-px bg-[#2a1a3a]">
              <div className="flex items-center justify-between bg-[#0a0e0a] px-4 py-3">
                <span className="font-['Rajdhani',sans-serif] font-semibold text-[#d8c8ff]">Round 10 Max Earnings</span>
                <span className="font-mono text-[#ff2d78]">10,000 GEEK</span>
              </div>
              <div className="flex items-center justify-between bg-[#0a0e0a] px-4 py-3">
                <span className="font-['Rajdhani',sans-serif] font-semibold text-[#d8c8ff]">Creator Earnings</span>
                <span className="font-mono text-[#00e5ff]">0.5 GEEK / Q</span>
              </div>
              <div className="flex items-center justify-between bg-[#0a0e0a] px-4 py-3">
                <span className="font-['Rajdhani',sans-serif] font-semibold text-[#d8c8ff]">Lifetime Cap / Question</span>
                <span className="font-mono text-[#cc44ff]">1,000 GEEK</span>
              </div>
            </div>

            <div className="mt-px border-t border-[#2a1a3a] bg-[#0a0e0a] p-4">
              <div className="mb-3 font-mono text-[0.62rem] tracking-widest text-[#7a5a9a]">// YOUR_PROGRESS</div>
              <div className="grid grid-cols-4 gap-px bg-[#2a1a3a]">
                <div className="bg-[#0d120d] py-2 text-center">
                  <span className="block font-mono text-lg text-[#ff2d78]">1</span>
                  <span className="font-mono text-[0.55rem] uppercase tracking-wider text-[#7a5a9a]">Level</span>
                </div>
                <div className="bg-[#0d120d] py-2 text-center">
                  <span className="block font-mono text-lg text-[#00e5ff]">0</span>
                  <span className="font-mono text-[0.55rem] uppercase tracking-wider text-[#7a5a9a]">XP</span>
                </div>
                <div className="bg-[#0d120d] py-2 text-center">
                  <span className="block font-mono text-lg text-[#ffaa00]">0</span>
                  <span className="font-mono text-[0.55rem] uppercase tracking-wider text-[#7a5a9a]">Streak</span>
                </div>
                <div className="bg-[#0d120d] py-2 text-center">
                  <span className="block font-mono text-lg text-[#cc44ff]">0.00</span>
                  <span className="font-mono text-[0.55rem] uppercase tracking-wider text-[#7a5a9a]">GEEK</span>
                </div>
              </div>
            </div>
          </div>

          {/* Signal cards */}
          <div className="mt-4 space-y-2">
            {SIGNALS.map((signal) => (
              <div key={signal.title} className="border border-[#2a1a3a] bg-[#0d120d] p-4 transition hover:bg-[#111811]">
                <div className="flex items-center justify-between">
                  <div className="font-['Rajdhani',sans-serif] font-semibold text-[#d8c8ff]">{signal.title}</div>
                  <span className="font-mono text-xs text-[#7a5a9a]">{signal.meta}</span>
                </div>
                <p className="mt-1 text-sm text-[#7a5a9a]">{signal.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}