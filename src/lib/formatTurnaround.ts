// "5–7 days" when the design has a range, "7 days" for a single estimate.
export function formatTurnaround(min?: number | string | null, max?: number | string | null): string {
  const from = Number(min ?? 7) || 7;
  const to = max == null || max === '' ? null : Number(max);
  if (to && to > from) return `${from}–${to} days`;
  return `${from} day${from === 1 ? '' : 's'}`;
}
