import Redis from "ioredis";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      connectTimeout: 3000,
      retryStrategy: (times) => (times > 2 ? null : Math.min(times * 200, 1000)),
    });
    redis.on("error", () => {
      // Silently ignore – we treat Redis as optional
    });
    redis.connect().catch(() => {
      // Connection failed – cache calls will fall through
    });
    return redis;
  } catch {
    return null;
  }
}

/** Get a cached value. Returns null on miss or if Redis is unavailable. */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = getRedis();
    if (!client) return null;
    const raw = await client.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Set a cached value with TTL in seconds. Silently fails if Redis is unavailable. */
export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  try {
    const client = getRedis();
    if (!client) return;
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // no-op
  }
}

/** Delete a cached key. */
export async function cacheDel(key: string): Promise<void> {
  try {
    const client = getRedis();
    if (!client) return;
    await client.del(key);
  } catch {
    // no-op
  }
}
