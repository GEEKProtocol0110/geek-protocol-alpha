"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

type Topic = { id: number; name: string; icon: string | null };

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export default function SubmitQuestion() {
  const { user, status, token } = useAuth();
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    question: "",
    option1: "",
    option2: "",
    option3: "",
    option4: "",
    correctOption: 1,
    difficulty: "medium" as typeof DIFFICULTIES[number],
    topicId: 0,
    subtopic: "",
    funFact: "",
    sourceLink: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (user && user.level < 10) { router.replace("/cce"); return; }
    fetch(`${API}/api/cce/topics`, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((j) => setTopics(j.data ?? []))
      .catch(() => {});
  }, [status, token, user, router]);

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.topicId) { setError("Please select a topic."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/cce/submit`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...form, topicId: Number(form.topicId) }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error?.fieldErrors ? "Please check all fields." : (j.error ?? "Submission failed.")); return; }
      setSuccess(true);
      setForm({ question: "", option1: "", option2: "", option3: "", option4: "", correctOption: 1, difficulty: "medium", topicId: 0, subtopic: "", funFact: "", sourceLink: "" });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Back */}
        <Link href="/cce" className="text-xs text-[var(--text-3)] hover:text-[var(--brand-primary)] transition mb-6 inline-block font-semibold">← CCE Dashboard</Link>

        <div className="badge-pill text-[var(--brand-accent)] mb-4">Submit Question</div>
        <h1 className="font-extrabold text-4xl text-[var(--text-1)] mb-1">Submit a Question</h1>
        <p className="text-xs text-[var(--text-3)] mb-8">Questions go into the review queue. 3 approvals → live in game.</p>

        {success && (
          <div className="rounded-2xl bg-[var(--brand-secondary)]/10 border border-[var(--brand-secondary)]/30 p-4 mb-6 text-sm text-[var(--brand-secondary)] font-medium">
            ✅ Question submitted! It&apos;s now in the review queue. Submit another or{" "}
            <Link href="/cce" className="underline hover:opacity-80">return to dashboard</Link>.
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-[var(--brand-tertiary)]/10 border border-[var(--brand-tertiary)]/30 p-4 mb-6 text-sm text-[var(--brand-tertiary)] font-medium">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Question text */}
          <div>
            <label className="text-[10px] tracking-widest text-[var(--text-2)] block mb-1 font-semibold uppercase">Question *</label>
            <textarea
              required
              minLength={10}
              maxLength={500}
              rows={3}
              value={form.question}
              onChange={(e) => set("question", e.target.value)}
              placeholder="Enter your question…"
              className="w-full rounded-2xl bg-[var(--surface-2)] border border-transparent focus:border-[var(--brand-primary)] text-[var(--text-1)] text-sm p-3 outline-none resize-none transition"
            />
            <div className="text-[10px] text-[var(--text-3)] text-right">{form.question.length}/500</div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3">
            <div className="text-[10px] tracking-widest text-[var(--text-2)] mb-1 font-semibold uppercase">Answer Options * (select correct one)</div>
            {([1, 2, 3, 4] as const).map((n) => (
              <div key={n} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => set("correctOption", n)}
                  className={`w-8 h-8 shrink-0 rounded-full font-extrabold text-sm transition ${
                    form.correctOption === n
                      ? "bg-[var(--brand-secondary)] text-white"
                      : "bg-[var(--surface-2)] text-[var(--text-3)] hover:bg-[var(--surface-3)]"
                  }`}
                  title="Mark as correct"
                >
                  {n}
                </button>
                <input
                  required
                  maxLength={200}
                  value={form[`option${n}` as keyof typeof form] as string}
                  onChange={(e) => set(`option${n}`, e.target.value)}
                  placeholder={`Option ${n}…`}
                  className="flex-1 rounded-full bg-[var(--surface-2)] border border-transparent focus:border-[var(--brand-primary)] text-[var(--text-1)] text-sm px-4 py-2 outline-none transition"
                />
              </div>
            ))}
            <div className="text-[10px] text-[var(--text-3)]">Click a number to mark the correct answer</div>
          </div>

          {/* Topic + Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] tracking-widest text-[var(--text-2)] block mb-1 font-semibold uppercase">Topic *</label>
              <select
                required
                value={form.topicId}
                onChange={(e) => set("topicId", Number(e.target.value))}
                className="w-full rounded-full bg-[var(--surface-2)] border border-transparent focus:border-[var(--brand-primary)] text-[var(--text-1)] text-sm px-4 py-2 outline-none transition"
              >
                <option value={0}>Select topic…</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.icon ? `${t.icon} ` : ""}{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] tracking-widest text-[var(--text-2)] block mb-1 font-semibold uppercase">Difficulty *</label>
              <select
                value={form.difficulty}
                onChange={(e) => set("difficulty", e.target.value)}
                className="w-full rounded-full bg-[var(--surface-2)] border border-transparent focus:border-[var(--brand-primary)] text-[var(--text-1)] text-sm px-4 py-2 outline-none transition"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Subtopic */}
          <div>
            <label className="text-[10px] tracking-widest text-[var(--text-2)] block mb-1 font-semibold uppercase">Subtopic (optional)</label>
            <input
              maxLength={100}
              value={form.subtopic}
              onChange={(e) => set("subtopic", e.target.value)}
              placeholder="e.g. NES Era, Marvel Comics…"
              className="w-full rounded-full bg-[var(--surface-2)] border border-transparent focus:border-[var(--brand-primary)] text-[var(--text-1)] text-sm px-4 py-2 outline-none transition"
            />
          </div>

          {/* Fun Fact */}
          <div>
            <label className="text-[10px] tracking-widest text-[var(--text-2)] block mb-1 font-semibold uppercase">Fun Fact (optional)</label>
            <textarea
              maxLength={500}
              rows={2}
              value={form.funFact}
              onChange={(e) => set("funFact", e.target.value)}
              placeholder="Add context shown after the question is answered…"
              className="w-full rounded-2xl bg-[var(--surface-2)] border border-transparent focus:border-[var(--brand-primary)] text-[var(--text-1)] text-sm p-3 outline-none resize-none transition"
            />
          </div>

          {/* Source */}
          <div>
            <label className="text-[10px] tracking-widest text-[var(--text-2)] block mb-1 font-semibold uppercase">Source Link (optional)</label>
            <input
              type="url"
              value={form.sourceLink}
              onChange={(e) => set("sourceLink", e.target.value)}
              placeholder="https://…"
              className="w-full rounded-full bg-[var(--surface-2)] border border-transparent focus:border-[var(--brand-primary)] text-[var(--text-1)] text-sm px-4 py-2 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="pill-btn pill-btn-primary w-full disabled:opacity-50 text-xl py-4"
          >
            {submitting ? "Submitting…" : "Submit Question →"}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
