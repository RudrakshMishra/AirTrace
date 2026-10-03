/**
 * In-memory sliding window rate limiter for API routes.
 * Safe for single-process deployments and serverless warm containers.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const cache = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of cache.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 60_000);
      if (record.timestamps.length === 0) {
        cache.delete(key);
      }
    }
  }, 30_000);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60_000
): RateLimitResult {
  const now = Date.now();
  const record = cache.get(identifier) || { timestamps: [] };

  // Filter timestamps within the current sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const reset = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.max(1, reset),
    };
  }

  record.timestamps.push(now);
  cache.set(identifier, record);

  return {
    success: true,
    limit,
    remaining: limit - record.timestamps.length,
    reset: Math.ceil(windowMs / 1000),
  };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
