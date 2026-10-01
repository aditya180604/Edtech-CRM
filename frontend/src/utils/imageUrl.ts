/**
 * Normalizes image URLs, including Google Drive share links, Unsplash links, and CDN links,
 * converting them into directly embeddable image src URLs.
 */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Google Drive: https://drive.google.com/file/d/<FILE_ID>/view?usp=sharing
  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveFileMatch[1]}`;
  }

  // Google Drive: https://drive.google.com/open?id=<FILE_ID> or uc?id=<FILE_ID>
  const driveIdMatch = trimmed.match(/drive\.google\.com\/(?:open\?id=|uc\?id=|file\/d\/)([a-zA-Z0-9_-]+)/);
  if (driveIdMatch && driveIdMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveIdMatch[1]}`;
  }

  return trimmed;
}
