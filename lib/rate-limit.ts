import 'server-only'

type Bucket = { hits: number[] }

const buckets = new Map<string, Bucket>()

/**
 * Sliding-window limiter held in instance memory. Good enough to blunt abuse on a
 * single serverless instance; swap for Upstash Ratelimit when traffic is real.
 */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const bucket = buckets.get(key) ?? { hits: [] }
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs)

  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket)
    const retryAfter = Math.ceil((windowMs - (now - bucket.hits[0])) / 1000)
    return { ok: false as const, retryAfter }
  }

  bucket.hits.push(now)
  buckets.set(key, bucket)

  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (b.hits.every((t) => now - t >= windowMs)) buckets.delete(k)
    }
  }
  return { ok: true as const, remaining: limit - bucket.hits.length }
}

export function clientKey(request: Request, scope: string) {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'anon'
  return `${scope}:${ip}`
}
