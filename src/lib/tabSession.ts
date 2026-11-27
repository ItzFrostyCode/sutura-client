/**
 * Logins live in sessionStorage — one per browser tab, so a shop owner in one
 * tab and a customer in another never overwrite each other. But a tab opened
 * with "Open link in new tab" starts with EMPTY sessionStorage and would land
 * on the login page.
 *
 * This lets a new, empty tab borrow the login of an already-open SUTURA tab
 * (same site only — BroadcastChannel never crosses origins). If several tabs
 * answer with different accounts, the one used most recently wins.
 *
 * Isolation rules (sessions used to leak between windows):
 *  - Only a tab OPENED FROM a SUTURA page borrows (same-site referrer, e.g.
 *    "Open link in new tab"). A fresh window, a second Incognito window, a
 *    typed address or a bookmark starts as a guest. Every window of one browser
 *    profile (all Incognito windows count as one) shares BroadcastChannel, so
 *    without this they all signed each other in.
 *  - The borrowed token is traded for the tab's OWN token
 *    (POST /auth/tab-token). Two tabs used to share one token, so signing out
 *    in one deleted it and signed the other out too.
 * A tab that signed out on purpose never borrows a login back.
 */

const CHANNEL = 'sutura-tab-session';
const SIGNED_OUT_FLAG = 'sutura_tab_signed_out';

type Scope = 'shop' | 'admin';
type Msg =
  | { type: 'request'; id: string; scope: Scope }
  | { type: 'reply'; id: string; scope: Scope; data: Record<string, string>; usedAt: number };

// Same keys as useAuthStore (shop/customer) and adminApi.ts (ADMIN_TOKEN_KEY / ADMIN_USER_KEY).
const SCOPE_KEYS: Record<Scope, { token: string; keys: string[] }> = {
  shop: { token: 'sutura_token', keys: ['sutura_token', 'sutura_user', 'sutura_store', 'sutura_staff'] },
  admin: { token: 'sutura_admin_token', keys: ['sutura_admin_token', 'sutura_admin_user'] },
};

const supported = () => typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined';

/** Opened from a SUTURA page (a link / "Open in new tab"), not a fresh window, typed URL or bookmark. */
function openedFromThisSite(): boolean {
  try {
    return !!document.referrer && new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

/** Trades a borrowed token for this tab's own (same user, same abilities). Null if the server refuses. */
async function ownToken(borrowed: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/auth/tab-token`, {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: `Bearer ${borrowed}` },
    });
    if (!res.ok) return null;
    const body = await res.json();
    return typeof body?.data?.token === 'string' ? body.data.token : null;
  } catch {
    return null;
  }
}

let lastUsedAt = 0;
let serving = false;

/** Answer other tabs' requests with this tab's login (if it has one). Call once per tab. */
export function serveTabSessions(): void {
  if (!supported() || serving) return;
  serving = true;
  lastUsedAt = document.hasFocus() ? Date.now() : 0;
  const touch = () => { lastUsedAt = Date.now(); };
  window.addEventListener('focus', touch);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') touch(); });

  const channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = (e: MessageEvent<Msg>) => {
    const msg = e.data;
    if (msg?.type !== 'request') return;
    const { token, keys } = SCOPE_KEYS[msg.scope] ?? {};
    if (!token || !sessionStorage.getItem(token)) return;
    const data: Record<string, string> = {};
    for (const k of keys) {
      const v = sessionStorage.getItem(k);
      if (v !== null) data[k] = v;
    }
    channel.postMessage({ type: 'reply', id: msg.id, scope: msg.scope, data, usedAt: lastUsedAt } satisfies Msg);
  };
}

/**
 * If this tab has no login of its own, ask the other open tabs for one and copy
 * it into this tab. Resolves true when a login was borrowed.
 */
// One borrow per scope per page load: React runs startup effects twice in development, which
// asked the server for two tab tokens and left one unused.
const inflight: Partial<Record<Scope, Promise<boolean>>> = {};

export function borrowTabSession(scope: Scope, waitMs = 250): Promise<boolean> {
  inflight[scope] ??= borrowOnce(scope, waitMs);
  return inflight[scope];
}

function borrowOnce(scope: Scope, waitMs: number): Promise<boolean> {
  const { token, keys } = SCOPE_KEYS[scope];
  if (!supported() || !openedFromThisSite() || sessionStorage.getItem(token) || sessionStorage.getItem(`${SIGNED_OUT_FLAG}_${scope}`)) {
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    const channel = new BroadcastChannel(CHANNEL);
    const id = Math.random().toString(36).slice(2);
    let best: { data: Record<string, string>; usedAt: number } | null = null;
    channel.onmessage = (e: MessageEvent<Msg>) => {
      const msg = e.data;
      if (msg?.type === 'reply' && msg.id === id && msg.scope === scope && msg.data[token]) {
        if (!best || msg.usedAt > best.usedAt) best = { data: msg.data, usedAt: msg.usedAt };
      }
    };
    channel.postMessage({ type: 'request', id, scope } satisfies Msg);
    setTimeout(async () => {
      channel.close();
      const found = best as { data: Record<string, string>; usedAt: number } | null;
      if (!found || sessionStorage.getItem(token)) { resolve(false); return; }
      // This tab's own token, so its sign-out never ends the other tab's session.
      const mine = await ownToken(found.data[token]);
      // Only copy the keys this scope owns, and never over a login this tab got meanwhile.
      if (!mine || sessionStorage.getItem(token)) { resolve(false); return; }
      for (const k of keys) if (found.data[k] !== undefined) sessionStorage.setItem(k, k === token ? mine : found.data[k]);
      resolve(true);
    }, waitMs);
  });
}

/** Signing out in a tab keeps it signed out — it won't borrow another tab's login on reload. */
export function markTabSignedOut(scope: Scope, signedOut: boolean): void {
  if (typeof window === 'undefined') return;
  if (signedOut) sessionStorage.setItem(`${SIGNED_OUT_FLAG}_${scope}`, '1');
  else sessionStorage.removeItem(`${SIGNED_OUT_FLAG}_${scope}`);
}
