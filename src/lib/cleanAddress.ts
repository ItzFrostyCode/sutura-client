/**
 * An address with every place named once: "Jasmin St, Ubalde, Agdao, Davao City, Ubalde, City of Davao, Agdao" →
 * "Jasmin St, Ubalde, Agdao, Davao City". Parts are compared without case, and "City of X" counts as "X City".
 * Some saved addresses already hold the barangay / city / district that is then added again from their own fields.
 */
export function cleanAddress(...parts: ReadonlyArray<string | null | undefined>): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const piece of parts.flatMap((p) => (p ?? '').split(','))) {
    const text = piece.trim().replace(/\s+/g, ' ');
    if (!text) continue;
    const key = text.toLowerCase().replace(/^city of\s+(.+)$/, '$1 city');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out.join(', ');
}
