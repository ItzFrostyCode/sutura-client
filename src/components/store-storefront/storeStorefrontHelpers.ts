export function formatTime12h(timeStr?: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = Number.parseInt(hStr, 10);
  if (Number.isNaN(h)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  const minute = mStr ? `:${mStr}` : ':00';
  return `${hour12}${minute} ${period}`;
}

export function getSocialUrl(
  links: { label: string; url: string }[] | undefined,
  keyword: string
): string | undefined {
  return links?.find((l) => l.label?.toLowerCase().includes(keyword))?.url;
}

export function getMessengerUrl(facebookUrl?: string): string {
  if (!facebookUrl) return 'https://m.me/suturatailoring';
  try {
    const url = new URL(facebookUrl);
    const pathname = url.pathname.replace(/^\/|\/$/g, '');
    if (pathname && !pathname.includes('/') && pathname !== 'profile.php') {
      return `https://m.me/${pathname}`;
    }
  } catch {
    // Ignore URL parse error
  }
  return 'https://m.me/suturatailoring';
}
