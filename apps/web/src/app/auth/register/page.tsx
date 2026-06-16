"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FaWallet, FaUserPlus, FaUser, FaLock, FaEnvelope, FaBolt, FaCheckCircle } from "react-icons/fa";

function validate(username: string, email: string, password: string) {
  if (!/^[a-zA-Z0-9_-]{3,50}$/.test(username))
    return "Username must be 3–50 chars: letters, numbers, _ or -";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return "Enter a valid email address";
  if (password.length < 8)
    return "Password must be at least 8 characters";
  return null;
}

export default function RegisterPage() {
  const { signUp, connectWallet, kaswareInstalled, walletConnecting, isAuthenticated } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const validationError = validate(username.trim(), email.trim(), password);
    if (validationError) return setError(validationError);
    setLoading(true);
    try {
      await signUp(username.trim(), email.trim(), password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleWalletRegister = async () => {
    setError("");
    try {
      await connectWallet();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet registration failed");
    }
  };

  const perks = [
    "Earn $GEEK tokens for every correct answer",
    "Compete on global real-time leaderboards",
    "Build permanent on-chain reputation",
    "Sub-6 second reward settlement on Kaspa",
  ];

  return (
    <div className="min-h-screen bg-[#0a0e0a] text-white flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "linear-gradient(#2a1a3a 1px, transparent 1px), linear-gradient(90deg, #2a1a3a 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      {/* Glow orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-4xl z-10 grid md:grid-cols-2 gap-8 items-start">

        {/* Left — perks */}
        <div className="hidden md:flex flex-col justify-center py-8">
          <div className="inline-flex items-center gap-2 border border-[#b87333] px-3 py-1 font-mono text-xs text-[#b87333] mb-6 w-fit">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
            PROOF-OF-LEARNING PROTOCOL
          </div>
          <h2 className="font-bebas tracking-widest text-5xl text-white leading-tight mb-4">
            TURN YOUR<br />
            <span className="text-pink-600">KNOWLEDGE</span><br />
            INTO ASSETS
          </h2>
          <p className="text-white/50 text-sm font-mono mb-8 leading-relaxed">
            Join the first Quiz2Earn platform on Kaspa.<br />
            Prove what you know. Get rewarded instantly.
          </p>

          <div className="space-y-3">
            {perks.map((perk, i) => (
              <div key={i} className="flex items-start gap-3 border border-[#2a1a3a] bg-[#0d120d] px-4 py-3">
                <FaCheckCircle className="text-cyan-400 mt-0.5 shrink-0" />
                <span className="text-white/70 text-sm">{perk}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-[#2a1a3a] pt-6">
            <p className="font-mono text-[10px] tracking-widest text-white/20">
              Built on Kaspa · KRC-20 Native · Open Source
            </p>
          </div>
        </div>

        {/* Right — form */}
        <div>
          {/* Logo */}
          <div className="text-center mb-6">
            <a href="/" className="inline-flex items-center gap-3 mb-4">
              <span className="font-bebas tracking-widest text-3xl text-pink-600">GP</span>
              <span className="font-sans font-bold text-sm tracking-widest text-white/50">GEEK PROTOCOL</span>
            </a>
            <h1 className="font-bebas tracking-widest text-4xl text-white">CREATE ACCOUNT</h1>
            <p className="text-white/40 text-sm mt-1 font-mono">Join the Proof-of-Learning movement</p>
          </div>

          {/* Card */}
          <div className="relative border border-[#2a1a3a] bg-[#0d120d] p-8">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#b87333]" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#b87333]" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#b87333]" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#b87333]" />

            {/* Wallet register */}
            <button
              onClick={handleWalletRegister}
              disabled={!kaswareInstalled || walletConnecting}
              className="w-full flex items-center justify-center gap-3 border border-cyan-400/40 bg-cyan-400/5 hover:bg-cyan-400/10 text-cyan-400 font-bold text-sm tracking-wider px-4 py-3 transition disabled:opacity-40 disabled:cursor-not-allowed mb-6 font-mono"
            >
              <FaWallet />
              {walletConnecting ? "CONNECTING…" : kaswareInstalled ? "REGISTER WITH KASWARE" : "INSTALL KASWARE FIRST"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-[#2a1a3a]" />
              <span className="font-mono text-[10px] tracking-widest text-white/30">OR USE EMAIL</span>
              <div className="flex-1 h-px bg-[#2a1a3a]" />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 border border-pink-500/30 bg-pink-500/10 px-4 py-3 font-mono text-xs text-pink-400 flex items-center gap-2">
                <span className="text-pink-500">✗</span> {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] tracking-widest text-[#b87333] mb-2 uppercase">
                  Username
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-xs" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="geek_legend"
                    autoComplete="username"
                    required
                    className="w-full bg-[#0a0e0a] border border-[#2a1a3a] focus:border-cyan-400/50 text-white text-sm pl-9 pr-4 py-3 outline-none transition font-mono placeholder-white/20"
                  />
                </div>
                <p className="mt-1 font-mono text-[10px] text-white/25">3–50 chars · letters, numbers, _ or -</p>
              </div>

              <div>
                <label className="block font-mono text-[10px] tracking-widest text-[#b87333] mb-2 uppercase">
                  Email
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-xs" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="w-full bg-[#0a0e0a] border border-[#2a1a3a] focus:border-cyan-400/50 text-white text-sm pl-9 pr-4 py-3 outline-none transition font-mono placeholder-white/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] tracking-widest text-[#b87333] mb-2 uppercase">
                  Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-xs" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    autoComplete="new-password"
                    required
                    className="w-full bg-[#0a0e0a] border border-[#2a1a3a] focus:border-cyan-400/50 text-white text-sm pl-9 pr-4 py-3 outline-none transition font-mono placeholder-white/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bebas tracking-widest text-lg px-4 py-3 transition flex items-center justify-center gap-2 mt-2"
              >
                <FaUserPlus />
                {loading ? "CREATING ACCOUNT…" : "CREATE ACCOUNT"}
              </button>
            </form>

            {/* Footer link */}
            <div className="mt-6 pt-6 border-t border-[#2a1a3a] text-center">
              <p className="font-mono text-xs text-white/30">
                Already a Geek?{" "}
                <Link href="/auth/login" className="text-cyan-400 hover:text-cyan-300 transition font-bold">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>

          {/* Tagline */}
          <p className="text-center font-mono text-[10px] tracking-widest text-white/20 mt-6 flex items-center justify-center gap-2">
            <FaBolt className="text-[#b87333]" />
            ALL HOPE. NO HYPE. — GEEK PROTOCOL
            <FaBolt className="text-[#b87333]" />
          </p>
        </div>
      </div>
    </div>
  );
}
