import { config } from '../config/env.js';

/**
 * Course images and syllabus files are stored inline in the course document as base64
 * `data:` URIs (up to ~2.5 MB each). Reading them on every catalog/list query moved
 * megabytes per request from Atlas to the API and on to the browser.
 *
 * These helpers build MongoDB projections that, *inside the database*, replace an inline
 * `data:` value with a small versioned URL to GET /media/courses/:id/:kind. Plain http(s)
 * URLs and empty values pass through unchanged, so `thumbnail || fallback` logic keeps
 * working exactly as before.
 */

// response field -> URL kind segment served by the media route
export const COURSE_MEDIA_FIELDS = {
  thumbnail: 'thumbnail',
  banner: 'banner',
  image: 'image',
  syllabusUrl: 'syllabus',
};

export const MEDIA_KIND_TO_FIELD = Object.fromEntries(
  Object.entries(COURSE_MEDIA_FIELDS).map(([field, kind]) => [kind, field])
);

/**
 * Every top-level field course documents actually carry (schema paths plus legacy/extra
 * fields present in production data, since the schema is `strict: false`). Used where a
 * read previously loaded the whole document.
 */
export const COURSE_ALL_FIELDS = [
  'courseId', 'title', 'slug', 'description', 'shortDescription', 'thumbnail', 'banner', 'image',
  'instructorId', 'category', 'subcategory', 'level', 'language', 'skills', 'requirements',
  'learningObjectives', 'detailedOverview', 'targetAudience', 'courseGoals', 'teachingMethodology',
  'foundationalConcepts', 'recommendedPriorKnowledge', 'coreTools', 'hardwareRequirements',
  'softwareRequirements', 'requiredAccounts', 'courseIncludes', 'promotionalVideo', 'discountPrice', 'discountPercent', 'discountValidUntil', 'discountAppliedByRole', 'discountAppliedAt',
  'accessDuration', 'certificateEnabled', 'certificateSettings', 'coursePrice', 'currency', 'status',
  'approvalStatus', 'rejectionReason', 'approvedAt', 'approvedBy', 'publishingFeePaid',
  'publishingFeeAmount', 'publishingFeePaidAt', 'cashfreeOrderId', 'cashfreePaymentSessionId',
  'cashfreePaymentId', 'visibility', 'publishedAt', 'syllabusUrl', 'syllabusFileName',
  'maxEnrollmentLimit', 'enrolledCount', 'schedule', 'mentorStatus', 'professionalTags',
  'experienceMetrics', 'qualifications', 'totalSessions', 'modules', 'instructorEarnings',
  'platformFee', 'createdAt', 'updatedAt',
  // legacy field names still read by normalizers
  'cat', 'name', 'courseTitle', 'course_name', 'rawFee', 'fee_inr', 'price', 'fee', 'instructor',
  'instructorName', 'instructorTitle', 'originalPrice', 'badge', 'rating', 'reviewCount', 'reviewsCount',
];

export function courseMediaBaseUrl() {
  return `${config.publicApiUrl}/api/v1/media/courses`;
}

/** Version token for cache-busting media URLs: the course's updatedAt in ms. */
export function courseMediaVersion(course) {
  const t = course?.updatedAt ? new Date(course.updatedAt).getTime() : 0;
  return Number.isFinite(t) ? String(t) : '0';
}

function mediaExpression(field, kind) {
  const path = `$${field}`;
  return {
    $cond: [
      {
        $and: [
          { $eq: [{ $type: path }, 'string'] },
          { $eq: [{ $substrCP: [path, 0, 5] }, 'data:'] },
        ],
      },
      {
        $concat: [
          courseMediaBaseUrl(),
          '/',
          { $toString: '$_id' },
          `/${kind}?v=`,
          { $toString: { $toLong: { $ifNull: ['$updatedAt', 0] } } },
        ],
      },
      path,
    ],
  };
}

/**
 * Build a find/populate projection for the given course fields (string "a b c" or array),
 * substituting media fields with URL expressions. Unknown fields are harmless.
 */
export function courseSelect(fields = COURSE_ALL_FIELDS, { keepRaw = [] } = {}) {
  const list = Array.isArray(fields) ? fields : String(fields).split(/\s+/).filter(Boolean);
  const projection = {};
  for (const f of list) {
    projection[f] = COURSE_MEDIA_FIELDS[f] && !keepRaw.includes(f) ? mediaExpression(f, COURSE_MEDIA_FIELDS[f]) : 1;
  }
  return projection;
}

/**
 * Same treatment for user profile photos (inline base64 avatars repeated on every course/topic
 * card). Served by GET /media/users/:id/avatar, which only serves instructors' public avatars.
 */
export function userAvatarBaseUrl() {
  return `${config.publicApiUrl}/api/v1/media/users`;
}

export function userSelect(fields) {
  const list = Array.isArray(fields) ? fields : String(fields).split(/\s+/).filter(Boolean);
  const projection = {};
  for (const f of list) {
    if (f !== 'profilePhoto') {
      projection[f] = 1;
      continue;
    }
    projection[f] = {
      $cond: [
        {
          $and: [
            { $eq: [{ $type: '$profilePhoto' }, 'string'] },
            { $eq: [{ $substrCP: ['$profilePhoto', 0, 5] }, 'data:'] },
          ],
        },
        {
          $concat: [
            userAvatarBaseUrl(),
            '/',
            { $toString: '$_id' },
            '/avatar?v=',
            { $toString: { $toLong: { $ifNull: ['$updatedAt', 0] } } },
          ],
        },
        '$profilePhoto',
      ],
    };
  }
  return projection;
}

/** True when `value` points at our own media route (used to ignore echoed-back URLs on writes). */
export function isOwnCourseMediaUrl(value) {
  return typeof value === 'string' && (value.startsWith(`${courseMediaBaseUrl()}/`) || value.startsWith(`${userAvatarBaseUrl()}/`));
}

/** Parse a `data:` URI into { mime, buffer }; returns null when malformed. */
export function decodeDataUri(value) {
  if (typeof value !== 'string' || !value.startsWith('data:')) return null;
  const comma = value.indexOf(',');
  if (comma < 0) return null;
  const meta = value.slice(5, comma); // e.g. "image/png;base64"
  const payload = value.slice(comma + 1);
  const parts = meta.split(';');
  const mime = (parts[0] || 'application/octet-stream').trim().toLowerCase();
  const isBase64 = parts.slice(1).some((p) => p.trim().toLowerCase() === 'base64');
  try {
    const buffer = isBase64 ? Buffer.from(payload, 'base64') : Buffer.from(decodeURIComponent(payload), 'utf8');
    return { mime, buffer };
  } catch {
    return null;
  }
}
