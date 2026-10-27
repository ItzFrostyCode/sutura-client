'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// "New service" is a modal on the Services page now. This route stays so old
// links (the storefront's "add service", a catalog design's "create a
// service") keep working: it opens that modal, carrying ?return= along.
function RedirectToModal() {
  const router = useRouter();
  const back = useSearchParams().get('return');
  useEffect(() => {
    const ret = back ? `&return=${encodeURIComponent(back)}` : '';
    router.replace(`/dashboard/services?add=1${ret}`);
  }, [router, back]);
  return null;
}

export default function NewServicePage() {
  return <Suspense><RedirectToModal /></Suspense>;
}
