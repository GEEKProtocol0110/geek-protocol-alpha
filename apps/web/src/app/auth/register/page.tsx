"use client";

import { useState, FormEvent, useEffect } from "react";
import Image from "next/image";
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
    <div className="min-h-screen text-[var(--text-1)] flex items-center justify-center px-4 py-16">
      <div className="relative w-full max-w-4xl grid md:grid-cols-2 gap-8 items-start">

        {/* Left — perks */}
        <div className="hidden md:flex flex-col justify-center py-8">
          <h2 className="font-extrabold text-5xl text-[var(--text-1)] leading-tight mb-4">
            Turn your<br />
            <span className="text-[var(--brand-primary)]">knowledge</span><br />
            into assets
          </h2>
          <p className="text-[var(--text-3)] text-sm mb-8 leading-relaxed">
            Join the first Quiz2Earn platform on Kaspa.<br />
            Prove what you know. Get rewarded instantly.
          </p>

          <div className="space-y-3">
            {perks.map((perk, i) => (
              <div key={i} className="flex items-start gap-3 soft-card px-4 py-3">
                <FaCheckCircle className="text-[var(--brand-secondary)] mt-0.5 shrink-0" />
                <span className="text-[var(--text-2)] text-sm font-medium">{perk}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-[var(--border-soft)] pt-6">
            <p className="text-[10px] tracking-widest text-[var(--text-3)] font-semibold uppercase">
              Built on Kaspa · KRC-20 Native · Open Source
            </p>
          </div>
        </div>

        {/* Right — form */}
        <div>
          {/* Logo */}
          <div className="text-center mb-6">
            <a href="/" className="inline-flex items-center mb-4">
              <Image src="/logo.png" alt="Geek Protocol" width={1536} height={1024} className="h-24 w-auto" />
            </a>
            <h1 className="font-extrabold text-4xl"><span className="neon-text-pink">Create Account</span></h1>
            <p className="text-[var(--text-3)] text-sm mt-1">Join the Proof-of-Learning movement</p>
          </div>

          {/* Card */}
          <div className="soft-card p-8">
            {/* Wallet register */}
            <button
              onClick={handleWalletRegister}
              disabled={!kaswareInstalled || walletConnecting}
              className="w-full flex items-center justify-center gap-3 rounded-2xl border border-[var(--brand-primary)]/30 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--brand-primary)] font-bold text-sm px-4 py-3 transition disabled:opacity-40 disabled:cursor-not-allowed mb-6"
            >
              <FaWallet />
              {walletConnecting ? "Connecting…" : kaswareInstalled ? "Register With Kasware" : "Install Kasware First"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-[var(--border-soft)]" />
              <span className="text-[10px] tracking-widest text-[var(--text-3)] font-semibold uppercase">Or use email</span>
              <div className="flex-1 h-px bg-[var(--border-soft)]" />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 rounded-2xl border border-[var(--brand-tertiary)]/30 bg-[var(--brand-tertiary)]/10 px-4 py-3 text-xs text-[var(--brand-tertiary)] flex items-center gap-2 font-semibold">
                <span>✗</span> {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-2)] mb-2 uppercase tracking-wide">
                  Username
                </label>
                <div className="relative">
                  <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-3)] text-xs" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="geek_legend"
                    autoComplete="username"
                    required
                    className="w-full rounded-full bg-[var(--surface-2)] border border-transparent focus:border-[var(--brand-primary)] text-[var(--text-1)] text-sm pl-10 pr-4 py-3 outline-none transition placeholder-[var(--text-3)]"
                  />
                </div>
                <p className="mt-1 text-[10px] text-[var(--text-3)] pl-2">3–50 chars · letters, numbers, _ or -</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-2)] mb-2 uppercase tracking-wide">
                  Email
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-3)] text-xs" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="w-full rounded-full bg-[var(--surface-2)] border border-transparent focus:border-[var(--brand-primary)] text-[var(--text-1)] text-sm pl-10 pr-4 py-3 outline-none transition placeholder-[var(--text-3)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-2)] mb-2 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-3)] text-xs" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    autoComplete="new-password"
                    required
                    className="w-full rounded-full bg-[var(--surface-2)] border border-transparent focus:border-[var(--brand-primary)] text-[var(--text-1)] text-sm pl-10 pr-4 py-3 outline-none transition placeholder-[var(--text-3)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="pill-btn pill-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-base py-3 mt-2"
              >
                <FaUserPlus />
                {loading ? "Creating Account…" : "Create Account"}
              </button>
            </form>

            {/* Footer link */}
            <div className="mt-6 pt-6 border-t border-[var(--border-soft)] text-center">
              <p className="text-xs text-[var(--text-3)]">
                Already a Geek?{" "}
                <Link href="/auth/login" className="text-[var(--brand-primary)] hover:opacity-80 transition font-bold">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>

          {/* Tagline */}
          <p className="text-center text-[10px] tracking-widest text-[var(--text-3)] mt-6 flex items-center justify-center gap-2 font-semibold uppercase">
            <FaBolt className="text-[var(--brand-accent)]" />
            All hope. No hype. — Geek Protocol
            <FaBolt className="text-[var(--brand-accent)]" />
          </p>
        </div>
      </div>
    </div>
  );
}
