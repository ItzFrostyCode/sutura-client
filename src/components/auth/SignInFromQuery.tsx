'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLoginModalStore } from '@/store/useLoginModalStore';

function Opener() {
  const params = useSearchParams();
  const open = useLoginModalStore((s) => s.open);
  const signin = params.get('signin');
  const redirect = params.get('redirect');
  const asStore = params.get('as') === 'store';
  const add = params.get('add') === '1';

  // Runs on every navigation, not just the first load: "Book an Appointment" reaches this page
  // by a client-side redirect, and the layout (which holds this) is never remounted for that.
  useEffect(() => {
    if (signin !== '1') return;
    const url = new URL(window.location.href);
    url.searchParams.delete('signin');
    url.searchParams.delete('redirect');
    url.searchParams.delete('as');
    url.searchParams.delete('add');
    window.history.replaceState(null, '', url.pathname + url.search);
    if (window.innerWidth >= 600) open(redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : null, { portal: asStore ? 'store' : 'customer', addAccount: add });
  }, [signin, redirect, asStore, add, open]);
  return null;
}

// A guest sent to a page with ?signin=1&redirect=… (e.g. from "Book an Appointment") gets the
// Sign In modal over that real page on tablet/desktop; after signing in they continue to `redirect`.
export default function SignInFromQuery() {
  return (
    <Suspense fallback={null}>
      <Opener />
    </Suspense>
  );
}
