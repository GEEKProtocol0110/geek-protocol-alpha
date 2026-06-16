"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { FaWallet, FaSignInAlt, FaUser, FaLock, FaBolt } from "react-icons/fa";

export default function LoginPage() {
  const { signIn, connectWallet, kaswareInstalled, walletConnecting, isAuthenticated } = useAuth();
  const router = useRouter();

  const [credential, setCredential] = useState("");
  const [password, setPassword]     = useState("");
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(credential.trim(), password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleWalletLogin = async () => {
    setError("");
    try {
      await connectWallet();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet login failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e0a] text-white relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: "linear-gradient(#2a1a3a 1px, transparent 1px), linear-gradient(90deg, #2a1a3a 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      <Navbar />

      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-56px)] px-4 py-16">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 border border-[#b87333] px-3 py-1 font-mono text-xs text-[#b87333] mb-4">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
              SECURE LOGIN · KRC-20 NATIVE
            </div>
            <h1 className="font-bebas tracking-widest text-4xl text-white">SIGN IN</h1>
            <p className="text-white/40 text-sm mt-1 font-mono">Continue your Proof-of-Learning journey</p>
          </div>

          {/* Card */}
          <div className="relative border border-[#2a1a3a] bg-[#0d120d] p-8">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#b87333]" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#b87333]" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#b87333]" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#b87333]" />

            {/* Wallet */}
            <button
              onClick={handleWalletLogin}
              disabled={!kaswareInstalled || walletConnecting}
              className="w-full flex items-center justify-center gap-3 border border-cyan-400/40 bg-cyan-400/5 hover:bg-cyan-400/10 text-cyan-400 font-bold text-sm tracking-wider px-4 py-3 transition disabled:opacity-40 disabled:cursor-not-allowed mb-6 font-mono"
            >
              <FaWallet />
              {walletConnecting ? "CONNECTING…" : kaswareInstalled ? "CONNECT KASWARE WALLET" : "INSTALL KASWARE FIRST"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-[#2a1a3a]" />
              <span className="font-mono text-[10px] tracking-widest text-white/30">OR SIGN IN WITH CREDENTIALS</span>
              <div className="flex-1 h-px bg-[#2a1a3a]" />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 border border-pink-500/30 bg-pink-500/10 px-4 py-3 font-mono text-xs text-pink-400 flex items-center gap-2">
                <span>✗</span> {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block font-mono text-[10px] tracking-widest text-[#b87333] mb-2 uppercase">
                  Email or Username
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-xs" />
                  <input
                    type="text"
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    placeholder="you@example.com or geek_handle"
                    autoComplete="username"
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
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full bg-[#0a0e0a] border border-[#2a1a3a] focus:border-cyan-400/50 text-white text-sm pl-9 pr-4 py-3 outline-none transition font-mono placeholder-white/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bebas tracking-widest text-lg px-4 py-3 transition flex items-center justify-center gap-2"
              >
                <FaSignInAlt />
                {loading ? "VERIFYING…" : "SIGN IN"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#2a1a3a] text-center">
              <p className="font-mono text-xs text-white/30">
                No account?{" "}
                <Link href="/auth/register" className="text-cyan-400 hover:text-cyan-300 transition font-bold">
                  Register here
                </Link>
              </p>
            </div>
          </div>

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
