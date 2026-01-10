import Image from "next/image";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black py-20 md:py-0">
      {/* Animated background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl animate-pulse" style={{animationDelay: "1s"}} />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8">
            {/* Status badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs text-cyan-300 animate-in">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              Alpha Build • Now Live
            </div>

            {/* Main heading */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
                <span className="text-white">Learn. Compete.</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  Earn. Collect.
                </span>
              </h1>
            </div>

            {/* Description */}
            <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-xl animate-in" style={{animationDelay: "0.1s"}}>
              Geek Protocol is a gamified Web3 ecosystem on Kaspa powered by <span className="font-semibold text-white">$GEEK (KRC-20)</span>. Turn knowledge into progression — and progression into an economy.
            </p>

            {/* Tagline */}
            <p className="text-base text-cyan-300/70 font-medium">
              Mantra: <span className="text-cyan-300">All hope, no hype.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-4 animate-in" style={{animationDelay: "0.2s"}}>
              <a
                href="/play"
                className="group relative px-8 py-4 font-semibold text-black bg-gradient-to-r from-cyan-400 to-blue-400 rounded-xl hover:shadow-[0_0_40px_rgba(0,209,255,0.4)] transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10">Start Playing</span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 to-blue-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </a>

              <a
                href="/litepaper"
                className="px-8 py-4 font-semibold border-2 border-cyan-400/50 text-cyan-300 rounded-xl hover:bg-cyan-400/10 transition-all duration-300"
              >
                Read Litepaper
              </a>

              <a
                href="https://t.me/GEEKonKAScommunity"
                target="_blank"
                rel="noreferrer"
                className="px-8 py-4 font-semibold border border-white/20 text-white rounded-xl hover:border-white/50 hover:bg-white/5 transition-all duration-300"
              >
                Join Community
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
              <StatItem label="Quiz2Earn" value="Live" />
              <StatItem label="Network" value="Kaspa" />
              <StatItem label="Status" value="Alpha" />
            </div>
          </div>

          {/* Right side - Preview card */}
          <div className="relative animate-in-right" style={{animationDelay: "0.3s"}}>
            <div className="relative rounded-3xl overflow-hidden glass p-8 glow-accent-lg">
              {/* Gradient border effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-400/20 to-blue-400/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Protocol Overview</h3>
                  <span className="px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-300 text-xs font-medium">Alpha</span>
                </div>

                {/* Features grid */}
                <div className="space-y-3">
                  <PreviewItem icon="🎯" label="Mode" value="Geek Gauntlet" />
                  <PreviewItem icon="📋" label="Questions" value="10 Timed Rounds" />
                  <PreviewItem icon="🏆" label="Rewards" value="$GEEK Tokens" />
                  <PreviewItem icon="🔐" label="Network" value="Kaspa Blockchain" />
                </div>

                {/* A.C.E. Status box */}
                <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-cyan-400/10 to-blue-400/10 border border-cyan-400/20">
                  <div className="text-xs text-cyan-300/70 font-medium uppercase tracking-wide">A.C.E. Intelligence</div>
                  <div className="mt-2 text-sm text-white font-medium">
                    "Knowledge verified. Progression authorized."
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full border border-cyan-400/20 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full border border-cyan-400/20 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-white/50 uppercase tracking-wide">{label}</div>
      <div className="text-lg font-bold text-cyan-300">{value}</div>
    </div>
  );
}

function PreviewItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-300">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <span className="text-sm text-white/70">{label}</span>
      </div>
      <span className="text-sm font-medium text-cyan-300">{value}</span>
    </div>
  );
}
