import { safeLocalPath } from './mapFocus';

const KEY = 'sutura_last_page';
// Screens that are only a detour (choose a place, sign in): never "where I was".
const DETOURS = ['/location', '/map', '/login', '/register'];

/** Remember the page the person is on, unless it is a detour. Kept for the browser session only. */
export function rememberPage(path: string): void {
  const pathname = path.split('?')[0];
  if (DETOURS.some((d) => pathname === d || pathname.startsWith(`${d}/`))) return;
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    // Private browsing / storage disabled
  }
}

/** The last real page the person was on, or null: where a detour such as /location should lead Back to. */
export function lastPage(): string | null {
  try {
    return safeLocalPath(sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
}
