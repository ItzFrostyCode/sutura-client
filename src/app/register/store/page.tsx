'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** The old one-big-form application. Shop sign-up now starts with a confirmed email at /signup/shop; old links land there. */
export default function RegisterStoreRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace(`/signup/shop${window.location.search}`); }, [router]);
  return null;
}
