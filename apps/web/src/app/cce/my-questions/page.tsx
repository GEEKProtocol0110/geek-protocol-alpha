"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

type Question = {
  id: number;
  question: string;
  status: string;
  difficulty: string;
  dateCreated: string;
  totalServes: number;
  totalEarned: number;
  approvalsCount: number;
  rejectionsCount: number;
  topic: { name: string };
};

const STATUS_FILTERS = [
  { value: "", label: "ALL" },
  { value: "pending", label: "PENDING" },
  { value: "approved", label: "APPROVED" },
  { value: "rejected", label: "REJECTED" },
];

export default function MyQuestions() {
  const { status, token } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/login");
  }, [status, router]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (filter) params.set("status", filter);
      const res = await fetch(`${API}/api/cce/my-questions?${params}`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 403) { router.replace("/cce"); return; }
      const j = await res.json();
      setQuestions(j.data ?? []);
      setTotal(j.total ?? 0);
      setPages(j.pages ?? 1);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token, page, filter, router]);

  useEffect(() => {
    if (status === "authenticated") fetchQuestions();
  }, [status, fetchQuestions]);

  const statusColor = (s: string) =>
    s === "approved" ? "text-[var(--brand-secondary)] bg-[var(--brand-secondary)]/10"
    : s === "rejected" ? "text-[var(--brand-tertiary)] bg-[var(--brand-tertiary)]/10"
    : "text-[var(--brand-accent)] bg-[var(--brand-accent)]/10";

  if (status === "idle" || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[var(--text-1)]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12">

        <Link href="/cce" className="text-xs text-[var(--text-3)] hover:text-[var(--brand-primary)] transition mb-6 inline-block font-semibold">← CCE Dashboard</Link>

        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="badge-pill text-[var(--brand-accent)] mb-4">My Questions</div>
            <h1 className="font-extrabold text-4xl text-[var(--text-1)]">My Questions</h1>
            <p className="text-xs text-[var(--text-3)] mt-1">{total} total submissions</p>
          </div>
          <Link href="/cce/submit" className="pill-btn pill-btn-primary text-lg px-6">
            + Submit New
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setPage(1); }}
              className={`text-[10px] tracking-widest font-bold rounded-full px-3 py-1.5 transition ${
                filter === f.value
                  ? "bg-[var(--brand-primary)] text-white border-[3px] border-[var(--ink)] shadow-[var(--shadow-brand)]"
                  : "bg-[var(--surface-2)] text-[var(--text-3)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : questions.length === 0 ? (
          <div className="soft-card p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <div className="font-extrabold text-xl text-[var(--text-1)] mb-2">No Questions Yet</div>
            <p className="text-xs text-[var(--text-3)] mb-6">Start contributing to the knowledge base!</p>
            <Link href="/cce/submit" className="pill-btn pill-btn-primary text-xl px-8">
              Submit First Question
            </Link>
          </div>
        ) : (
          <>
            <div className="soft-card divide-y divide-[var(--border-soft)] overflow-hidden">
              {questions.map((q) => (
                <div key={q.id} className="hover:bg-[var(--surface-2)] transition p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-2)] mb-2 leading-relaxed font-medium">{q.question}</p>
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="badge-pill text-[var(--brand-primary)]">{q.topic.name}</span>
                        <span className="text-[10px] text-[var(--text-3)]">{q.difficulty}</span>
                        <span className="text-[10px] text-[var(--text-3)]">
                          {new Date(q.dateCreated).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] rounded-full px-2 py-0.5 block mb-2 font-bold ${statusColor(q.status)}`}>
                        {q.status.toUpperCase()}
                      </span>
                      {q.status === "approved" && (
                        <div className="font-extrabold text-lg text-[var(--brand-accent)]">{q.totalEarned.toFixed(2)} $GEEK</div>
                      )}
                      {q.status === "pending" && (
                        <div className="text-[10px] text-[var(--text-3)] font-semibold">
                          👍{q.approvalsCount} 👎{q.rejectionsCount}
                        </div>
                      )}
                    </div>
                  </div>
                  {q.status === "approved" && q.totalServes > 0 && (
                    <div className="mt-2 text-[10px] text-[var(--text-3)]">{q.totalServes} times played</div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-xs rounded-full bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text-1)] px-4 py-2 disabled:opacity-30 transition font-semibold"
                >
                  ← Prev
                </button>
                <span className="text-xs text-[var(--text-3)] font-semibold">{page} / {pages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="text-xs rounded-full bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text-1)] px-4 py-2 disabled:opacity-30 transition font-semibold"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
