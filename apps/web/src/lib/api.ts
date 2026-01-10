const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

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

export async function getRewardStatus(attemptId: string) {
  const res = await fetch(`${API_BASE}/api/rewards/${attemptId}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Reward status failed: ${res.status}`);
  const json = await res.json();
  return json;
}
