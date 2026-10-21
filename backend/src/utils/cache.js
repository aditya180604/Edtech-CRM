/**
 * In-process TTL cache for public, non-personalized read models.
 *
 * - Namespaced keys (`catalog:featured:8`) so writes can invalidate a whole area.
 * - Single-flight: concurrent misses for the same key share one loader promise.
 * - Generation guard: a load that started before an invalidation is not stored.
 * - Stale-on-error: if a reload fails, the last good value is served (bounded age).
 * - Bounded size (LRU eviction by insertion order).
 *
 * Scope is per Node process. With multiple instances, invalidation is local and
 * other instances converge within the TTL.
 */
import { recordCacheEvent } from './requestContext.js';

const DEFAULT_TTL_MS = 120 * 1000;
const STALE_IF_ERROR_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 1000;

const entries = new Map(); // key -> { value, expiresAt, storedAt }
const inflight = new Map(); // key -> Promise
const generations = new Map(); // namespace -> number
const stats = { hits: 0, misses: 0, staleServed: 0, errors: 0, invalidations: 0, evictions: 0 };

const namespaceOf = (key) => key.split(':', 1)[0];
const generationOf = (ns) => generations.get(ns) || 0;

function store(key, value, ttlMs) {
  if (entries.has(key)) entries.delete(key);
  entries.set(key, { value, expiresAt: Date.now() + ttlMs, storedAt: Date.now() });
  while (entries.size > MAX_ENTRIES) {
    entries.delete(entries.keys().next().value);
    stats.evictions++;
  }
}

/**
 * Return the cached value for `key`, or run `loader` once and cache its result.
 * Values must be treated as immutable by callers (they are shared across requests).
 */
export async function cached(key, loader, { ttlMs = DEFAULT_TTL_MS } = {}) {
  if (process.env.PUBLIC_CACHE_DISABLED === 'true') return loader();

  const now = Date.now();
  const hit = entries.get(key);
  if (hit && hit.expiresAt > now) {
    stats.hits++;
    recordCacheEvent('hit');
    return hit.value;
  }

  if (inflight.has(key)) {
    stats.hits++;
    recordCacheEvent('coalesced');
    return inflight.get(key);
  }

  stats.misses++;
  recordCacheEvent('miss');
  const ns = namespaceOf(key);
  const startGen = generationOf(ns);

  const promise = (async () => {
    try {
      const value = await loader();
      if (generationOf(ns) === startGen) store(key, value, ttlMs);
      return value;
    } catch (err) {
      stats.errors++;
      recordCacheEvent('error');
      const stale = entries.get(key);
      if (stale && now - stale.storedAt < STALE_IF_ERROR_MS) {
        stats.staleServed++;
        console.warn(`[Cache] Serving stale value for "${key}" after loader error: ${err.message}`);
        return stale.value;
      }
      throw err;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

/** Drop every entry in the given namespace(s) and bump their generation. */
export function invalidate(...namespaces) {
  for (const ns of namespaces.flat()) {
    generations.set(ns, generationOf(ns) + 1);
    const prefix = `${ns}:`;
    for (const key of entries.keys()) {
      if (key.startsWith(prefix)) entries.delete(key);
    }
  }
  stats.invalidations++;
}

export function clearCache() {
  entries.clear();
  inflight.clear();
  generations.clear();
}

export function getCacheStats() {
  const lookups = stats.hits + stats.misses;
  return {
    ...stats,
    entries: entries.size,
    hitRatio: lookups ? Number((stats.hits / lookups).toFixed(3)) : null,
  };
}

/** Stable cache-key fragment from a params object (ignores undefined/empty). */
export function keyFrom(params = {}) {
  return Object.keys(params)
    .sort()
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .map((k) => `${k}=${String(params[k]).trim().toLowerCase()}`)
    .join('&');
}

export const CACHE_NS = {
  CATALOG: 'catalog',
  LEARNING_PATHS: 'learningPaths',
  WEBINARS: 'webinars',
  STATS: 'stats',
};
