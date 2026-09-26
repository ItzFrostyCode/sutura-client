/**
 * Resolves media paths (logo_path, banner_path, profile_picture, image_url, catalog images, etc.)
 * to a fully-qualified, loadable and URI-encoded URL.
 * Works seamlessly across macOS, Windows, dev servers on ports 8000/8080, and standalone Next.js.
 */
export function getMediaUrl(path?: string | null): string {
  if (!path) return '';
  const trimmed = path.trim();
  if (!trimmed) return '';

  // Data URLs or Blob URLs
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return encodeURI(trimmed);
  }

  // Pre-bundled static seed store logos and banners stored under /storage/logos/ or /storage/banners/
  // Next.js client can serve these directly from public/storage/ without depending on backend symlinks!
  if (
    trimmed.startsWith('/storage/logos/') ||
    trimmed.startsWith('storage/logos/') ||
    trimmed.startsWith('/storage/banners/') ||
    trimmed.startsWith('storage/banners/')
  ) {
    const cleanClientPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return encodeURI(cleanClientPath);
  }

  // Static assets residing in the Next.js client public folder (e.g. /catalog/..., /fabrics/..., /receipts/..., /images/..., /logos/..., /banners/...)
  if (
    trimmed.startsWith('/catalog/') ||
    trimmed.startsWith('catalog/') ||
    trimmed.startsWith('/fabrics/') ||
    trimmed.startsWith('fabrics/') ||
    trimmed.startsWith('/receipts/') ||
    trimmed.startsWith('receipts/') ||
    trimmed.startsWith('/images/') ||
    trimmed.startsWith('images/') ||
    trimmed.startsWith('/logos/') ||
    trimmed.startsWith('logos/') ||
    trimmed.startsWith('/banners/') ||
    trimmed.startsWith('banners/')
  ) {
    const cleanClientPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return encodeURI(cleanClientPath);
  }

  // If already a full URL:
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // If it's a local storage URL referencing seeded logos or banners, serve them directly from client public/storage
    if (trimmed.includes('/storage/logos/') || trimmed.includes('/storage/banners/')) {
      const match = trimmed.match(/\/storage\/(logos|banners)\/.+$/);
      if (match) {
        return encodeURI(match[0]);
      }
    }

    // If it's a local storage URL with missing or mismatched port (e.g. http://localhost/storage/stores/...)
    const isLocalStorage =
      trimmed.includes('localhost/storage/') ||
      trimmed.includes('127.0.0.1/storage/') ||
      trimmed.includes('localhost:8000/storage/') ||
      trimmed.includes('127.0.0.1:8000/storage/') ||
      trimmed.includes('localhost:8080/storage/') ||
      trimmed.includes('127.0.0.1:8080/storage/');

    if (isLocalStorage) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
      const serverOrigin = apiBase.replace(/\/api\/v1\/?$/, '');
      const storagePathMatch = trimmed.match(/\/storage\/.+$/);
      if (storagePathMatch) {
        return encodeURI(`${serverOrigin}${storagePathMatch[0]}`);
      }
    }

    return encodeURI(trimmed);
  }

  // Backend Laravel storage uploads (e.g. /storage/stores/..., /uploads/...)
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
  const serverOrigin = apiBase.replace(/\/api\/v1\/?$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  return encodeURI(`${serverOrigin}${cleanPath}`);
}
