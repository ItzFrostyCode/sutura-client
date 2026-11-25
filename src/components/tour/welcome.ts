/**
 * First visit of a brand-new shop: the Home page opens on the Welcome Guide
 * (once per shop, in this browser). "New" = the shop was created in the last 30 days.
 */
const NEW_SHOP_DAYS = 30;
const seenKey = (storeId: number) => `sutura_welcome_seen:${storeId}`;

export function isNewShop(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false;
  const created = Date.parse(createdAt);
  return Number.isFinite(created) && Date.now() - created < NEW_SHOP_DAYS * 86_400_000;
}

export function shouldAutoOpenWelcome(storeId: number | undefined, createdAt: string | null | undefined): boolean {
  if (!storeId || !isNewShop(createdAt)) return false;
  try {
    return localStorage.getItem(seenKey(storeId)) !== '1';
  } catch {
    return false;
  }
}

export function markWelcomeSeen(storeId: number) {
  try { localStorage.setItem(seenKey(storeId), '1'); } catch { /* storage blocked */ }
}
