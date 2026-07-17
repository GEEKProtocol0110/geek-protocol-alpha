
import Redis from "ioredis";

console.log("Testing Redis connection...");
const redis = new Redis("redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

redis.on("ready", () => {
  console.log("Redis is ready!");
  redis.ping().then((result) => {
    console.log("Ping result:", result);
    process.exit(0);
  });
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
  process.exit(1);
});
