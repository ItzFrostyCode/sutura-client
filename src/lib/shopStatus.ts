/**
 * Shared helper to determine if a shop is currently open based on its
 * operating_hours object (Record<string, { is_open: boolean; open: string; close: string }>).
 *
 * Used by the landing page, search results, and shop profile to render the
 * green (open) / red (closed) status dot on the shop logo.
 */
export type OperatingHours = Record<string, { is_open: boolean; open: string; close: string }>;

export function isShopOpen(operating_hours?: OperatingHours | string | null): boolean {
  if (!operating_hours) return false;

  let parsed: OperatingHours;
  if (typeof operating_hours === 'string') {
    try {
      parsed = JSON.parse(operating_hours);
    } catch {
      return false;
    }
  } else {
    parsed = operating_hours;
  }

  if (!parsed || typeof parsed !== 'object') return false;

  const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  const todayData = parsed[DAY_KEYS[now.getDay()]];
  if (!todayData?.is_open || !todayData.open || !todayData.close) return false;
  const [openH, openM = 0] = todayData.open.split(':').map(Number);
  const [closeH, closeM = 0] = todayData.close.split(':').map(Number);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= openH * 60 + openM && nowMin <= closeH * 60 + closeM;
}

export function getShopStatus(operating_hours?: OperatingHours | string | null): {
  isOpen: boolean;
  label: string;
  dotClass: string;
  badgeClass: string;
} {
  const open = isShopOpen(operating_hours);
  return {
    isOpen: open,
    label: open ? 'Online · Open' : 'Offline · Closed',
    dotClass: open ? 'bg-[#22c55e]' : 'bg-[#ef4444]',
    badgeClass: open
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-rose-50 text-rose-700 border-rose-200',
  };
}
