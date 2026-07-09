// In-memory token buckets — sufficient for a single-process deployment.

type Bucket = { tokens: number; updatedAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Returns true when the call is allowed. `key` should include the endpoint
 * and the caller identity (user id or IP).
 */
export function rateLimit(key: string, maxPerMinute: number): boolean {
	const now = Date.now();
	const bucket = buckets.get(key) ?? { tokens: maxPerMinute, updatedAt: now };
	bucket.tokens = Math.min(maxPerMinute, bucket.tokens + ((now - bucket.updatedAt) / 60_000) * maxPerMinute);
	bucket.updatedAt = now;
	if (bucket.tokens < 1) {
		buckets.set(key, bucket);
		return false;
	}
	bucket.tokens -= 1;
	buckets.set(key, bucket);
	if (buckets.size > 10_000) buckets.clear(); // crude leak guard, fine at this scale
	return true;
}
