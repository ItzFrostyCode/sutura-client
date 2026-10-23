export const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  gcash: 'GCash',
  paymaya: 'Maya',
  bank_transfer: 'Bank transfer',
  other: 'Other',
};

export const TYPE_LABELS: Record<string, string> = { deposit: 'Deposit', partial: 'Partial', full: 'Full', balance: 'Balance' };

export const num = (v: string | number | null | undefined) => Number.parseFloat(String(v ?? 0)) || 0;

/** Plain "PHP" prefix: the peso sign is missing from some thermal-printer fonts. */
export const money = (n: number) => `PHP ${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** "Oct 22, 2026 3:15 PM" */
export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }).toUpperCase();
  return `${day} ${time}`;
}

export const FULFILLMENT_LABELS: Record<string, string> = { pickup: 'Pickup', delivery: 'Delivery', shipping: 'Shipping' };

/** "Oct 26, 2026". A bare YYYY-MM-DD is read as a local date so it never slips a day. */
export function fmtDate(value: string): string {
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}
