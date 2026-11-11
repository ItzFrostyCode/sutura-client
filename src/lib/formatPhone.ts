/**
 * A Philippine number as people read and say it: "+639171234567" or "09171234567" → "0917 123 4567";
 * a landline or anything else is returned as typed.
 */
export function formatPhone(raw: string | null | undefined): string {
  const text = String(raw ?? '').trim();
  const digits = text.replace(/\D/g, '');
  const mobile = digits.startsWith('63') && digits.length === 12 ? `0${digits.slice(2)}` : digits;
  if (/^09\d{9}$/.test(mobile)) return `${mobile.slice(0, 4)} ${mobile.slice(4, 7)} ${mobile.slice(7)}`;
  return text;
}
