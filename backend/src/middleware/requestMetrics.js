import { randomUUID } from 'node:crypto';
import { runWithContext, newContext } from '../utils/requestContext.js';

/**
 * Request ID + structured access log + per-route latency percentiles.
 *
 * Logs never include query strings, bodies, headers or tokens: some GET routes carry
 * personal data in the query (e.g. /auth/auth-method?email=...).
 */
const SAMPLE_SIZE = 500;
const routes = new Map(); // "GET /api/v1/courses/featured" -> { count, errors, samples[], next, dbQueries }
const startedAt = Date.now();

const REQUEST_ID_RE = /^[A-Za-z0-9._-]{8,64}$/;

function routeKey(req) {
  // Group by route template, not concrete URL, so IDs/slugs don't explode cardinality.
  if (req.route?.path) return `${req.method} ${req.baseUrl}${req.route.path === '/' ? '' : req.route.path}`;
  return `${req.method} <unmatched>`;
}

function record(key, ms, status, dbCount) {
  let r = routes.get(key);
  if (!r) {
    r = { count: 0, errors: 0, samples: [], next: 0, dbQueries: 0 };
    routes.set(key, r);
  }
  r.count++;
  r.dbQueries += dbCount;
  if (status >= 500) r.errors++;
  if (r.samples.length < SAMPLE_SIZE) r.samples.push(ms);
  else {
    r.samples[r.next] = ms;
    r.next = (r.next + 1) % SAMPLE_SIZE;
  }
}

const pct = (sorted, p) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] : null);

export function getRouteMetrics() {
  const out = [];
  for (const [route, r] of routes) {
    const sorted = [...r.samples].sort((a, b) => a - b);
    out.push({
      route,
      count: r.count,
      errors5xx: r.errors,
      p50: pct(sorted, 50),
      p95: pct(sorted, 95),
      p99: pct(sorted, 99),
      max: sorted.length ? sorted[sorted.length - 1] : null,
      avgDbQueries: r.count ? Number((r.dbQueries / r.count).toFixed(1)) : 0,
    });
  }
  return { since: new Date(startedAt).toISOString(), sampleWindow: SAMPLE_SIZE, routes: out.sort((a, b) => (b.p95 || 0) - (a.p95 || 0)) };
}

export function requestMetrics({ log = true } = {}) {
  return (req, res, next) => {
    const incoming = req.headers['x-request-id'];
    const requestId = typeof incoming === 'string' && REQUEST_ID_RE.test(incoming) ? incoming : randomUUID();
    const ctx = newContext(requestId);
    const started = performance.now();

    res.setHeader('X-Request-Id', requestId);

    const originalWriteHead = res.writeHead;
    res.writeHead = function writeHeadWithTiming(...args) {
      if (!res.headersSent) {
        const total = performance.now() - started;
        res.setHeader(
          'Server-Timing',
          `db;dur=${ctx.db.ms.toFixed(1)};desc="${ctx.db.count} queries", app;dur=${total.toFixed(1)}`
        );
      }
      return originalWriteHead.apply(this, args);
    };

    res.on('finish', () => {
      const ms = Math.round(performance.now() - started);
      const key = routeKey(req);
      record(key, ms, res.statusCode, ctx.db.count);

      if (!log) return;
      const entry = {
        level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
        type: 'request',
        requestId,
        method: req.method,
        route: key.slice(req.method.length + 1),
        path: req.path,
        status: res.statusCode,
        ms,
        bytes: Number(res.getHeader('content-length')) || undefined,
        db: ctx.db.count ? { n: ctx.db.count, ms: Math.round(ctx.db.ms), slowest: Math.round(ctx.db.slowest) } : undefined,
        cache: ctx.cache.hit || ctx.cache.miss || ctx.cache.coalesced ? ctx.cache : undefined,
        ext: ctx.external.count ? { n: ctx.external.count, ms: Math.round(ctx.external.ms), failures: ctx.external.failures } : undefined,
      };
      console.log(JSON.stringify(entry));
    });

    runWithContext(ctx, next);
  };
}
