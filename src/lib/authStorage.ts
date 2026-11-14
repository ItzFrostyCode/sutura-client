import type { StaffProfile, Store, User } from '@/store/useAuthStore';

/**
 * The browser's one login, shared by every tab (like Facebook): signing in or out in one tab reaches the others
 * through the `storage` event (see useAuthStore's tab sync). One key, so a login or logout is a single change.
 */
export const AUTH_KEY = 'sutura_auth';

export interface SavedAuth {
  token: string;
  user: User;
  store: Store | null;
  staffProfile: StaffProfile | null;
}

// Before the shared login: each tab kept its own (sessionStorage), and even earlier builds used these localStorage keys.
const OLD_KEYS = ['sutura_token', 'sutura_user', 'sutura_store', 'sutura_staff', 'sutura_staff_profile'];

export function parseAuth(raw: string | null): SavedAuth | null {
  if (!raw) return null;
  try {
    const a = JSON.parse(raw) as SavedAuth;
    return a && typeof a.token === 'string' && a.user ? a : null;
  } catch {
    return null;
  }
}

export function readAuth(): SavedAuth | null {
  try {
    return parseAuth(localStorage.getItem(AUTH_KEY));
  } catch {
    return null;
  }
}

export function writeAuth(auth: SavedAuth): void {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  } catch {
    // Storage blocked: this tab stays signed in until it reloads.
  }
}

/**
 * Sign the browser out — but only if the saved login is still `token`. A tab still holding an older login (a 401 on a
 * token that another tab already replaced) must not sign out the newer one.
 */
export function clearAuth(token: string | null): void {
  try {
    if (token && readAuth()?.token === token) localStorage.removeItem(AUTH_KEY);
  } catch {
    // Storage blocked
  }
}

/** The signed-in token, for the API's Authorization header. */
export function authToken(): string | null {
  return readAuth()?.token ?? null;
}

/** Once per load: keep a login an older build left in this tab (so nobody is signed out by the update), drop the old keys. */
export function migrateOldAuth(): void {
  try {
    const token = sessionStorage.getItem('sutura_token');
    const user = sessionStorage.getItem('sutura_user');
    if (token && user && !readAuth()) {
      const store = sessionStorage.getItem('sutura_store');
      const staff = sessionStorage.getItem('sutura_staff');
      writeAuth({ token, user: JSON.parse(user), store: store ? JSON.parse(store) : null, staffProfile: staff ? JSON.parse(staff) : null });
    }
  } catch {
    // Unreadable old data: the person signs in again.
  }
  for (const key of OLD_KEYS) {
    try { sessionStorage.removeItem(key); localStorage.removeItem(key); } catch { /* storage blocked */ }
  }
}
