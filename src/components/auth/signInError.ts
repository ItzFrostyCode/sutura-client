/** One wording for every failed sign-in / password request: offline, too many tries, server down, or the server's own reason. */
export function signInError(err: unknown, fallback = 'Incorrect email or password.'): string {
  const res = (err as { response?: { status?: number; data?: { message?: string } } }).response;
  if (!res) return 'Can’t reach SUTURA. Check your internet connection and try again.';
  if (res.status === 429) return 'Too many tries. Please wait a minute, then try again.';
  if (res.status && res.status >= 500) return 'SUTURA is having trouble right now. Please try again in a few moments.';
  return res.data?.message || fallback;
}
