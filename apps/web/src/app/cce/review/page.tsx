"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

type ReviewQuestion = {
  id: number;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  difficulty: string;
  approvalsCount: number;
  rejectionsCount: number;
  totalReviews: number;
  topic: { name: string };
  subtopic: string | null;
  funFact: string | null;
  sourceLink: string | null;
};

export default function ReviewQueue() {
  const { status, token } = useAuth();
  const router = useRouter();
  const [question, setQuestion] = useState<ReviewQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [result, setResult] = useState<{ action: string; geekAwarded: number; status: string } | null>(null);
  const [empty, setEmpty] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/login");
  }, [status, router]);

  const fetchNext = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setFeedback("");
    setError("");
    try {
      const res = await fetch(`${API}/api/cce/review/next`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 403) { router.replace("/cce"); return; }
      const j = await res.json();
      if (!j.data) { setEmpty(true); setQuestion(null); }
      else { setQuestion(j.data); setEmpty(false); }
    } catch {
      setError("Failed to load review question.");
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    if (status === "authenticated") fetchNext();
  }, [status, fetchNext]);

  const submitReview = async (action: "approve" | "reject") => {
    if (!question) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/cce/review`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ questionId: question.id, action, detailedFeedback: feedback }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error ?? "Review failed."); return; }
      setResult({ action, geekAwarded: j.data.geekAwarded, status: j.data.status });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "idle" || status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[var(--surface-0)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-[var(--text-1)]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">

        <Link href="/cce" className="text-xs text-[var(--text-3)] hover:text-[var(--brand-primary)] transition mb-6 inline-block font-semibold">← CCE Dashboard</Link>

        <div className="badge-pill text-[var(--brand-accent)] mb-4">Review Queue</div>
        <h1 className="font-extrabold text-4xl text-[var(--text-1)] mb-1">Review Queue</h1>
        <p className="text-xs text-[var(--text-3)] mb-8">
          Earn <span className="text-[var(--brand-accent)] font-semibold">0.1 $GEEK</span> per review · Submit feedback to help creators improve
        </p>

        {error && (
          <div className="rounded-2xl bg-[var(--brand-tertiary)]/10 border border-[var(--brand-tertiary)]/30 p-4 mb-6 text-sm text-[var(--brand-tertiary)] font-semibold">❌ {error}</div>
        )}

        {/* Result screen */}
        {result && (
          <div className="soft-card border border-[var(--brand-secondary)]/30 p-8 text-center mb-6">
            <div className="text-5xl mb-4">{result.action === "approve" ? "✅" : "❌"}</div>
            <div className="font-extrabold text-3xl text-[var(--text-1)] mb-2">
              {result.action === "approve" ? "Approved!" : "Rejected!"}
            </div>
            <div className="text-sm text-[var(--brand-accent)] font-semibold mb-2">+{result.geekAwarded} $GEEK earned</div>
            {result.status !== "pending" && (
              <div className="text-xs text-[var(--text-3)] mb-6">
                Question reached threshold — now <span className="text-[var(--brand-primary)] font-semibold">{result.status.toUpperCase()}</span>
              </div>
            )}
            <button
              onClick={fetchNext}
              className="pill-btn pill-btn-primary text-xl px-8"
            >
              Review Next →
            </button>
          </div>
        )}

        {/* Empty state */}
        {!result && empty && (
          <div className="soft-card p-12 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <div className="font-extrabold text-2xl text-[var(--text-1)] mb-2">Queue Is Clear</div>
            <p className="text-xs text-[var(--text-3)] mb-6">No questions waiting for review right now. Check back later!</p>
            <Link href="/cce" className="pill-btn pill-btn-primary text-xl px-8">
              Back to Dashboard
            </Link>
          </div>
        )}

        {/* Question card */}
        {!result && question && (
          <div className="soft-card p-6">
            {/* Meta */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="badge-pill text-[var(--brand-primary)]">{question.topic.name}</span>
              {question.subtopic && (
                <span className="text-[10px] text-[var(--text-3)]">{question.subtopic}</span>
              )}
              <span className={`text-[10px] rounded-full px-2 py-0.5 font-bold ${
                question.difficulty === "hard" ? "bg-[var(--brand-tertiary)]/10 text-[var(--brand-tertiary)]"
                : question.difficulty === "medium" ? "bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]"
                : "bg-[var(--brand-secondary)]/10 text-[var(--brand-secondary)]"
              }`}>
                {question.difficulty.toUpperCase()}
              </span>
              <span className="text-[10px] text-[var(--text-3)] ml-auto">
                👍 {question.approvalsCount} · 👎 {question.rejectionsCount} · {question.totalReviews} reviews
              </span>
            </div>

            {/* Question text */}
            <div className="text-base text-[var(--text-1)] mb-6 leading-relaxed border-l-2 border-[var(--brand-primary)]/40 pl-4 font-medium">
              {question.question}
            </div>

            {/* Options (display only, no correct answer shown) */}
            <div className="grid grid-cols-1 gap-2 mb-6">
              {[question.option1, question.option2, question.option3, question.option4].map((opt, i) => (
                <div key={i} className="rounded-2xl bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--text-2)] font-medium">
                  <span className="text-[var(--text-3)] mr-2 font-bold">{i + 1}.</span>{opt}
                </div>
              ))}
            </div>

            {/* Fun fact */}
            {question.funFact && (
              <div className="rounded-2xl bg-[var(--brand-primary-light)]/10 px-4 py-3 mb-6">
                <div className="text-[10px] text-[var(--brand-primary-light)] mb-1 font-bold uppercase">Fun Fact</div>
                <div className="text-xs text-[var(--text-2)]">{question.funFact}</div>
              </div>
            )}

            {/* Source */}
            {question.sourceLink && (
              <a href={question.sourceLink} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-[var(--brand-primary)] hover:underline block mb-6">
                🔗 Source: {question.sourceLink}
              </a>
            )}

            {/* Feedback */}
            <div className="mb-5">
              <label className="text-[10px] tracking-widest text-[var(--text-3)] block mb-1 font-semibold uppercase">Feedback (optional)</label>
              <textarea
                rows={2}
                maxLength={500}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Leave feedback for the creator…"
                className="w-full rounded-2xl bg-[var(--surface-2)] border border-transparent focus:border-[var(--brand-primary)] text-[var(--text-1)] text-sm p-3 outline-none resize-none transition"
              />
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => submitReview("reject")}
                disabled={submitting}
                className="rounded-full bg-[var(--brand-tertiary)] hover:opacity-90 disabled:opacity-50 text-white font-bold text-xl py-4 transition"
              >
                {submitting ? "…" : "👎 Reject"}
              </button>
              <button
                onClick={() => submitReview("approve")}
                disabled={submitting}
                className="rounded-full bg-[var(--brand-secondary)] hover:opacity-90 disabled:opacity-50 text-white font-bold text-xl py-4 transition"
              >
                {submitting ? "…" : "👍 Approve"}
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
