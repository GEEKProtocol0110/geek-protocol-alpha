export function LandingHero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-black via-black to-[#0a0e27] px-6 py-20">
      {/* Animated background elements */}
      <div className="pointer-events-none absolute inset-0">
        {/* Kaspa blue glow from top-right */}
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-cyan-500/20 blur-[100px]" />
        {/* Kaspa green glow from bottom-left */}
        <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-emerald-500/15 blur-[100px]" />
        {/* Purple accent */}
        <div className="absolute top-1/2 left-1/3 h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-[80px]" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Badge */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/5 px-4 py-2">
            <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-sm font-medium text-cyan-300">Built on Kaspa • All Hope, No Hype</span>
          </div>
        </div>

        {/* Main headline */}
        <div className="mb-16 text-center space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            Your Knowledge
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400">
              Has Real Value
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            Geek Protocol transforms your expertise into on-chain assets on the fastest blockchain.
            <br />
            <span className="text-white/50">Prove your knowledge. Earn real rewards. No games—just signal.</span>
          </p>
        </div>

        {/* CTA Buttons */}
          {/* Coming Soon Message */}
          <div className="text-center mb-20">
            <p className="text-lg text-white/60">
              🎮 Gauntlet coming soon • Stay tuned
            </p>
          </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-20 border-b border-white/10">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-cyan-400">8</div>
            <div className="text-sm text-white/60 mt-2">Knowledge Categories</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-emerald-400">10</div>
            <div className="text-sm text-white/60 mt-2">Questions per Run</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-cyan-400">15s</div>
            <div className="text-sm text-white/60 mt-2">Per Question</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-emerald-400">&lt;6s</div>
            <div className="text-sm text-white/60 mt-2">Reward Signal</div>
          </div>
        </div>
      </div>
    </section>
  );
}
