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
      background: i % 3 === 0 ? 'rgba(43, 182, 115, 0.5)' : i % 3 === 1 ? 'rgba(108, 62, 245, 0.5)' : 'rgba(247, 148, 29, 0.5)',
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
    <section className="relative min-h-screen w-full overflow-hidden bg-[var(--surface-0)] px-6 py-20">
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
          0%, 100% { opacity: 0.25; filter: blur(120px); }
          50% { opacity: 0.5; filter: blur(140px); }
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
          0% { box-shadow: 0 0 20px rgba(108, 62, 245, 0.25); }
          50% { box-shadow: 0 0 40px rgba(108, 62, 245, 0.35), 0 0 60px rgba(43, 182, 115, 0.2); }
          100% { box-shadow: 0 0 20px rgba(108, 62, 245, 0.25); }
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
          background: linear-gradient(90deg, transparent, rgba(108, 62, 245, 0.15), transparent);
          background-size: 1000px 100%;
        }
        .animate-particle {
          animation: particle 15s linear infinite;
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        {/* Dynamic glows that follow mouse */}
        <div
          className="absolute h-[800px] w-[800px] rounded-full bg-[var(--brand-primary)]/20 blur-[140px] animate-glow transition-all duration-1000"
          style={{
            top: `${mousePos.y}%`,
            left: `${mousePos.x}%`,
            transform: 'translate(-50%, -50%)'
          }}
        />

        {/* Static glows */}
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-[var(--brand-primary)]/15 blur-[120px] animate-glow" />
        <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-[var(--brand-secondary)]/15 blur-[120px] animate-glow" style={{animationDelay: "1s"}} />
        <div className="absolute top-1/2 left-1/3 h-[500px] w-[500px] rounded-full bg-[var(--brand-accent)]/10 blur-[100px] animate-glow" style={{animationDelay: "2s"}} />

        {/* Enhanced grid pattern with parallax */}
        <div
          className="absolute inset-0 bg-[linear-gradient(rgba(108,62,245,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(43,182,115,0.05)_1px,transparent_1px)] bg-[size:50px_50px]"
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
        <div className="absolute top-20 right-20 h-4 w-4 rounded-full bg-[var(--brand-primary)] shadow-[0_0_20px_rgba(108,62,245,0.5)] animate-float" style={{animationDelay: "0s"}} />
        <div className="absolute bottom-32 left-32 h-3 w-3 rounded-full bg-[var(--brand-secondary)] shadow-[0_0_15px_rgba(43,182,115,0.5)] animate-float" style={{animationDelay: "1s"}} />
        <div className="absolute top-1/3 right-1/4 h-3 w-3 rounded-full bg-[var(--brand-accent)] shadow-[0_0_15px_rgba(247,148,29,0.5)] animate-float" style={{animationDelay: "2s"}} />
        <div className="absolute top-1/2 left-1/4 h-2 w-2 rounded-full bg-[var(--brand-primary-light)] shadow-[0_0_10px_rgba(123,77,255,0.5)] animate-float-slow" style={{animationDelay: "3s"}} />
        <div className="absolute bottom-1/4 right-1/3 h-2 w-2 rounded-full bg-[var(--brand-secondary)] shadow-[0_0_10px_rgba(43,182,115,0.5)] animate-float-slow" style={{animationDelay: "4s"}} />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Badge with enhanced animation */}
        <div className="flex justify-center mb-12 animate-slide-in">
          <div className="group relative inline-flex items-center gap-2 rounded-full bg-white shadow-[var(--shadow-soft)] px-6 py-3 hover:shadow-[var(--shadow-brand)] transition-all duration-300 animate-glow-ring">
            <span className="size-2 rounded-full bg-[var(--brand-primary)] animate-pulse shadow-[0_0_10px_rgba(108,62,245,0.5)]" />
            <span className="text-sm font-bold text-[var(--brand-primary)] tracking-wide uppercase">Proof-of-Learning on Kaspa • All Hope, No Hype</span>
            <div className="absolute inset-0 rounded-full animate-shimmer opacity-50" />
          </div>
        </div>

        {/* Main headline with enhanced animation and 3D effect */}
        <div className="mb-16 text-center space-y-8">
          <h1 className="text-6xl md:text-9xl font-extrabold text-[var(--text-1)] leading-[0.95] animate-slide-in" style={{animationDelay: "0.1s"}}>
            Your Knowledge
            <br />
            <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-secondary)] to-[var(--brand-primary)] animate-slide-in" style={{animationDelay: "0.2s"}}>
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
            <div className="relative px-12 py-6 bg-gradient-to-br from-[var(--brand-accent)] to-[#ffb35c] rounded-3xl shadow-[var(--shadow-soft)]">
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
