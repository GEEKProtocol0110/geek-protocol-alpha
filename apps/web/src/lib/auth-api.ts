const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

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

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : {},
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? `Request failed: ${res.status}`);
  return json as T;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
  });
  if (res.status === 401) throw new AuthError("Unauthenticated");
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? `Request failed: ${res.status}`);
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
