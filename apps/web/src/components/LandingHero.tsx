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
      background: i % 3 === 0 ? 'var(--gp-cyan)' : i % 3 === 1 ? 'var(--gp-violet)' : 'var(--gp-pink)',
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
    <section className="relative min-h-screen w-full overflow-hidden px-6 py-20">
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
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes particle {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) scale(0); opacity: 0; }
        }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
        .animate-slide-in { animation: slide-in 0.8s ease-out; }
        .animate-fade-in { animation: fade-in 1.2s ease-out; }
        .animate-particle {
          animation: particle 15s linear infinite;
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        {/* Flat dot-grid texture with subtle parallax */}
        <div
          className="gp-dot-grid"
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

        {/* Larger floating elements — flat solid dots, no glow */}
        <div className="absolute top-20 right-20 h-4 w-4 rounded-full bg-[var(--gp-cyan)] animate-float" style={{animationDelay: "0s"}} />
        <div className="absolute bottom-32 left-32 h-3 w-3 rounded-full bg-[var(--gp-pink)] animate-float" style={{animationDelay: "1s"}} />
        <div className="absolute top-1/3 right-1/4 h-3 w-3 rounded-full bg-[var(--gp-violet)] animate-float" style={{animationDelay: "2s"}} />
        <div className="absolute top-1/2 left-1/4 h-2 w-2 rounded-full bg-[var(--gp-cyan)] animate-float-slow" style={{animationDelay: "3s"}} />
        <div className="absolute bottom-1/4 right-1/3 h-2 w-2 rounded-full bg-[var(--gp-pink)] animate-float-slow" style={{animationDelay: "4s"}} />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Badge with enhanced animation */}
        <div className="flex justify-center mb-12 animate-slide-in">
          <div className="group relative inline-flex items-center gap-2 rounded-full bg-[var(--surface-1)] border-2 border-[var(--border-soft)] shadow-[var(--shadow-hard-sm)] px-6 py-3 hover:shadow-[var(--shadow-hard-cyan)] transition-all duration-300">
            <span className="size-2 rounded-full bg-[var(--gp-cyan)] animate-pulse" />
            <span className="text-sm font-bold text-[var(--gp-cyan)] tracking-wide uppercase">Proof-of-Learning on Kaspa • All Hope, No Hype</span>
          </div>
        </div>

        {/* Main headline with enhanced animation and 3D effect */}
        <div className="mb-16 text-center space-y-8">
          <h1 className="text-6xl md:text-9xl font-extrabold text-[var(--text-1)] leading-[0.95] animate-slide-in" style={{animationDelay: "0.1s"}}>
            Your Knowledge
            <br />
            <span className="relative inline-block text-[var(--gp-cyan)] animate-slide-in" style={{animationDelay: "0.2s"}}>
              Has Real Value
            </span>
          </h1>
          <p className="text-xl md:text-3xl text-[var(--text-2)] max-w-4xl mx-auto leading-relaxed animate-slide-in font-medium" style={{animationDelay: "0.3s"}}>
            Quiz2Earn platform on Kaspa. Prove your knowledge, earn $GEEK tokens.
            <br />
            <span className="text-[var(--text-3)] text-lg md:text-xl">Fast. Fair. Instant settlements.</span>
          </p>
        </div>

        {/* Enhanced CTA Section with more impact */}
        <div className="text-center mb-24 space-y-8 animate-slide-in" style={{animationDelay: "0.4s"}}>
          <div className="relative inline-block group">
            <div className="relative px-12 py-6 bg-[var(--gp-pink)] border-2 border-[var(--ink)] rounded-3xl shadow-[6px_6px_0px_0px_var(--gp-pink-dark)]">
              <p className="text-3xl md:text-4xl font-extrabold text-white uppercase tracking-wider">
                Coming Q1 2026
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-2xl md:text-3xl font-bold text-[var(--text-1)]">
              🎮 The Geek Gauntlet Launches Soon
            </p>
            <p className="text-base md:text-lg text-[var(--text-3)] font-medium">
              100 questions. 10 rounds. 8 categories. Infinite potential.
            </p>
          </div>
        </div>

        {/* Key metrics with enhanced styling and animations */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pb-24 border-b border-[var(--border-soft)]">
          <div className="group soft-card p-6 md:p-8 text-center animate-slide-in hover:shadow-[var(--shadow-brand)] hover:scale-105 transition-all duration-300" style={{animationDelay: "0.5s"}}>
            <div className="text-4xl md:text-6xl font-extrabold text-[var(--brand-primary)] group-hover:scale-110 transition-transform duration-300 mb-3">8</div>
            <div className="text-xs md:text-sm text-[var(--text-3)] font-semibold">Knowledge<br/>Categories</div>
          </div>
          <div className="group soft-card p-6 md:p-8 text-center animate-slide-in hover:shadow-[var(--shadow-brand)] hover:scale-105 transition-all duration-300" style={{animationDelay: "0.6s"}}>
            <div className="text-4xl md:text-6xl font-extrabold text-[var(--brand-secondary)] group-hover:scale-110 transition-transform duration-300 mb-3">100</div>
            <div className="text-xs md:text-sm text-[var(--text-3)] font-semibold">Questions<br/>(10 rounds)</div>
          </div>
          <div className="group soft-card p-6 md:p-8 text-center animate-slide-in hover:shadow-[var(--shadow-brand)] hover:scale-105 transition-all duration-300" style={{animationDelay: "0.7s"}}>
            <div className="text-4xl md:text-6xl font-extrabold text-[var(--brand-primary)] group-hover:scale-110 transition-transform duration-300 mb-3">15s</div>
            <div className="text-xs md:text-sm text-[var(--text-3)] font-semibold">Per<br/>Question</div>
          </div>
          <div className="group soft-card p-6 md:p-8 text-center animate-slide-in hover:shadow-[var(--shadow-brand)] hover:scale-105 transition-all duration-300" style={{animationDelay: "0.8s"}}>
            <div className="text-4xl md:text-6xl font-extrabold text-[var(--brand-secondary)] group-hover:scale-110 transition-transform duration-300 mb-3">&lt;6s</div>
            <div className="text-xs md:text-sm text-[var(--text-3)] font-semibold">Reward<br/>Settlement</div>
          </div>
        </div>

        {/* Enhanced trust indicators */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 mt-24 text-[var(--text-2)] text-sm md:text-base animate-fade-in" style={{animationDelay: "0.9s"}}>
          <div className="flex items-center gap-3 group hover:text-[var(--text-1)] transition-colors">
            <span className="text-[var(--brand-primary)] text-xl group-hover:scale-125 transition-transform">✓</span>
            <span className="font-semibold">Kaspa Layer 1</span>
          </div>
          <div className="flex items-center gap-3 group hover:text-[var(--text-1)] transition-colors">
            <span className="text-[var(--brand-secondary)] text-xl group-hover:scale-125 transition-transform">✓</span>
            <span className="font-semibold">Sub-Second Finality</span>
          </div>
          <div className="flex items-center gap-3 group hover:text-[var(--text-1)] transition-colors">
            <span className="text-[var(--brand-primary)] text-xl group-hover:scale-125 transition-transform">✓</span>
            <span className="font-semibold">Cryptographic Proof</span>
          </div>
        </div>
      </div>
    </section>
  );
}
