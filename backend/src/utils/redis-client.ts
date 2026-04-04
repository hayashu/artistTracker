import Redis from "ioredis";
import { config } from "../config";

export const redis = new Redis(config.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  retryStrategy: (times) => {
    if (times > 3) return null; // 3回失敗したら再接続を停止
    return Math.min(times * 300, 1000);
  },
});

redis.on("connect", () => console.log("[Redis] Connected"));
redis.on("error", (err) => console.error("[Redis] Error:", err.message || err));
