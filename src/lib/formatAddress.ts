// "Jasmin St, Ubalde, Agdao, Davao City" — street, barangay, district and city, skipping whatever is empty.
export function formatAddress(parts: { address?: string | null; barangay?: string | null; district?: string | null; city?: string | null }): string {
  return [parts.address, parts.barangay, parts.district, parts.city].map((p) => (p ?? '').trim()).filter(Boolean).join(', ');
}
