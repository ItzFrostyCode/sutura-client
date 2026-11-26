/**
 * Shared helper to determine if a store is currently open based on its
 * operating_hours object (Record<string, { is_open: boolean; open: string; close: string }>).
 *
 * Used by the landing page, search results, and store profile to render the
 * green (open) / red (closed) status dot on the store logo.
 */
export type OperatingHours = Record<string, { is_open: boolean; open: string; close: string }>;

export function isStoreOpen(operating_hours?: OperatingHours | string | null): boolean {
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

export function getStoreStatus(operating_hours?: OperatingHours | string | null): {
  isOpen: boolean;
  label: string;
  dotClass: string;
  badgeClass: string;
} {
  const open = isStoreOpen(operating_hours);
  return {
    isOpen: open,
    label: open ? 'Open now' : 'Closed now',
    dotClass: open ? 'bg-[#22c55e]' : 'bg-[#ef4444]',
    badgeClass: open
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-rose-50 text-rose-700 border-rose-200',
  };
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** "09:00" → "9:00 AM". */
export function formatClock(hhmm: string): string {
  const [h, m = 0] = hhmm.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
}

/**
 * The line a person wants about the hours: "Closes 6:00 PM" while open, otherwise when it opens next
 * ("Opens 9:00 AM" later today, "Opens Tuesday 9:00 AM" on a later day). null when no hours are on file.
 */
export function hoursLine(operating_hours?: OperatingHours | string | null): { open: boolean; text: string; soon?: boolean } | null {
  if (!operating_hours) return null;
  let parsed: OperatingHours;
  try {
    parsed = typeof operating_hours === 'string' ? JSON.parse(operating_hours) : operating_hours;
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const minutes = (hhmm: string) => { const [h, m = 0] = hhmm.split(':').map(Number); return h * 60 + m; };

  for (let ahead = 0; ahead < 7; ahead++) {
    const day = (now.getDay() + ahead) % 7;
    const d = parsed[DAY_KEYS[day]];
    if (!d?.is_open || !d.open || !d.close) continue;
    if (ahead === 0) {
      // "soon": the last hour before closing (Google's "Closes soon"), so a customer does not walk over for nothing.
      if (nowMin >= minutes(d.open) && nowMin <= minutes(d.close)) return { open: true, text: `Closes ${formatClock(d.close)}`, soon: minutes(d.close) - nowMin <= 60 };
      if (nowMin < minutes(d.open)) return { open: false, text: `Opens ${formatClock(d.open)}`, soon: minutes(d.open) - nowMin <= 60 };
      continue; // already closed for today: look at the next open day
    }
    return { open: false, text: `Opens ${ahead === 1 ? 'tomorrow' : DAY_NAMES[day]} ${formatClock(d.open)}` };
  }
  return null;
}
