/**
 * Shared input normalisation for list/search endpoints.
 */

/** Escape user input before using it inside a RegExp (prevents ReDoS and invalid-pattern 500s). */
export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case-insensitive "contains" regex from user search text, or null when empty. Caps length. */
export function searchRegex(value, maxLength = 100) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, maxLength);
  return trimmed ? new RegExp(escapeRegex(trimmed), 'i') : null;
}

/** Case-insensitive exact-match regex from user input (e.g. category names). */
export function exactRegex(value) {
  return new RegExp(`^${escapeRegex(String(value).trim())}$`, 'i');
}

/** Positive integer limit with a default and an enforced maximum. */
export function clampLimit(value, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n) || n <= 0) return defaultLimit;
  return Math.min(n, maxLimit);
}

/** Validated { page, limit, skip } from raw query values. */
export function parsePagination({ page, limit } = {}, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const safeLimit = clampLimit(limit, { defaultLimit, maxLimit });
  const p = parseInt(page, 10);
  const safePage = Number.isFinite(p) && p > 0 ? Math.min(p, 10000) : 1;
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}
