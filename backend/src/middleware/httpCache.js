/**
 * Cache-Control for public catalog GETs.
 *
 * Anonymous requests may be reused by the browser for `maxAge` seconds, which removes the
 * repeated identical requests fired while navigating between pages. `private` keeps shared
 * caches/CDNs out of it. Authenticated requests (responses can carry per-user flags such as
 * isEnrolled) are marked `no-cache`: the browser revalidates with the ETag and gets a 304
 * when nothing changed.
 */
export function publicCache(maxAge = 30) {
  return (req, res, next) => {
    const hasCredentials = Boolean(req.headers.authorization || req.cookies?.accessToken);
    res.setHeader('Vary', 'Authorization, Origin');
    res.setHeader(
      'Cache-Control',
      hasCredentials ? 'private, no-cache' : `private, max-age=${maxAge}, stale-while-revalidate=${maxAge * 2}`
    );
    next();
  };
}
