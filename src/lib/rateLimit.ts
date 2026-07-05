// Minimal in-memory sliding-window rate limiter for the public endpoints.
// Per-instance only (serverless instances don't share it), but combined with
// the per-phone booking cap it raises the abuse bar from "trivial loop" to
// "distributed effort" without adding infrastructure to a small shop site.
import "server-only";

const buckets = new Map<string, number[]>();

/** True when the caller identified by `key` is still within `limit` hits per `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  // Opportunistic cleanup so the map can't grow without bound under an
  // IP-rotating flood.
  if (buckets.size > 5000) {
    for (const [k, hits] of buckets) {
      if (hits.length === 0 || now - hits[hits.length - 1] > windowMs) buckets.delete(k);
    }
  }

  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

/** Best-effort caller identity behind Vercel/proxies. */
export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
