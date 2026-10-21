/**
 * Minimal fixed-window, in-memory rate limiter (per process) for abuse-prone endpoints:
 * credential checks, password reset emails and paid AI calls.
 *
 * Client identity: Render sits behind Cloudflare, which sets CF-Connecting-IP; without it,
 * fall back to the first X-Forwarded-For hop and finally the socket address. Limits are
 * deliberately generous so shared networks (campus, office NAT) are not locked out.
 */
const buckets = new Map(); // key -> { count, resetAt }

const sweep = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60 * 1000);
sweep.unref();

export function clientIp(req) {
  const cf = req.headers['cf-connecting-ip'];
  if (typeof cf === 'string' && cf) return cf.trim();
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff) return xff.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

export function rateLimit({ name, windowMs = 60 * 1000, max = 30 }) {
  return (req, res, next) => {
    if (process.env.RATE_LIMIT_DISABLED === 'true') return next();

    const key = `${name}:${clientIp(req)}`;
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count++;

    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - bucket.count)));

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        statusCode: 429,
        success: false,
        message: `Too many requests. Please try again in ${retryAfter} seconds.`,
        errors: [],
        data: null,
      });
    }
    return next();
  };
}
