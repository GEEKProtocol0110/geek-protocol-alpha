"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

type TopicSummary = { id: number; name: string; isActive: boolean; questionCount: number };
type FailedRow = { index: number; error: string };
type UploadResult = { requested: number; inserted: number; failedCount: number; failed: FailedRow[] };

export default function AdminPage() {
  const { user, status } = useAuth();
  const router = useRouter();

  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [topicsError, setTopicsError] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/auth/login?callbackUrl=${encodeURIComponent("/admin")}`);
    }
  }, [status, router]);

  const loadTopics = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/admin/questions/topics`, { credentials: "include" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to load topics");
      setTopics(json.data);
      setTopicsError("");
    } catch (e) {
      setTopicsError(e instanceof Error ? e.message : "Failed to load topics");
    }
  }, []);

  useEffect(() => {
    if (user?.isAdmin) loadTopics();
  }, [user, loadTopics]);

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setJsonText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  async function upload() {
    setError("");
    setResult(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setError("That's not valid JSON - check for a missing comma or bracket.");
      return;
    }

    const questions = Array.isArray(parsed)
      ? parsed
      : (parsed as { questions?: unknown })?.questions;

    if (!Array.isArray(questions) || questions.length === 0) {
      setError("Expected a top-level \"questions\" array (or a bare array) with at least one question.");
      return;
    }

    setUploading(true);
    try {
      const res = await fetch(`${API}/api/admin/questions/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ questions }),
      });
      const json = await res.json();
      if (!json.success) {
        const message =
          typeof json.error === "string"
            ? json.error
            : json.error?.formErrors?.join(", ") || JSON.stringify(json.error);
        throw new Error(message || "Upload failed");
      }
      setResult(json.data);
      loadTopics();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (status === "idle" || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "authenticated" && !user?.isAdmin) {
    return (
      <div className="min-h-screen text-[var(--text-1)]">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <div className="soft-card border border-[var(--brand-tertiary)]/30 p-8">
            <div className="font-extrabold text-2xl text-[var(--brand-tertiary)] mb-2">Admin Access Required</div>
            <p className="text-sm text-[var(--text-3)]">This page is only available to admin accounts.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[var(--text-1)]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="badge-pill text-[var(--brand-accent)] mb-4">Admin</div>
          <h1 className="font-extrabold text-4xl text-[var(--text-1)]">Bulk Add Questions</h1>
          <p className="text-sm text-[var(--text-3)] mt-2">
            Paste or upload a JSON file of questions. Each question must use one of the categories below.{" "}
            <a href="/questions-template.json" download className="text-[var(--brand-primary)] hover:underline">
              Download the template
            </a>{" "}
            to see the exact format.
          </p>
        </div>

        {/* Topic counts */}
        <div className="soft-card p-6 mb-8">
          <div className="text-[10px] tracking-widest text-[var(--brand-primary)] font-bold uppercase mb-4">
            Categories &amp; Current Question Counts
          </div>
          {topicsError && <div className="text-xs text-[var(--brand-tertiary)]">{topicsError}</div>}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {topics.map((t) => (
              <div key={t.id} className="rounded-2xl bg-[var(--surface-2)] p-3 text-center">
                <div className="text-[10px] tracking-widest text-[var(--text-3)] uppercase font-semibold">{t.name}</div>
                <div className="font-extrabold text-xl text-[var(--brand-primary)]">{t.questionCount}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload panel */}
        <div className="soft-card p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] tracking-widest text-[var(--brand-accent)] font-bold uppercase">
              Paste JSON or Upload a File
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full border border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/5 hover:bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-semibold text-xs px-4 py-2 transition"
            >
              Choose .json File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={onFilePicked}
              className="hidden"
            />
          </div>

          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='{ "questions": [ { "category": "Kaspa Origins", "question": "...", "options": ["A","B","C","D"], "correctIndex": 0, "difficulty": "easy" } ] }'
            rows={14}
            className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-2)] p-4 text-xs font-mono text-[var(--text-1)] focus:outline-none focus:border-[var(--brand-primary)]/50"
          />

          {error && (
            <div className="mt-3 rounded-2xl border border-[var(--brand-tertiary)]/30 bg-[var(--brand-tertiary)]/5 p-3 text-xs text-[var(--brand-tertiary)] font-medium">
              {error}
            </div>
          )}

          <button
            onClick={upload}
            disabled={uploading || !jsonText.trim()}
            className="pill-btn pill-btn-primary w-full mt-4 text-lg py-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading…" : "Validate & Upload"}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="soft-card p-6">
            <div className="text-[10px] tracking-widest text-[var(--brand-primary)] font-bold uppercase mb-4">
              Upload Result
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-2xl bg-[var(--surface-2)] p-4 text-center">
                <div className="text-[10px] tracking-widest text-[var(--text-3)] uppercase font-semibold">Requested</div>
                <div className="font-extrabold text-2xl text-[var(--text-1)]">{result.requested}</div>
              </div>
              <div className="rounded-2xl bg-[var(--brand-secondary)]/10 p-4 text-center">
                <div className="text-[10px] tracking-widest text-[var(--text-3)] uppercase font-semibold">Inserted</div>
                <div className="font-extrabold text-2xl text-[var(--brand-secondary)]">{result.inserted}</div>
              </div>
              <div className="rounded-2xl bg-[var(--brand-tertiary)]/10 p-4 text-center">
                <div className="text-[10px] tracking-widest text-[var(--text-3)] uppercase font-semibold">Failed</div>
                <div className="font-extrabold text-2xl text-[var(--brand-tertiary)]">{result.failedCount}</div>
              </div>
            </div>

            {result.failed.length > 0 && (
              <div className="max-h-72 overflow-y-auto rounded-2xl border border-[var(--border-soft)] divide-y divide-[var(--border-soft)]">
                {result.failed.map((f) => (
                  <div key={f.index} className="p-3 text-xs">
                    <span className="font-bold text-[var(--brand-tertiary)]">Row {f.index + 1}:</span>{" "}
                    <span className="text-[var(--text-3)]">{f.error}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
