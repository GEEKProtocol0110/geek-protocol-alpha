"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { FaWallet, FaSignInAlt, FaUser, FaLock, FaBolt } from "react-icons/fa";

function LoginForm() {
  const { signIn, connectWallet, kaswareInstalled, walletConnecting, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [credential, setCredential] = useState("");
  const [password, setPassword]     = useState("");
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.push(callbackUrl);
  }, [isAuthenticated, router, callbackUrl]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(credential.trim(), password);
      router.push(callbackUrl);
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
      router.push(callbackUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet login failed");
    }
  };

  return (
    <div className="min-h-screen text-[var(--text-1)]">
      <Navbar />

      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-56px)] px-4 py-16">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="badge-pill text-[var(--brand-primary)] mb-4">
              <span className="w-1.5 h-1.5 bg-[var(--brand-primary)] rounded-full animate-pulse" />
              Secure Login · KRC-20 Native
            </div>
            <h1 className="font-extrabold text-4xl"><span className="neon-text">Sign In</span></h1>
            <p className="text-[var(--text-3)] text-sm mt-1">Continue your Proof-of-Learning journey</p>
          </div>

          {/* Card */}
          <div className="soft-card p-8">
            {/* Wallet */}
            <button
              onClick={handleWalletLogin}
              disabled={!kaswareInstalled || walletConnecting}
              className="w-full flex items-center justify-center gap-3 rounded-2xl border border-[var(--brand-primary)]/30 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--brand-primary)] font-bold text-sm px-4 py-3 transition disabled:opacity-40 disabled:cursor-not-allowed mb-6"
            >
              <FaWallet />
              {walletConnecting ? "Connecting…" : kaswareInstalled ? "Connect Kasware Wallet" : "Install Kasware First"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-[var(--border-soft)]" />
              <span className="text-[10px] tracking-widest text-[var(--text-3)] font-semibold uppercase">Or sign in with credentials</span>
              <div className="flex-1 h-px bg-[var(--border-soft)]" />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 rounded-2xl border border-[var(--brand-tertiary)]/30 bg-[var(--brand-tertiary)]/10 px-4 py-3 text-xs text-[var(--brand-tertiary)] flex items-center gap-2 font-semibold">
                <span>✗</span> {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[var(--text-2)] mb-2 uppercase tracking-wide">
                  Email or Username
                </label>
                <div className="relative">
                  <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-3)] text-xs" />
                  <input
                    type="text"
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    placeholder="you@example.com or geek_handle"
                    autoComplete="username"
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
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full rounded-full bg-[var(--surface-2)] border border-transparent focus:border-[var(--brand-primary)] text-[var(--text-1)] text-sm pl-10 pr-4 py-3 outline-none transition placeholder-[var(--text-3)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="pill-btn pill-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-base py-3"
              >
                <FaSignInAlt />
                {loading ? "Verifying…" : "Sign In"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[var(--border-soft)] text-center">
              <p className="text-xs text-[var(--text-3)]">
                No account?{" "}
                <Link href="/auth/register" className="text-[var(--brand-primary)] hover:opacity-80 transition font-bold">
                  Register here
                </Link>
              </p>
            </div>
          </div>

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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginForm />
    </Suspense>
  );
}
