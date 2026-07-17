import { logger } from "./logger";
import Redis from "ioredis";
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const CACHE_KEY = "kas:usd:price";
const CACHE_TTL = 60; // Cache for 60 seconds
export async function getKasUsdPrice() {
    try {
        // Check cache first
        const cachedPrice = await redis.get(CACHE_KEY);
        if (cachedPrice) {
            return parseFloat(cachedPrice);
        }
        // Fetch from CoinGecko API
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=kaspa&vs_currencies=usd");
        const data = (await response.json());
        const price = data.kaspa?.usd;
        if (typeof price !== "number") {
            throw new Error("Invalid price data from CoinGecko");
        }
        // Cache the price
        await redis.setex(CACHE_KEY, CACHE_TTL, price.toString());
        logger.info({ price }, "Fetched KAS price from CoinGecko");
        return price;
    }
    catch (error) {
        logger.error({ error }, "Failed to fetch KAS price from CoinGecko");
        // Fallback to a default price
        return 0.04;
    }
}
