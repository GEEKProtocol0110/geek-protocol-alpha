
export function ComingSoonHero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-black via-black to-[#0a0e27] px-6 flex items-center justify-center py-20">
      {/* Animated background elements */}
      <div className="pointer-events-none absolute inset-0">
        {/* Kaspa blue glow */}
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-cyan-500/20 blur-[100px]" />
        {/* Kaspa green glow */}
        <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-emerald-500/15 blur-[100px]" />
        {/* Purple accent */}
        <div className="absolute top-1/2 left-1/3 h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-[80px]" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center space-y-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/5 px-4 py-2">
          <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-sm font-medium text-cyan-300">Geek Protocol • Alpha Coming Soon</span>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Animated icon */}
          <div className="text-6xl md:text-8xl animate-bounce">🎮</div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            The Geek Gauntlet
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400">
              is Loading
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Your knowledge has value. Soon, you&apos;ll prove it on the fastest blockchain.
            <br />
            <span className="text-white/50">We&rsquo;re building something real. All hope, no hype.</span>
          </p>
        </div>

        {/* Countdown or Status */}
        <div className="pt-8 pb-8 border-y border-white/10 space-y-6">
          <div className="text-center">
            <p className="text-sm text-white/60 uppercase tracking-widest mb-4">What&rsquo;s Coming</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border border-white/10 bg-white/2">
                <div className="text-2xl font-bold text-cyan-400">8</div>
                <div className="text-xs text-white/60">Knowledge Domains</div>
              </div>
              <div className="p-4 rounded-lg border border-white/10 bg-white/2">
                <div className="text-2xl font-bold text-emerald-400">10</div>
                <div className="text-xs text-white/60">Questions per Run</div>
              </div>
              <div className="p-4 rounded-lg border border-white/10 bg-white/2">
                <div className="text-2xl font-bold text-cyan-400">15s</div>
                <div className="text-xs text-white/60">Per Question</div>
              </div>
              <div className="p-4 rounded-lg border border-white/10 bg-white/2">
                <div className="text-2xl font-bold text-emerald-400">&lt;6s</div>
                <div className="text-xs text-white/60">Reward Payouts</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-4 pt-4">
          <p className="text-sm text-white/60 uppercase tracking-widest">Ready to learn more?</p>
            <div className="text-sm text-white/60">
              📖 Check back soon for the full story
            </div>

            <div className="text-xs text-white/50">
              Coming very soon.
            </div>
        </div>

        {/* Footer Message */}
        <div className="pt-12 space-y-3 text-center">
          <p className="text-sm text-white/70 font-medium">
            🚀 Alpha Launch Coming Soon
          </p>
          <p className="text-xs text-white/50">
            Built on Kaspa. Powered by signal. Zero hype.
          </p>
        </div>
      </div>
    </section>
  );
}
