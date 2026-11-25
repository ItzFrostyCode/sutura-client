// "Jasmin St, Ubalde, Agdao, Davao City" — street, barangay, district and city, skipping whatever is empty.
// A part already written into the street line ("50 San Pedro St, Poblacion District, Davao City")
// isn't repeated, so owners who typed the full address don't get "…Davao City, Poblacion, Davao City".
// New shops already store the full "Street, Barangay, City, District, Province" in `address`
// (picked from PSGC), so the extra parts are skipped there and nothing repeats.
export function formatAddress(parts: { address?: string | null; barangay?: string | null; district?: string | null; city?: string | null; province?: string | null }): string {
  const out: string[] = [];
  for (const raw of [parts.address, parts.barangay, parts.district, parts.city, parts.province]) {
    const part = (raw ?? '').trim();
    if (!part) continue;
    const already = out.join(', ').toLowerCase();
    if (already.includes(part.toLowerCase())) continue;
    out.push(part);
  }
  return out.join(', ');
}
