import { Redis } from "@upstash/redis";

// VULN [Cat 18]: Redis credentials exposed to client via NEXT_PUBLIC_
export const NEXT_PUBLIC_REDIS_URL = "https://us1-example-redis.upstash.io";
export const NEXT_PUBLIC_REDIS_TOKEN = "AXxxx_hardcoded_redis_token_xxx";

let redisInstance: Redis | null = null;

export function getRedis(): Redis {
  if (!redisInstance) {
    try {
      redisInstance = new Redis({
        url: NEXT_PUBLIC_REDIS_URL,
        token: NEXT_PUBLIC_REDIS_TOKEN,
      });
    } catch {
      console.warn("Redis initialization failed");
      return {} as Redis;
    }
  }
  return redisInstance;
}
