/**
 * Turnaround formatting helper for Catalog Items and Services.
 * Produces the required format:
 * Clock: estimated days (exact count or day range, e.g. "Est. 5-7 days" or "Est. 3 days")
 */
export function formatEstimatedTurnaround(days: number | null | undefined): string {
  const d = days && days > 0 ? Math.round(Number(days)) : 7;
  const minDays = Math.max(1, d > 2 ? d - 2 : d);
  const maxDays = d;

  if (minDays === maxDays) {
    return `Est. ${d} ${d === 1 ? 'day' : 'days'}`;
  }

  return `Est. ${minDays}-${maxDays} days`;
}


/**
 * Services: the owner's own numbers, never guessed. "5–7 days", "5 days", or —
 * when the owner left it open — "Depends on the order".
 */
export function formatServiceTurnaround(min?: number | string | null, max?: number | string | null): string {
  const from = Number(min);
  if (!from || from < 1) return 'Depends on the order';
  const to = Number(max);
  if (to && to > from) return `${from}–${to} days`;
  return `${from} day${from === 1 ? '' : 's'}`;
}
