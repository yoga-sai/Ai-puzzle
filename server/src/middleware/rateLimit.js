const WINDOW_MS = 60 * 1000
const MAX_REQS_PER_WINDOW = 100

const buckets = new Map()

function keyFromReq(req) {
  const userId = req.headers['x-user-id'] || req.body?.user_id
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip
  return userId ? `user:${userId}` : `ip:${ip}`
}

export function rateLimit() {
  return function (req, res, next) {
    const key = keyFromReq(req)
    const now = Date.now()
    const bucket = buckets.get(key) || { start: now, count: 0 }

    if (now - bucket.start >= WINDOW_MS) {
      bucket.start = now
      bucket.count = 0
    }

    bucket.count += 1
    buckets.set(key, bucket)

    if (bucket.count > MAX_REQS_PER_WINDOW) {
      res.status(429).json({ error: 'Rate limit exceeded. Try again later.' })
      return
    }

    next()
  }
}

