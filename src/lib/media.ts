/**
 * Resolves media paths (logo_path, banner_path, profile_picture, image_url, catalog images, etc.)
 * to a fully-qualified, loadable and URI-encoded URL.
 */
export function getMediaUrl(path?: string | null): string {
  if (!path) return '';
  const trimmed = path.trim();
  if (!trimmed) return '';

  // Already a full external URL, data URL, or blob URL
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return encodeURI(trimmed);
  }

  // Static assets residing in the Next.js client public folder (e.g. /catalog/..., /receipts/..., /images/...)
  if (
    trimmed.startsWith('/catalog/') ||
    trimmed.startsWith('catalog/') ||
    trimmed.startsWith('/receipts/') ||
    trimmed.startsWith('receipts/')
  ) {
    const cleanClientPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return encodeURI(cleanClientPath);
  }

  // Backend Laravel storage uploads (e.g. /storage/..., /shops/..., /uploads/...)
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
  const serverOrigin = apiBase.replace(/\/api\/v1\/?$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  return encodeURI(`${serverOrigin}${cleanPath}`);
}
