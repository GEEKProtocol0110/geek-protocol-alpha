const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export type CurrentUser = {
  id: string;
  walletAddress: string;
  xp: number;
  level: number;
  streak: number;
};

export type RewardRecord = {
  id: string;
  attemptId: string;
  userId: string;
  amount: string;
  status: "PENDING" | "SENT" | "CONFIRMED" | "FAILED";
  txid: string | null;
  error: string | null;
  createdAt: string;
  confirmedAt: string | null;
};

export type StartQuizResponse = {
  attemptId: string;
  attemptToken: string;
  expiresAt: number;
  questions: Array<{
    id: string;
    category: string;
    prompt: string;
    options: string[];
    // correctIndex may be omitted by server for security
    correctIndex?: number;
  }>;
};

export async function startQuiz(category = "General Geek"): Promise<StartQuizResponse> {
  const res = await fetch(`${API_BASE}/api/quiz/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category }),
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Start failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || "Start failed");
  return json.data as StartQuizResponse;
}

export async function submitQuiz(
  attemptId: string,
  attemptToken: string,
  answers: number[]
): Promise<{ attemptId: string; score: number; scorePct: number; timeSeconds: number }> {
  const res = await fetch(`${API_BASE}/api/quiz/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attemptId, attemptToken, answers }),
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Submit failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || "Submit failed");
  return json.data as { attemptId: string; score: number; scorePct: number; timeSeconds: number };
}

export async function getRewardStatus(attemptId: string): Promise<RewardRecord | null> {
  const res = await fetch(`${API_BASE}/api/rewards/${attemptId}`, {
    method: "GET",
    credentials: "include",
  });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) throw new Error(`Reward status failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || "Reward status failed");
  return json.data as RewardRecord;
}

export async function getLeaderboard(limit = 100) {
  const res = await fetch(`${API_BASE}/api/leaderboard/top?limit=${limit}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Leaderboard fetch failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || "Leaderboard fetch failed");
  return json.data as Array<{
    id: string;
    walletAddress: string;
    xp: number;
    level: number;
    streak: number;
    rank: number;
  }>;
}

export async function getUserStats(userId: string) {
  const res = await fetch(`${API_BASE}/api/leaderboard/user/${userId}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`User stats fetch failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || "User stats fetch failed");
  return json.data;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    method: "GET",
    credentials: "include",
  });
  if (res.status === 401) {
    return null;
  }
  if (!res.ok) throw new Error(`Current user fetch failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || "Current user fetch failed");
  return json.data as CurrentUser;
}

export async function getUserRewards(userId: string): Promise<RewardRecord[]> {
  const res = await fetch(`${API_BASE}/api/rewards/user/${userId}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`User rewards fetch failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || "User rewards fetch failed");
  return json.data as RewardRecord[];
}

// Auth: KasWare nonce + signature verify (dev-friendly)
export async function getNonce(): Promise<{ nonce: string; expiresAt: number }> {
  const res = await fetch(`${API_BASE}/api/auth/nonce`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Nonce failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || "Nonce failed");
  return json.data as { nonce: string; expiresAt: number };
}

export async function verifySignature(
  walletAddress: string,
  signature: string,
  nonce: string
): Promise<{ userId: string; walletAddress: string; token: string }> {
  const res = await fetch(`${API_BASE}/api/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ walletAddress, signature, nonce }),
  });
  if (!res.ok) throw new Error(`Verify failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || "Verify failed");
  return json.data as { userId: string; walletAddress: string; token: string };
}

export async function logout(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Logout failed: ${res.status}`);
}

