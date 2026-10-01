// A link typed in by a shop or customer is only ever followed if it is http(s) — or has no scheme
// at all (treated as a plain web address). `javascript:`, `data:` and the like come back as "#".
export function safeHref(url: string | null | undefined): string {
  const value = (url ?? '').trim();
  if (!value) return '#';
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return '#';
  return /^\/\//.test(value) ? '#' : `https://${value}`;
}
