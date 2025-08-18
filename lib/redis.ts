import { Redis } from "@upstash/redis";

// Support both UPSTASH_REDIS_REST_ and REDIS_ environment variables for flexibility
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_TOKEN;

if (!redisUrl || !redisToken) {
  console.warn(
    "UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN or REDIS_URL/REDIS_TOKEN environment variables are not defined, please add to enable podcast metadata storage.",
  );
}

export const redis =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
      })
    : null;
