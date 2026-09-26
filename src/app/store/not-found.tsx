'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// /store with no id (typo/incomplete link, not a real "store not found for
// this id" case — every real store profile lives at /store/[store_id] and
// has its own not-found handling there) used to render a blank white page,
// since neither a page.tsx nor a not-found.tsx caught it. A server-side
// redirect() called from inside a not-found boundary doesn't actually
// perform the redirect in this Next version (it renders the 404 shell but
// never sends a Location) — router.replace() in an effect does.
export default function StoreIndexNotFound() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/stores');
  }, [router]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-white">
      <Loader2 className="w-8 h-8 animate-spin text-ink-faint" />
    </div>
  );
}
