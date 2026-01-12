"use client";

import { useEffect, useState } from "react";

export function LandingHero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-black via-[#0a0a1a] to-[#0a0e27] px-6 py-20">
      {/* Animated background elements */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-glow { animation: glow-pulse 3s ease-in-out infinite; }
        .animate-slide-in { animation: slide-in 0.8s ease-out; }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        {/* Kaspa blue glow from top-right - animated */}
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-cyan-500/30 blur-[120px] animate-glow" />
        {/* Kaspa green glow from bottom-left - animated */}
        <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-emerald-500/20 blur-[120px] animate-glow" style={{animationDelay: "1s"}} />
        {/* Purple accent - animated */}
        <div className="absolute top-1/2 left-1/3 h-[400px] w-[400px] rounded-full bg-purple-500/15 blur-[100px] animate-glow" style={{animationDelay: "2s"}} />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

        {/* Animated floating elements */}
        <div className="absolute top-20 right-20 h-3 w-3 rounded-full bg-cyan-400 animate-float" style={{animationDelay: "0s"}} />
        <div className="absolute bottom-32 left-32 h-2 w-2 rounded-full bg-emerald-400 animate-float" style={{animationDelay: "1s"}} />
        <div className="absolute top-1/3 right-1/4 h-2 w-2 rounded-full bg-purple-400 animate-float" style={{animationDelay: "2s"}} />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Badge with animation */}
        <div className="flex justify-center mb-12 animate-slide-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 hover:border-cyan-400/80 hover:bg-cyan-400/15 transition-all duration-300">
            <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-sm font-medium text-cyan-300">Built on Kaspa • All Hope, No Hype</span>
          </div>
        </div>

        {/* Main headline with staggered animation */}
        <div className="mb-16 text-center space-y-6">
          <h1 className="text-5xl md:text-8xl font-black text-white leading-tight animate-slide-in" style={{animationDelay: "0.1s"}}>
            Your Knowledge
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 animate-slide-in inline-block" style={{animationDelay: "0.2s"}}>
              Has Real Value
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed animate-slide-in font-light" style={{animationDelay: "0.3s"}}>
            Geek Protocol transforms your expertise into on-chain assets. Prove your knowledge. Earn real rewards. 
            <br />
            <span className="text-white/60 text-lg">No middleman. No delays. Just pure signal on the fastest blockchain.</span>
          </p>
        </div>

        {/* Enhanced CTA Section */}
        <div className="text-center mb-20 space-y-6 animate-slide-in" style={{animationDelay: "0.4s"}}>
          <div className="relative inline-block">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 animate-glow"></div>
            <div className="relative px-8 py-4 bg-black rounded-lg">
              <p className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Coming Q1 2026
              </p>
            </div>
          </div>
          <p className="text-lg text-white/70 font-medium">
            🎮 The Geek Gauntlet launches soon
          </p>
          <p className="text-sm text-white/50">
            Get notified when we go live
          </p>
        </div>

        {/* Key metrics with enhanced styling */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pb-20 border-b border-white/10">
          <div className="group p-4 rounded-xl border border-white/5 hover:border-cyan-500/30 bg-white/2 hover:bg-cyan-500/5 transition-all duration-300 text-center animate-slide-in" style={{animationDelay: "0.5s"}}>
            <div className="text-3xl md:text-5xl font-bold text-cyan-400 group-hover:scale-110 transition-transform duration-300">8</div>
            <div className="text-xs md:text-sm text-white/60 mt-2">Knowledge<br/>Categories</div>
          </div>
          <div className="group p-4 rounded-xl border border-white/5 hover:border-emerald-500/30 bg-white/2 hover:bg-emerald-500/5 transition-all duration-300 text-center animate-slide-in" style={{animationDelay: "0.6s"}}>
            <div className="text-3xl md:text-5xl font-bold text-emerald-400 group-hover:scale-110 transition-transform duration-300">100</div>
            <div className="text-xs md:text-sm text-white/60 mt-2">Questions<br/>(10 rounds)</div>
          </div>
          <div className="group p-4 rounded-xl border border-white/5 hover:border-cyan-500/30 bg-white/2 hover:bg-cyan-500/5 transition-all duration-300 text-center animate-slide-in" style={{animationDelay: "0.7s"}}>
            <div className="text-3xl md:text-5xl font-bold text-cyan-400 group-hover:scale-110 transition-transform duration-300">15s</div>
            <div className="text-xs md:text-sm text-white/60 mt-2">Per<br/>Question</div>
          </div>
          <div className="group p-4 rounded-xl border border-white/5 hover:border-emerald-500/30 bg-white/2 hover:bg-emerald-500/5 transition-all duration-300 text-center animate-slide-in" style={{animationDelay: "0.8s"}}>
            <div className="text-3xl md:text-5xl font-bold text-emerald-400 group-hover:scale-110 transition-transform duration-300">&lt;6s</div>
            <div className="text-xs md:text-sm text-white/60 mt-2">Reward<br/>Settlement</div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="flex justify-center gap-8 mt-20 text-white/60 text-sm animate-slide-in" style={{animationDelay: "0.9s"}}>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400">✓</span> Kaspa Layer 1
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">✓</span> Sub-Second Finality
          </div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400">✓</span> Cryptographic Proof
          </div>
        </div>
      </div>
    </section>
  );
}
