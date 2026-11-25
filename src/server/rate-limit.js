/** Bounded in-memory fixed-window limiter; single-process reference only. */
export function createSignalRateLimiter(options = {}) {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Rate limiter options must be an object.");
  }
  const { limit = 30, windowMs = 60_000, maxPrincipals = 10_000, now = Date.now } = options;
  if (!Number.isSafeInteger(limit) || limit < 1) throw new TypeError("limit must be a positive safe integer.");
  if (!Number.isSafeInteger(windowMs) || windowMs < 1) throw new TypeError("windowMs must be a positive safe integer.");
  if (!Number.isSafeInteger(maxPrincipals) || maxPrincipals < 1) throw new TypeError("maxPrincipals must be a positive safe integer.");
  if (typeof now !== "function") throw new TypeError("now must be a function.");
  const buckets = new Map();

  return Object.freeze({
    /** principal must come from trusted server authentication middleware. */
    consume(principal) {
      if (typeof principal !== "string" || principal.length === 0 || principal.length > 256) {
        throw new TypeError("principal must be a non-empty server-authenticated identifier.");
      }
      const currentTime = now();
      if (!Number.isFinite(currentTime) || currentTime < 0) throw new TypeError("now() must return a non-negative finite number.");
      let bucket = buckets.get(principal);
      if (!bucket || currentTime >= bucket.resetAt) {
        if (bucket) buckets.delete(principal);
        for (const [key, entry] of buckets) {
          if (currentTime >= entry.resetAt) buckets.delete(key);
        }
        if (buckets.size >= maxPrincipals) {
          return Object.freeze({ allowed: false, remaining: 0, resetAt: currentTime + windowMs });
        }
        bucket = { count: 0, resetAt: currentTime + windowMs };
        buckets.set(principal, bucket);
      }
      if (bucket.count >= limit) {
        return Object.freeze({ allowed: false, remaining: 0, resetAt: bucket.resetAt });
      }
      bucket.count += 1;
      return Object.freeze({ allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt });
    },
    clear() { buckets.clear(); }
  });
}
