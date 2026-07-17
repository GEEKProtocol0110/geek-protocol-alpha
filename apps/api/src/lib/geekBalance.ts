import { logger } from "./logger";

const KASPLEX_API = "https://api.kasplex.org";
const GEEK_TOKEN_ID = "GEEK"; // Replace with actual token ID

// In-memory cache for short-lived caching (a few seconds)
interface CacheEntry {
  balance: string;
  timestamp: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5000; // 5 seconds

export async function getGeekBalance(walletAddress: string): Promise<string> {
  const now = Date.now();
  const cached = cache.get(walletAddress);
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.balance;
  }

  try {
    const response = await fetch(
      `${KASPLEX_API}/v1/krc20/address/${walletAddress}/token/${GEEK_TOKEN_ID}`
    );
    const data = (await response.json()) as { result?: Array<{ balance?: string }> };

    // Assuming Kasplex API returns balance in a field like "balance"
    const balance = data?.result?.[0]?.balance || "0";

    cache.set(walletAddress, { balance, timestamp: now });
    return balance;
  } catch (error) {
    logger.error({ error, walletAddress }, "Failed to fetch GEEK balance from Kasplex");
    return "0";
  }
}
