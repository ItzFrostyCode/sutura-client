'use client';

import { useRouter } from 'next/navigation';

/**
 * What the X on a full-page Sign In / Create Account does: back to the SUTURA page the person came from, or home
 * when they arrived from another site or a typed link (never "back" out of SUTURA).
 */
export function useLeaveAuth() {
  const router = useRouter();
  return () => {
    let cameFromHere = false;
    try {
      cameFromHere = !!document.referrer && new URL(document.referrer).origin === window.location.origin
        && !/^\/(login|register|forgot-password|reset-password)\b/.test(new URL(document.referrer).pathname);
    } catch { /* bad referrer: go home */ }
    if (cameFromHere && window.history.length > 1) router.back();
    else router.push('/');
  };
}
