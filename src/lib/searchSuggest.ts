import { GARMENT_CATEGORIES, GARMENTS, SERVICE_GROUPS } from './garmentTaxonomy';

/** Every word a customer is likely to search for: garment categories, their everyday names (aliases, incl. Tagalog), garments, services. */
function vocabulary(): string[] {
  const words = new Set<string>();
  const add = (w?: string | null) => {
    const v = (w ?? '').trim().toLowerCase();
    if (v.length >= 3) words.add(v);
  };
  for (const c of Object.values(GARMENT_CATEGORIES) as readonly { label: string; aliases: readonly string[] }[]) {
    add(c.label);
    c.aliases.forEach(add);
  }
  for (const g of Object.values(GARMENTS) as { label: string }[]) g.label.split(' / ').forEach(add);
  for (const s of Object.values(SERVICE_GROUPS) as { label: string }[]) add(s.label);
  return [...words];
}

let cached: string[] | null = null;

/** Edit distance (insert / delete / change one letter = 1), for spotting a typo. */
function distance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const keep = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = keep;
    }
  }
  return prev[b.length];
}

/**
 * "Did you mean …?" for a search that found nothing: the closest known garment / service word, when the search looks
 * like a misspelling of it ("barongg", "unifrom", "gowm"). Allows 1 slip for short words, 2 for longer ones. Null when
 * nothing is close enough — better no suggestion than a wrong one.
 */
export function didYouMean(query: string): string | null {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return null;
  cached ??= vocabulary();
  const allowed = q.length <= 5 ? 1 : 2;
  let best: { word: string; d: number } | null = null;
  for (const word of cached) {
    if (word === q) return null; // spelled right: nothing to correct
    // Compare against the whole word and against its first word ("barong tagalog" ↔ "barong").
    const d = Math.min(distance(q, word), distance(q, word.split(' ')[0]));
    if (d <= allowed && (!best || d < best.d)) best = { word: d === distance(q, word) ? word : word.split(' ')[0], d };
  }
  return best?.word ?? null;
}

/** A few everyday garment words to try when a search found nothing (the landing page's categories, first alias each). */
export const SUGGESTED_SEARCHES: string[] = (Object.values(GARMENT_CATEGORIES) as readonly { aliases: readonly string[] }[])
  .map((c) => c.aliases[0])
  .filter((a): a is string => Boolean(a))
  .slice(0, 8);
