"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

type Attempt = {
  id: string;
  walletAddress: string;
  category: string;
  score: number;
  scorePct: number;
  timeSeconds: number;
  finishedAt: string;
  flags: string[];
  reward: {
    id: string;
    status: string;
    amount: number;
    txid: string | null;
  } | null;
};

type Reward = {
  id: string;
  attemptId: string;
  walletAddress: string;
  amount: number;
  status: string;
  txid: string | null;
  error: string | null;
  createdAt: string;
  confirmedAt: string | null;
};

export default function AdminPage() {
  const [view, setView] = useState<"attempts" | "rewards">("attempts");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, statusFilter]);

  async function fetchData() {
    setLoading(true);
    try {
      if (view === "attempts") {
        const res = await fetch(`${API_BASE}/api/admin/attempts?limit=50`, {
          credentials: "include",
        });
        const json = await res.json();
        if (json.success) setAttempts(json.data || []);
      } else {
        const url = statusFilter
          ? `${API_BASE}/api/admin/rewards?status=${statusFilter}&limit=50`
          : `${API_BASE}/api/admin/rewards?limit=50`;
        const res = await fetch(url, { credentials: "include" });
        const json = await res.json();
        if (json.success) setRewards(json.data || []);
      }
    } catch (e) {
      console.error("Failed to fetch admin data", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-sm text-white/70 hover:text-white">
            ← Home
          </Link>
          <span className="text-xs text-white/50">Admin Panel (MVP)</span>
        </div>

        <h1 className="text-3xl font-semibold mb-6">Admin Dashboard</h1>

        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setView("attempts")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              view === "attempts"
                ? "bg-white text-black"
                : "border border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
            }`}
          >
            Attempts
          </button>
          <button
            onClick={() => setView("rewards")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              view === "rewards"
                ? "bg-white text-black"
                : "border border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
            }`}
          >
            Rewards
          </button>
        </div>

        {view === "rewards" && (
          <div className="mb-6 flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="SENT">SENT</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="FAILED">FAILED</option>
            </select>
            <button
              onClick={fetchData}
              className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Refresh
            </button>
          </div>
        )}

        {loading && <p className="text-white/60">Loading...</p>}

        {!loading && view === "attempts" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-medium">Wallet</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Reward</th>
                  <th className="px-4 py-3 font-medium">Flags</th>
                </tr>
              </thead>
              <tbody>
                {attempts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-white/60">
                      No attempts found
                    </td>
                  </tr>
                ) : (
                  attempts.map((a) => (
                    <tr key={a.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 font-mono text-xs text-cyan-400">
                        {a.walletAddress.slice(0, 12)}…
                      </td>
                      <td className="px-4 py-3">{a.category}</td>
                      <td className="px-4 py-3">
                        {a.score} ({a.scorePct}%)
                      </td>
                      <td className="px-4 py-3">{a.timeSeconds}s</td>
                      <td className="px-4 py-3">
                        {a.reward ? (
                          <span
                            className={`text-xs ${
                              a.reward.status === "CONFIRMED"
                                ? "text-emerald-400"
                                : a.reward.status === "FAILED"
                                ? "text-red-400"
                                : "text-yellow-400"
                            }`}
                          >
                            {a.reward.status}
                          </span>
                        ) : (
                          <span className="text-xs text-white/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {a.flags.length > 0 ? (
                          <span className="text-xs text-red-400">{a.flags.join(", ")}</span>
                        ) : (
                          <span className="text-xs text-white/40">None</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && view === "rewards" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-medium">Wallet</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">TX</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Confirmed</th>
                </tr>
              </thead>
              <tbody>
                {rewards.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-white/60">
                      No rewards found
                    </td>
                  </tr>
                ) : (
                  rewards.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 font-mono text-xs text-cyan-400">
                        {r.walletAddress.slice(0, 12)}…
                      </td>
                      <td className="px-4 py-3">{r.amount}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium ${
                            r.status === "CONFIRMED"
                              ? "text-emerald-400"
                              : r.status === "FAILED"
                              ? "text-red-400"
                              : r.status === "SENT"
                              ? "text-yellow-400"
                              : "text-white/60"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {r.txid ? `${r.txid.slice(0, 10)}…` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-white/60">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-white/60">
                        {r.confirmedAt ? new Date(r.confirmedAt).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
