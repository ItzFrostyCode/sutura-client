// Picking the right search hit for a typed address.
//
// A long street ("San Pedro Street") is split by barangay in the map data, so
// the street name alone matches several places. The parts typed after it —
// barangay, district — say which one is meant. City / province parts add
// nothing (every search is already biased to Davao City) and are ignored.

export interface PlaceHit {
  lat: number;
  lng: number;
  display_name: string;
}

/** "A. Pichon St" vs "A. Pichon Street": same place once abbreviations and punctuation are evened out. */
export function normalizePlaceName(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,'’]/g, ' ')
    .replace(/\bst\b/g, 'street')
    .replace(/\bave?\b/g, 'avenue')
    .replace(/\bblvd\b/g, 'boulevard')
    .replace(/\brd\b/g, 'road')
    .replace(/\bext\b/g, 'extension')
    .replace(/\bbrgy\b/g, 'barangay')
    .replace(/\s+/g, ' ')
    .trim();
}

export function samePlaceName(resultName: string, typed: string): boolean {
  // Spaces dropped too, so initials match however they're written ("J.P." / "JP").
  const a = normalizePlaceName(resultName).replace(/ /g, '');
  const b = normalizePlaceName(typed).replace(/ /g, '');
  return a.length > 0 && b.length > 0 && a === b;
}

/** More than ~300 m apart: different places, not two map pieces of the same spot. */
function farApart(a: PlaceHit, b: PlaceHit): boolean {
  return Math.abs(a.lat - b.lat) > 0.003 || Math.abs(a.lng - b.lng) > 0.003;
}

const GENERIC_PART = /^(davao( city| del sur)?|philippines|ph|\d{4})$/;

/** The parts after the street that narrow it down: "Barangay 38-D", "Poblacion". */
export function addressQualifiers(typed: string): string[] {
  return typed
    .split(',')
    .slice(1)
    .map((p) => normalizePlaceName(p).replace(/\s+district$/, '').trim())
    .filter((p) => p.length > 0 && !GENERIC_PART.test(p));
}

/**
 * Ranks search hits for a typed address: same street/place name first, then
 * how many of the typed barangay/district parts the hit is in. `confident`
 * means the best hit matches the name AND every typed part — safe to jump
 * straight there; otherwise the caller should let the user choose.
 */
export function rankAddressHits<T extends PlaceHit>(hits: T[], typed: string): { ranked: T[]; confident: boolean } {
  const first = typed.split(',')[0].trim();
  const qualifiers = addressQualifiers(typed);

  // Same spot found by both searches: keep one.
  const seen = new Set<string>();
  const unique = hits.filter((h) => {
    const key = `${normalizePlaceName(h.display_name)}@${h.lat.toFixed(4)},${h.lng.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const scored = unique.map((h, i) => {
    const name = h.display_name.split(',')[0];
    const where = normalizePlaceName(h.display_name.split(',').slice(1).join(','));
    const nameMatch = samePlaceName(name, first);
    const matched = qualifiers.filter((q) => where.includes(q)).length;
    return { h, i, nameMatch, matched };
  });

  scored.sort((a, b) =>
    Number(b.nameMatch) - Number(a.nameMatch) || b.matched - a.matched || a.i - b.i,
  );

  const top = scored[0];
  // Two equally good matches in different places (e.g. "San Pedro Street"
  // with no barangay: one in Poblacion, one in Agdao) — ask, don't guess.
  const rival = scored.slice(1).find((s) =>
    s.nameMatch === top?.nameMatch && s.matched === top?.matched && farApart(s.h, top.h),
  );
  const confident = Boolean(top && top.nameMatch && top.matched === qualifiers.length && !rival);
  return { ranked: scored.map((s) => s.h), confident };
}
