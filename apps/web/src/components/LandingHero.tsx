"use client";

import { useEffect, useState, useMemo } from "react";

export function LandingHero() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Memoize particle data to avoid calling Math.random during re-renders
  // Math.random calls here are intentional and only execute once due to empty dependency array
  const particles = useMemo(() => {
    const randomValues = Array.from({ length: 20 }, (_, i) => ({
      width: Math.random() * 6 + 2,
      height: Math.random() * 6 + 2,
      left: Math.random() * 100,
      background: i % 3 === 0 ? 'rgba(34, 197, 94, 0.6)' : i % 3 === 1 ? 'rgba(20, 184, 166, 0.6)' : 'rgba(139, 92, 246, 0.6)',
      animationDelay: Math.random() * 15,
      animationDuration: Math.random() * 10 + 10
    }));
    return randomValues;
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-black via-[#0a0a1a] to-[#0a0e27] px-6 py-20">
      {/* Animated background elements */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-30px) translateX(15px); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.3; filter: blur(120px); }
          50% { opacity: 0.8; filter: blur(140px); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes glow-ring {
          0% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.5); }
          50% { box-shadow: 0 0 40px rgba(34, 197, 94, 0.8), 0 0 60px rgba(20, 184, 166, 0.5); }
          100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.5); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        @keyframes particle {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) scale(0); opacity: 0; }
        }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
        .animate-glow { animation: glow-pulse 4s ease-in-out infinite; }
        .animate-slide-in { animation: slide-in 0.8s ease-out; }
        .animate-fade-in { animation: fade-in 1.2s ease-out; }
        .animate-glow-ring { animation: glow-ring 3s ease-in-out infinite; }
        .animate-shimmer {
          animation: shimmer 3s linear infinite;
          background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.3), transparent);
          background-size: 1000px 100%;
        }
        .animate-particle {
          animation: particle 15s linear infinite;
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        {/* Dynamic glows that follow mouse */}
        <div 
          className="absolute h-[800px] w-[800px] rounded-full bg-cyan-500/40 blur-[140px] animate-glow transition-all duration-1000"
          style={{
            top: `${mousePos.y}%`,
            left: `${mousePos.x}%`,
            transform: 'translate(-50%, -50%)'
          }}
        />
        
        {/* Static glows */}
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-cyan-500/30 blur-[120px] animate-glow" />
        <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-emerald-500/20 blur-[120px] animate-glow" style={{animationDelay: "1s"}} />
        <div className="absolute top-1/2 left-1/3 h-[500px] w-[500px] rounded-full bg-purple-500/15 blur-[100px] animate-glow" style={{animationDelay: "2s"}} />
        
        {/* Enhanced grid pattern with parallax */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"
          style={{
            transform: `translate(${mousePos.x * 0.02}px, ${mousePos.y * 0.02}px)`
          }}
        />

        {/* Animated floating particles */}
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-particle"
            style={{
              width: `${particle.width}px`,
              height: `${particle.height}px`,
              left: `${particle.left}%`,
              top: '100%',
              background: particle.background,
              animationDelay: `${particle.animationDelay}s`,
              animationDuration: `${particle.animationDuration}s`
            }}
          />
        ))}

        {/* Larger floating elements with enhanced animation */}
        <div className="absolute top-20 right-20 h-4 w-4 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(34,197,94,0.8)] animate-float" style={{animationDelay: "0s"}} />
        <div className="absolute bottom-32 left-32 h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(20,184,166,0.8)] animate-float" style={{animationDelay: "1s"}} />
        <div className="absolute top-1/3 right-1/4 h-3 w-3 rounded-full bg-purple-400 shadow-[0_0_15px_rgba(139,92,246,0.8)] animate-float" style={{animationDelay: "2s"}} />
        <div className="absolute top-1/2 left-1/4 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-float-slow" style={{animationDelay: "3s"}} />
        <div className="absolute bottom-1/4 right-1/3 h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(20,184,166,0.8)] animate-float-slow" style={{animationDelay: "4s"}} />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Badge with enhanced animation */}
        <div className="flex justify-center mb-12 animate-slide-in">
          <div className="group relative inline-flex items-center gap-2 rounded-full border border-cyan-500/50 bg-cyan-500/10 px-6 py-3 backdrop-blur-sm hover:border-cyan-400/80 hover:bg-cyan-400/15 transition-all duration-300 animate-glow-ring">
            <span className="size-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
            <span className="text-sm font-bold text-cyan-300 tracking-wide uppercase">Proof-of-Learning on Kaspa • All Hope, No Hype</span>
            <div className="absolute inset-0 rounded-full animate-shimmer opacity-50" />
          </div>
        </div>

        {/* Main headline with enhanced animation and 3D effect */}
        <div className="mb-16 text-center space-y-8">
          <h1 className="text-6xl md:text-9xl font-black text-white leading-[0.9] animate-slide-in" style={{animationDelay: "0.1s", textShadow: '0 0 40px rgba(34, 197, 94, 0.3)'}}>
            Your Knowledge
            <br />
            <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 animate-slide-in" style={{animationDelay: "0.2s"}}>
              Has Real Value
              <span className="absolute inset-0 blur-2xl bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 opacity-50 -z-10" />
            </span>
          </h1>
          <p className="text-xl md:text-3xl text-white/90 max-w-4xl mx-auto leading-relaxed animate-slide-in font-light" style={{animationDelay: "0.3s"}}>
            The Old Net collapsed into noise. The Kaspa Graph rose as foundation.
            <br />
            Now: the <span className="font-bold text-cyan-400">Omniscient Grid</span>—where knowledge strengthens reality.
            <br />
            <span className="text-white/70 text-lg md:text-xl">Enter as a Seeker. Prove mastery. Earn $GEEK. Become Cognoscenti.</span>
          </p>
        </div>

        {/* Enhanced CTA Section with more impact */}
        <div className="text-center mb-24 space-y-8 animate-slide-in" style={{animationDelay: "0.4s"}}>
          <div className="relative inline-block group">
            <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 via-emerald-500 to-cyan-500 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 animate-glow"></div>
            <div className="relative px-12 py-6 bg-black rounded-2xl border border-cyan-400/30">
              <p className="text-3xl md:text-4xl font-black bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent uppercase tracking-wider">
                Coming Q1 2026
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
              🎮 The Geek Gauntlet Launches Soon
            </p>
            <p className="text-base md:text-lg text-white/60 font-medium">
              100 questions. 10 rounds. 8 categories. Infinite potential.
            </p>
          </div>
        </div>

        {/* Key metrics with enhanced styling and animations */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pb-24 border-b border-cyan-500/20">
          <div className="group p-6 md:p-8 rounded-2xl border border-white/10 hover:border-cyan-500/50 bg-gradient-to-br from-white/5 to-transparent hover:from-cyan-500/10 transition-all duration-300 text-center animate-slide-in hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:scale-105" style={{animationDelay: "0.5s"}}>
            <div className="text-4xl md:text-6xl font-black text-cyan-400 group-hover:scale-110 transition-transform duration-300 mb-3">8</div>
            <div className="text-xs md:text-sm text-white/70 font-semibold">Knowledge<br/>Categories</div>
          </div>
          <div className="group p-6 md:p-8 rounded-2xl border border-white/10 hover:border-emerald-500/50 bg-gradient-to-br from-white/5 to-transparent hover:from-emerald-500/10 transition-all duration-300 text-center animate-slide-in hover:shadow-[0_0_30px_rgba(20,184,166,0.3)] hover:scale-105" style={{animationDelay: "0.6s"}}>
            <div className="text-4xl md:text-6xl font-black text-emerald-400 group-hover:scale-110 transition-transform duration-300 mb-3">100</div>
            <div className="text-xs md:text-sm text-white/70 font-semibold">Questions<br/>(10 rounds)</div>
          </div>
          <div className="group p-6 md:p-8 rounded-2xl border border-white/10 hover:border-cyan-500/50 bg-gradient-to-br from-white/5 to-transparent hover:from-cyan-500/10 transition-all duration-300 text-center animate-slide-in hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:scale-105" style={{animationDelay: "0.7s"}}>
            <div className="text-4xl md:text-6xl font-black text-cyan-400 group-hover:scale-110 transition-transform duration-300 mb-3">15s</div>
            <div className="text-xs md:text-sm text-white/70 font-semibold">Per<br/>Question</div>
          </div>
          <div className="group p-6 md:p-8 rounded-2xl border border-white/10 hover:border-emerald-500/50 bg-gradient-to-br from-white/5 to-transparent hover:from-emerald-500/10 transition-all duration-300 text-center animate-slide-in hover:shadow-[0_0_30px_rgba(20,184,166,0.3)] hover:scale-105" style={{animationDelay: "0.8s"}}>
            <div className="text-4xl md:text-6xl font-black text-emerald-400 group-hover:scale-110 transition-transform duration-300 mb-3">&lt;6s</div>
            <div className="text-xs md:text-sm text-white/70 font-semibold">Reward<br/>Settlement</div>
          </div>
        </div>

        {/* Enhanced trust indicators */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 mt-24 text-white/70 text-sm md:text-base animate-fade-in" style={{animationDelay: "0.9s"}}>
          <div className="flex items-center gap-3 group hover:text-white transition-colors">
            <span className="text-cyan-400 text-xl group-hover:scale-125 transition-transform">✓</span> 
            <span className="font-semibold">Kaspa Layer 1</span>
          </div>
          <div className="flex items-center gap-3 group hover:text-white transition-colors">
            <span className="text-emerald-400 text-xl group-hover:scale-125 transition-transform">✓</span> 
            <span className="font-semibold">Sub-Second Finality</span>
          </div>
          <div className="flex items-center gap-3 group hover:text-white transition-colors">
            <span className="text-cyan-400 text-xl group-hover:scale-125 transition-transform">✓</span> 
            <span className="font-semibold">Cryptographic Proof</span>
          </div>
        </div>
      </div>
    </section>
  );
}
