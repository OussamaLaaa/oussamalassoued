const BLOCKED_HOSTS = ['logo.clearbit.com'];

export function isBlockedUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url, window.location.href);
    return BLOCKED_HOSTS.includes(parsed.hostname);
  } catch {
    // If not a valid URL, consider it safe (likely relative)
    return false;
  }
}

export function sanitizeImageSrc(src: string | undefined | null): string {
  if (!src) return '';
  if (isBlockedUrl(src)) return '';
  return src;
}

export default { isBlockedUrl, sanitizeImageSrc };
