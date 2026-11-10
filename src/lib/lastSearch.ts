/**
 * The Map's last address in this browser tab (search words, filters, List / Map view, the open shop), so the Map tab
 * in the bottom bar / header returns there instead of a fresh, empty map after a detour to Discover, Track or Profile.
 * Per tab and per visit (sessionStorage): a new visit starts clean.
 */
const KEY = 'sutura_last_search';

export function rememberSearch(path: string): void {
  try {
    if (path.startsWith('/search')) sessionStorage.setItem(KEY, path);
  } catch {
    // storage off: the Map tab simply opens a fresh map
  }
}

export function lastSearchHref(): string {
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved && saved.startsWith('/search')) return saved;
  } catch {
    // ignore
  }
  return '/search';
}
