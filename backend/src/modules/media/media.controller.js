import mongoose from 'mongoose';
import { Course, User } from '../../models/index.js';
import { asyncHandler, AppError } from '../../utils/apiResponse.js';
import { MEDIA_KIND_TO_FIELD, courseMediaVersion, decodeDataUri } from '../../utils/courseMedia.js';

const PUBLIC_STATUSES = ['PUBLISHED', 'Active', 'ACTIVE', 'published'];
const IMAGE_MIME_RE = /^image\/(png|jpe?g|webp|gif|avif|svg\+xml)$/;
const DOC_MIME_RE = /^(application\/(pdf|msword|vnd\.openxmlformats-officedocument\.[a-z.]+)|text\/plain)$/;

// Decoded binaries keyed by `${id}:${kind}:${version}`; bounded by total bytes.
const MAX_CACHE_BYTES = parseInt(process.env.MEDIA_CACHE_MAX_BYTES || `${64 * 1024 * 1024}`, 10);
const mediaCache = new Map();
const inflight = new Map();
let cachedBytes = 0;

function remember(key, entry) {
  if (entry.buffer.length > MAX_CACHE_BYTES / 4) return;
  mediaCache.set(key, entry);
  cachedBytes += entry.buffer.length;
  while (cachedBytes > MAX_CACHE_BYTES && mediaCache.size) {
    const [oldKey, old] = mediaCache.entries().next().value;
    mediaCache.delete(oldKey);
    cachedBytes -= old.buffer.length;
  }
}

export function clearMediaCache() {
  mediaCache.clear();
  cachedBytes = 0;
}

async function loadMedia(id, kind) {
  const field = MEDIA_KIND_TO_FIELD[kind];
  const course = await Course.findById(id)
    .select({ [field]: 1, status: 1, updatedAt: 1, syllabusFileName: 1, title: 1 })
    .lean();
  if (!course) return null;

  // Syllabus files were only ever exposed publicly for published courses.
  if (kind === 'syllabus' && !PUBLIC_STATUSES.includes(course.status)) return null;

  const raw = course[field];
  const version = courseMediaVersion(course);
  if (typeof raw !== 'string' || !raw.trim()) return { version, missing: true };
  if (/^https?:\/\//i.test(raw)) return { version, redirect: raw };

  const decoded = decodeDataUri(raw);
  if (!decoded) return { version, missing: true };

  const allowed = kind === 'syllabus' ? DOC_MIME_RE : IMAGE_MIME_RE;
  const mime = allowed.test(decoded.mime) ? decoded.mime : 'application/octet-stream';
  const fileName = kind === 'syllabus'
    ? (course.syllabusFileName || `${course.title || 'course'}_Syllabus.pdf`).replace(/[^\w.\- ]+/g, '_')
    : null;

  return { version, buffer: decoded.buffer, mime, fileName };
}

// Student photos are private; only staff/instructor avatars appear on public pages.
async function loadUserAvatar(id) {
  const user = await User.findById(id).select({ profilePhoto: 1, role: 1, updatedAt: 1 }).lean();
  if (!user || String(user.role || '').toUpperCase() === 'STUDENT') return null;
  const raw = user.profilePhoto;
  const version = courseMediaVersion(user);
  if (typeof raw !== 'string' || !raw.trim()) return { version, missing: true };
  if (/^https?:\/\//i.test(raw)) return { version, redirect: raw };
  const decoded = decodeDataUri(raw);
  if (!decoded) return { version, missing: true };
  return { version, buffer: decoded.buffer, mime: IMAGE_MIME_RE.test(decoded.mime) ? decoded.mime : 'application/octet-stream', fileName: null };
}

/** Shared response logic: memory cache, single-flight load, ETag/304, cache headers. */
async function sendMedia(req, res, lookupKey, load) {
  const requestedVersion = typeof req.query.v === 'string' ? req.query.v : null;

  let media = requestedVersion ? mediaCache.get(`${lookupKey}:${requestedVersion}`) : null;
  if (!media) {
    if (!inflight.has(lookupKey)) {
      inflight.set(lookupKey, load().finally(() => inflight.delete(lookupKey)));
    }
    media = await inflight.get(lookupKey);
    if (media?.buffer) remember(`${lookupKey}:${media.version}`, media);
  }

  if (!media || media.missing) throw new AppError('Media not found.', 404);

  // Images are embedded cross-origin by the frontend (Vercel -> Render).
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  if (media.redirect) {
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.redirect(302, media.redirect);
  }

  const etag = `"${lookupKey.replace(/:/g, '-')}-${media.version}"`;
  // Versioned URLs never change content (version = document updatedAt), so cache them for a year.
  res.setHeader(
    'Cache-Control',
    requestedVersion === media.version ? 'public, max-age=31536000, immutable' : 'public, max-age=300'
  );
  res.setHeader('ETag', etag);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (media.mime.startsWith('image/')) {
    // Neutralise scripts inside SVGs opened directly from the API origin.
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  }

  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }

  res.setHeader('Content-Type', media.mime);
  res.setHeader('Content-Length', media.buffer.length);
  if (media.fileName) {
    res.setHeader('Content-Disposition', `inline; filename="${media.fileName}"`);
  }
  return res.status(200).end(media.buffer);
}

export class MediaController {
  /**
   * GET /api/v1/media/users/:id/avatar
   */
  static getUserAvatar = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw new AppError('Media not found.', 404);
    return sendMedia(req, res, `user:${id}:avatar`, () => loadUserAvatar(id));
  });

  /**
   * GET /api/v1/media/courses/:id/:kind  (kind: thumbnail | banner | image | syllabus)
   */
  static getCourseMedia = asyncHandler(async (req, res) => {
    const { id, kind } = req.params;
    if (!MEDIA_KIND_TO_FIELD[kind] || !mongoose.isValidObjectId(id)) {
      throw new AppError('Media not found.', 404);
    }

    return sendMedia(req, res, `course:${id}:${kind}`, () => loadMedia(id, kind));
  });
}
