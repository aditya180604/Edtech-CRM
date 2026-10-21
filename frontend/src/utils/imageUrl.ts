/**
 * Normalizes image URLs, including Google Drive share links, Unsplash links, and CDN links,
 * converting them into directly embeddable, optimized, and compressed image src URLs.
 */
export function normalizeImageUrl(
  url: string | null | undefined,
  targetWidth: number = 800
): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Local images: automatically prefer WebP
  if (trimmed === '/Images/girl.png') return '/Images/girl.webp';
  if (trimmed === '/Images/Banner.png') return '/Images/Banner.webp';
  if (trimmed === '/Images/logo.png') return '/Images/logo.webp';

  // Google Drive: https://drive.google.com/file/d/<FILE_ID>/view?usp=sharing
  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveFileMatch[1]}=w${targetWidth}`;
  }

  // Google Drive: https://drive.google.com/open?id=<FILE_ID> or uc?id=<FILE_ID>
  const driveIdMatch = trimmed.match(
    /drive\.google\.com\/(?:open\?id=|uc\?id=|file\/d\/)([a-zA-Z0-9_-]+)/
  );
  if (driveIdMatch && driveIdMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveIdMatch[1]}=w${targetWidth}`;
  }

  // Unsplash CDN: enforce modern format, resizing, and 80% compression quality
  if (trimmed.includes('images.unsplash.com')) {
    if (!trimmed.includes('auto=format')) {
      const separator = trimmed.includes('?') ? '&' : '?';
      return `${trimmed}${separator}auto=format&fit=crop&w=${targetWidth}&q=80`;
    }
  }

  return trimmed;
}
