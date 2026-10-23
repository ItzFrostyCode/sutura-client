/** Standard-size rows offered in the quotation; sizes the order already has (e.g. 3XL) are added below them. */
export const SIZE_ROWS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

/** Pieces per size, typed as text so a box can be empty. */
export type SizeCounts = Record<string, string>;

const positive = (c: SizeCounts) => Object.entries(c).map(([k, v]) => [k, Math.floor(Number(v) || 0)] as const).filter(([, n]) => n > 0);

export const countsTotal = (c: SizeCounts) => positive(c).reduce((t, [, n]) => t + n, 0);

export const sizeRowKeys = (c: SizeCounts) => [...SIZE_ROWS, ...Object.keys(c).filter((k) => !SIZE_ROWS.includes(k))];

/** The order's sizes as they stand: its size_breakdown, else its single standard size for all pieces, else none (custom measurements). */
export function readCounts(data: Record<string, unknown>, pieces: number): SizeCounts {
  const sb = data.size_breakdown;
  if (sb && typeof sb === 'object') {
    const out: SizeCounts = {};
    for (const [k, v] of Object.entries(sb as Record<string, unknown>)) if (Number(v) > 0) out[k] = String(Number(v));
    if (Object.keys(out).length > 0) return out;
  }
  const std = typeof data.standard_size === 'string' ? data.standard_size.trim() : '';
  return std && std !== 'Custom Measurements' ? { [std]: String(pieces) } : {};
}

/** The text kept as the order's standard size: "M" for one size, "M × 10, L × 10" for several. */
export function sizeSummary(c: SizeCounts): string {
  const rows = positive(c);
  return rows.length === 1 ? rows[0][0] : rows.map(([k, n]) => `${k} × ${n}`).join(', ');
}

/** A comparable form of the counts (empty boxes and zeros left out). */
export const countsKey = (c: SizeCounts) => JSON.stringify(positive(c).sort(([a], [b]) => a.localeCompare(b)));

export const positiveCounts = (c: SizeCounts): Record<string, number> => Object.fromEntries(positive(c));
