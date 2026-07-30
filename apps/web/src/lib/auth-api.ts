const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
const TOKEN_KEY = "gp_token";

export function saveToken(token: string) {
  if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
}
export function loadToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function clearToken() {
  if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
}

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  role: string;
  isAdmin: boolean;
  walletAddress: string | null;
  xp: number;
  level: number;
  points: number;
  currentStreak: number;
  longestStreak: number;
  geekBalance: number;
  streakBonusMultiplier: number;
  favoriteCharacter: string;
  characterAffinityGiga: number;
  characterAffinityAce: number;
  dateCreated: string;
  // /me extras
  levelStage?: string;
  xpProgress?: number;
  streakMultiplier?: number;
  characterAffinities?: { GIGA: number; ACE: number };
};

export type AuthResponse = {
  data: AuthUser & { token: string };
};

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = loadToken();
  return {
    ...(extra ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function extractErrorMessage(json: unknown, status: number): string {
  if (!json || typeof json !== "object") return `Request failed (${status})`;
  const j = json as Record<string, unknown>;
  if (typeof j.error === "string") return j.error;
  // Zod flatten shape: { fieldErrors: {}, formErrors: [] }
  if (j.error && typeof j.error === "object") {
    const fe = (j.error as Record<string, unknown>).fieldErrors;
    if (fe && typeof fe === "object") {
      const msgs = Object.values(fe as Record<string, string[]>).flat();
      if (msgs.length) return msgs.join(", ");
    }
    const form = (j.error as Record<string, unknown>).formErrors;
    if (Array.isArray(form) && form.length) return (form as string[]).join(", ");
  }
  if (typeof j.message === "string") return j.message;
  return `Request failed (${status})`;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: authHeaders(body ? { "Content-Type": "application/json" } : {}),
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the server. Make sure the API is running.");
  }
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Server returned an unexpected response (${res.status})`);
  }
  if (!res.ok) throw new Error(extractErrorMessage(json, res.status));
  return json as T;
}

async function get<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      credentials: "include",
      headers: authHeaders(),
    });
  } catch {
    throw new AuthError("Unauthenticated");
  }
  if (res.status === 401) throw new AuthError("Unauthenticated");
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Server returned an unexpected response (${res.status})`);
  }
  if (!res.ok) throw new Error(extractErrorMessage(json, res.status));
  return json as T;
}

export class AuthError extends Error {}

export async function register(
  username: string,
  email: string,
  password: string
): Promise<AuthUser> {
  const json = await post<{ data: AuthUser }>("/api/auth/register", {
    username,
    email,
    password,
  });
  return json.data;
}

export async function login(
  credential: string,
  password: string
): Promise<AuthUser & { token: string }> {
  const isEmail = credential.includes("@");
  const json = await post<AuthResponse>("/api/auth/login", {
    [isEmail ? "email" : "username"]: credential,
    password,
  });
  return json.data;
}

/**
 * Request a single-use login challenge. The server authors the message; the
 * client must sign it verbatim and must not compose its own. The challenge is
 * burned on first use and expires after ~30s.
 */
export async function requestLoginNonce(
  walletAddress: string
): Promise<{ nonce: string; message: string; expiresAt: number; expiresInMs: number }> {
  const json = await post<{
    data: { nonce: string; message: string; expiresAt: number; expiresInMs: number };
  }>("/api/auth/nonce", { walletAddress });
  return json.data;
}

export async function walletLogin(
  walletAddress: string,
  message: string,
  signature: string
): Promise<AuthUser & { token: string }> {
  const json = await post<AuthResponse>("/api/auth/wallet-login", {
    walletAddress,
    message,
    signature,
  });
  return json.data;
}

export async function getMe(): Promise<AuthUser> {
  const json = await get<{ data: AuthUser }>("/api/auth/me");
  return json.data;
}

export async function authLogout(): Promise<void> {
  await post("/api/auth/logout");
}
