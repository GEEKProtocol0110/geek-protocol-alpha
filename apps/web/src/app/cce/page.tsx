"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

type CCEDashboard = {
  level: number;
  questionsSubmitted: number;
  questionsApproved: number;
  questionsRejected: number;
  approvalRate: number;
  reviewsCompleted: number;
  reviewAccuracy: number;
  totalEarnedGeek: number;
  geekBalance: number;
  reviewAvailable: boolean;
  topQuestions: {
    id: number;
    question: string;
    totalEarned: number;
    totalServes: number;
    status: string;
    topic: { name: string };
  }[];
};

export default function CCEDashboard() {
  const { user, status, token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<CCEDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/cce/dashboard`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 403) {
        const j = await res.json();
        setError(j.error);
        setLoading(false);
        return;
      }
      const j = await res.json();
      setData(j.data);
    } catch {
      setError("Failed to load CCE dashboard.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") fetchDashboard();
  }, [status, fetchDashboard]);

  // Poll every 30s for live updates
  useEffect(() => {
    if (status !== "authenticated") return;
    const id = setInterval(fetchDashboard, 30_000);
    return () => clearInterval(id);
  }, [status, fetchDashboard]);

  if (status === "idle" || status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[var(--surface-0)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Level gate
  if (error || (data && data.level < 10)) {
    return (
      <div className="min-h-screen bg-[var(--surface-0)] text-[var(--text-1)]">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="font-extrabold text-4xl text-[var(--text-1)] mb-3">CCE Locked</h1>
          <p className="text-sm text-[var(--text-3)] mb-2">
            Community Content Engine requires <span className="text-[var(--brand-primary)] font-semibold">Level 10</span>.
          </p>
          <p className="text-sm text-[var(--text-3)] mb-8">
            You are Level <span className="text-[var(--brand-tertiary)] font-semibold">{user?.level ?? "?"}</span>. Keep playing to level up!
          </p>
          <Link
            href="/dashboard"
            className="pill-btn pill-btn-primary text-xl px-8"
          >
            Back to Dashboard
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (!data) return null;

  const navCards = [
    {
      href: "/cce/submit",
      icon: "✍️",
      label: "Submit Question",
      desc: "Add new questions to the pool",
      accent: "hover:bg-[var(--brand-primary)]/5",
    },
    {
      href: "/cce/review",
      icon: "🔍",
      label: "Review Queue",
      desc: data.reviewAvailable ? "⚡ Question ready for review!" : "No questions pending",
      accent: data.reviewAvailable
        ? "ring-2 ring-[var(--brand-accent)]/50"
        : "hover:bg-[var(--surface-2)]",
    },
    {
      href: "/cce/my-questions",
      icon: "📋",
      label: "My Questions",
      desc: `${data.questionsSubmitted} submitted`,
      accent: "hover:bg-[var(--brand-tertiary)]/5",
    },
    {
      href: "/cce/leaderboard",
      icon: "🏆",
      label: "Leaderboard",
      desc: "Top creators by earnings",
      accent: "hover:bg-[var(--brand-primary-light)]/5",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-[var(--text-1)]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-8">
          <div className="badge-pill text-[var(--brand-accent)] mb-4">Community Content Engine</div>
          <h1 className="font-extrabold text-5xl text-[var(--text-1)]">
            CCE <span className="text-[var(--brand-primary)]">Dashboard</span>
          </h1>
          <p className="text-sm text-[var(--text-3)] mt-1">
            Creator Hub · Level {data.level} · Earn $GEEK by building the knowledge base
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Submitted",     value: data.questionsSubmitted },
            { label: "Approved",      value: data.questionsApproved,  color: "text-[var(--brand-secondary)]" },
            { label: "Rejected",      value: data.questionsRejected,  color: "text-[var(--brand-tertiary)]" },
            { label: "Approval Rate", value: `${data.approvalRate}%`, color: data.approvalRate >= 60 ? "text-[var(--brand-secondary)]" : "text-[var(--brand-accent)]" },
          ].map((s) => (
            <div key={s.label} className="soft-card p-5 text-center">
              <div className="text-[10px] tracking-widest text-[var(--text-3)] uppercase mb-1 font-semibold">{s.label}</div>
              <div className={`font-extrabold text-3xl ${s.color ?? "text-[var(--text-1)]"}`}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "GEEK Earned",    value: data.totalEarnedGeek.toFixed(2), color: "text-[var(--brand-accent)]" },
            { label: "GEEK Balance",   value: data.geekBalance.toFixed(2),     color: "text-[var(--brand-primary)]" },
            { label: "Reviews Done",   value: data.reviewsCompleted },
            { label: "Review Accuracy", value: `${data.reviewAccuracy}%` },
          ].map((s) => (
            <div key={s.label} className="soft-card p-5 text-center">
              <div className="text-[10px] tracking-widest text-[var(--text-3)] uppercase mb-1 font-semibold">{s.label}</div>
              <div className={`font-extrabold text-3xl ${s.color ?? "text-[var(--text-1)]"}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Nav cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {navCards.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={`soft-card p-6 transition group ${c.accent}`}
            >
              <div className="text-3xl mb-3">{c.icon}</div>
              <div className="font-extrabold text-xl text-[var(--text-1)] group-hover:text-[var(--brand-primary)] transition mb-1">{c.label}</div>
              <div className="text-xs text-[var(--text-3)]">{c.desc}</div>
            </Link>
          ))}
        </div>

        {/* Top earning questions */}
        {data.topQuestions.length > 0 && (
          <div className="soft-card p-6">
            <div className="badge-pill text-[var(--brand-accent)] mb-4">Top Earning Questions</div>
            <div className="space-y-3">
              {data.topQuestions.map((q, i) => (
                <div key={q.id} className="flex items-center gap-4 border-b border-[var(--border-soft)] pb-3 last:border-0 last:pb-0">
                  <span className="font-extrabold text-2xl text-[var(--text-3)] w-6">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--text-2)] truncate font-medium">{q.question}</p>
                    <p className="text-[10px] text-[var(--text-3)] mt-0.5">{q.topic.name} · {q.totalServes} plays</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-extrabold text-lg text-[var(--brand-accent)]">{q.totalEarned.toFixed(2)} $GEEK</div>
                    <div className={`text-[10px] font-semibold ${q.status === "approved" ? "text-[var(--brand-secondary)]" : q.status === "rejected" ? "text-[var(--brand-tertiary)]" : "text-[var(--brand-accent)]"}`}>
                      {q.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
