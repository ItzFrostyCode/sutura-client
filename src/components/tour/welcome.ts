import api from '@/lib/axios';

/**
 * First visit of a brand-new shop: the Home page opens on the Welcome Guide
 * once per shop. "Seen" is saved on the shop (stores.welcome_seen_at), so it
 * holds on every device; the browser flag only covers the moment between
 * opening it and the server answering. "New" = created in the last 30 days.
 */
const NEW_SHOP_DAYS = 30;
const seenKey = (storeId: number) => `sutura_welcome_seen:${storeId}`;

export function isNewShop(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false;
  const created = Date.parse(createdAt);
  return Number.isFinite(created) && Date.now() - created < NEW_SHOP_DAYS * 86_400_000;
}

export function shouldAutoOpenWelcome(
  storeId: number | undefined,
  createdAt: string | null | undefined,
  seenAt: string | null | undefined,
): boolean {
  if (!storeId || seenAt || !isNewShop(createdAt)) return false;
  try {
    return localStorage.getItem(seenKey(storeId)) !== '1';
  } catch {
    return false;
  }
}

export function markWelcomeSeen(storeId: number) {
  try { localStorage.setItem(seenKey(storeId), '1'); } catch { /* storage blocked */ }
  // Best effort: if it fails, the browser flag above still stops a repeat here.
  api.post(`/stores/${storeId}/welcome-seen`).catch(() => {});
}

/*
 * "Still waiting for an answer" for this tab. The dashboard remounts its page
 * when the branch selector settles on the main branch right after the first
 * load (layout.tsx keys the page by branch), which dropped the pop-up's open
 * state a moment after it had already been marked seen. This flag lets the
 * remounted page open it again until the owner picks Start the tour or Later.
 */
const pendingKey = (storeId: number) => `sutura_welcome_pending:${storeId}`;

export function markWelcomePending(storeId: number) {
  try { sessionStorage.setItem(pendingKey(storeId), '1'); } catch { /* storage blocked */ }
}

export function isWelcomePending(storeId: number | undefined): boolean {
  if (!storeId) return false;
  try { return sessionStorage.getItem(pendingKey(storeId)) === '1'; } catch { return false; }
}

export function clearWelcomePending(storeId: number | undefined) {
  if (!storeId) return;
  try { sessionStorage.removeItem(pendingKey(storeId)); } catch { /* storage blocked */ }
}
