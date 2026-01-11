"use client";

import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { LandingFooter } from "@/components/LandingFooter";
import { Starfield } from "@/components/Starfield";
import { useWallet } from "@/components/WalletProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { installed, address, connecting, connect } = useWallet();
  const [showWalletPrompt, setShowWalletPrompt] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();

  // Redirect to dashboard when wallet is connected (with visual feedback)
  useEffect(() => {
    if (address && showWalletPrompt) {
      setIsRedirecting(true);
      // Small delay so user sees the success state
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [address, showWalletPrompt, router]);

  // Show redirecting state when wallet is connected
  if (isRedirecting && address) {
    return (
      <main className="w-full min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
        <Starfield />
        
        {/* Cyberpunk grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />
        
        <div className="relative z-10 mx-auto max-w-2xl px-6">
          {/* Animated background */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl animate-pulse" />
            <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl animate-pulse" style={{animationDelay: "1s"}} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-cyan-500/5 blur-3xl animate-pulse" style={{animationDelay: "2s"}} />
          </div>

          {/* Success card */}
          <div className="relative rounded-3xl overflow-hidden glass p-12 border border-teal-500/30 shadow-[0_0_50px_rgba(20,184,166,0.2)] text-center space-y-8 animate-in">
            <div className="text-6xl mb-4 animate-bounce">✅</div>
            <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
              Wallet Connected!
            </h2>
            <p className="text-lg text-white/70">
              Entering the gauntlet...
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" style={{animationDelay: "0.2s"}} />
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" style={{animationDelay: "0.4s"}} />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Show wallet connection screen first
  if (showWalletPrompt && !address) {
    return (
      <main className="w-full min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
        <Starfield />
        
        {/* Cyberpunk grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />
        
        <div className="relative z-10 mx-auto max-w-2xl px-6">
          {/* Animated background */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl animate-pulse" />
            <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl animate-pulse" style={{animationDelay: "1s"}} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-cyan-500/5 blur-3xl animate-pulse" style={{animationDelay: "2s"}} />
          </div>

          {/* Wallet prompt card */}
          <div className="relative rounded-3xl overflow-hidden glass p-12 border border-teal-500/30 shadow-[0_0_50px_rgba(20,184,166,0.2)] text-center space-y-8">
            {/* Logo/Brand */}
            <div className="space-y-2">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Geek</span>
                <span className="text-white"> Protocol</span>
              </h1>
              <div className="text-emerald-300/60 text-sm font-medium font-mono">⚡ ALPHA BUILD ⚡</div>
              <div className="text-xs text-teal-400/40 font-mono">Cypherpunk Manifesto</div>
            </div>

            {/* Main message */}
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Connect Your Wallet
              </h2>
              <p className="text-lg text-white/70 max-w-md mx-auto">
                Connect your Kasware or GEEK wallet to start playing, earning, and climbing the leaderboard.
              </p>
            </div>

            {/* Wallet icons/info */}
            <div className="flex justify-center items-center gap-6 py-4">
              <div className="text-center">
                <div className="text-4xl mb-2">🔐</div>
                <div className="text-xs text-white/60">Kasware</div>
              </div>
              <div className="text-cyan-400/30 text-2xl">•</div>
              <div className="text-center">
                <div className="text-4xl mb-2">👾</div>
                <div className="text-xs text-white/60">GEEK Wallet</div>
              </div>
            </div>

            {/* Connect button */}
            <div className="space-y-4">
              <button
                onClick={() => void connect()}
                disabled={!installed || connecting}
                className="w-full max-w-sm mx-auto block rounded-xl border-2 border-teal-500/50 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-cyan-400/10 px-8 py-4 text-lg font-bold hover:border-teal-500/80 hover:shadow-[0_0_40px_rgba(20,184,166,0.4)] transition-all disabled:opacity-50 disabled:border-white/10 disabled:bg-white/5 disabled:cursor-not-allowed"
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                  {connecting ? "⚡ Connecting…" : installed ? "🔐 Connect Wallet" : "Install Kasware First"}
                </span>
              </button>

              {!installed && (
                <p className="text-sm text-white/50">
                  Don't have Kasware?{" "}
                  <a 
                    href="https://kasware.xyz" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Download here
                  </a>
                </p>
              )}

              {/* Skip option */}
              <button
                onClick={() => setShowWalletPrompt(false)}
                className="text-sm text-white/40 hover:text-white/60 transition-colors underline"
              >
                Continue without wallet (practice mode)
              </button>
            </div>

            {/* Features list */}
            <div className="pt-6 border-t border-white/10 space-y-3">
              <div className="text-xs text-white/50 uppercase tracking-wide">With Wallet Connected:</div>
              <div className="flex flex-wrap justify-center gap-3">
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-400/10 border border-emerald-400/30 text-xs text-emerald-300">
                  🎯 Earn $GEEK
                </span>
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-400/30 text-xs text-teal-300">
                  🏆 Leaderboard Access
                </span>
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-cyan-400/10 to-emerald-500/10 border border-cyan-400/30 text-xs text-cyan-300">
                  🎁 Rewards
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Show main content after wallet is connected or prompt is skipped
  return (
    <main className="w-full bg-black text-white">
      <Hero />
      <Features />
      <LandingFooter />
    </main>
  );
}
