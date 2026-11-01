/**
 * What the owner clicked on /for-shops (the free trial, or a plan), kept in the browser through the sign-up (which
 * ends in another tab) so the onboarding plan step starts on it. Reading is forgiving of a hand-typed address
 * (`?trial=1?`, `?plan=Pro `): a value only has to START right.
 */
const KEY = 'sutura.shopIntent';

export interface ShopIntent {
  trial: boolean;
  plan: string | null;
  cycle: 'monthly' | 'yearly';
}

/** The intent in an address bar's query string, or null when it carries none. */
export function parseShopIntent(search: string): ShopIntent | null {
  const q = new URLSearchParams(search);
  if (!q.has('trial') && !q.has('plan') && !q.has('cycle')) return null;
  return {
    trial: /^(1|true|yes)/i.test((q.get('trial') ?? '').trim()),
    plan: /^[a-z0-9-]+/i.exec((q.get('plan') ?? '').trim())?.[0].toLowerCase() ?? null,
    cycle: /^yearly/i.test((q.get('cycle') ?? '').trim()) ? 'yearly' : 'monthly',
  };
}

export function saveShopIntentFromUrl(search: string): void {
  const intent = parseShopIntent(search);
  if (!intent) return;
  try { localStorage.setItem(KEY, JSON.stringify(intent)); } catch { /* private window: the plan step just starts on its default */ }
}

export function readShopIntent(): ShopIntent | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ShopIntent) : null;
  } catch {
    return null;
  }
}

/** The address's intent when it has one, otherwise what was saved earlier. */
export function currentShopIntent(search: string): ShopIntent | null {
  return parseShopIntent(search) ?? readShopIntent();
}

export function clearShopIntent(): void {
  try { localStorage.removeItem(KEY); } catch { /* nothing to clear */ }
}
