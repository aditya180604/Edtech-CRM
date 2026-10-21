import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request context used for observability counters (DB queries, cache, external calls).
 * Never store request bodies, tokens or personal data here.
 */
const storage = new AsyncLocalStorage();

export function runWithContext(ctx, fn) {
  return storage.run(ctx, fn);
}

export function getContext() {
  return storage.getStore();
}

export function newContext(requestId) {
  return {
    requestId,
    db: { count: 0, ms: 0, slowest: 0 },
    cache: { hit: 0, miss: 0, coalesced: 0, error: 0 },
    external: { count: 0, ms: 0, failures: 0 },
  };
}

export function recordCacheEvent(type) {
  const ctx = storage.getStore();
  if (ctx && type in ctx.cache) ctx.cache[type]++;
}

export function recordDbCommand(ctx, durationMs) {
  if (!ctx) return;
  ctx.db.count++;
  ctx.db.ms += durationMs;
  if (durationMs > ctx.db.slowest) ctx.db.slowest = durationMs;
}

/**
 * Wrap an outbound call (payment gateway, AI provider) with a hard timeout and
 * latency/failure accounting. `fn` receives an AbortSignal it must pass to fetch.
 */
export async function trackExternal(name, timeoutMs, fn) {
  const ctx = storage.getStore();
  const started = performance.now();
  let failed = false;
  try {
    return await fn(AbortSignal.timeout(timeoutMs));
  } catch (err) {
    failed = true;
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      const timeoutErr = new Error(`${name} did not respond within ${timeoutMs}ms`);
      timeoutErr.statusCode = 504;
      timeoutErr.cause = err;
      throw timeoutErr;
    }
    throw err;
  } finally {
    const ms = performance.now() - started;
    if (ctx) {
      ctx.external.count++;
      ctx.external.ms += ms;
      if (failed) ctx.external.failures++;
    }
    if (failed || ms > 3000) {
      console.warn(JSON.stringify({ level: 'warn', type: 'external', name, ms: Math.round(ms), failed, requestId: ctx?.requestId }));
    }
  }
}
