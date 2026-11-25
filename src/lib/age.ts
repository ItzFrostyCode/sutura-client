/**
 * Whole years from a birthday to today. Accepts "YYYY-MM-DD" or an ISO
 * timestamp from the API (only the date part is used, so no timezone shift).
 * Null when it isn't a full, plausible date.
 */
export function ageFrom(birthday: string | null | undefined): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthday ?? '');
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const today = new Date();
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < mo || (today.getMonth() + 1 === mo && today.getDate() < d)) age--;
  return age >= 0 && age < 130 ? age : null;
}
