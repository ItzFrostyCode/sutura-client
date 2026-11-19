'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';

// The storefront profile used to be a separate, differently-built page from
// the public /store/[slug] page — same data, two UIs to maintain, and owners
// had to click through "View Public Storefront" to see what a customer sees.
// /store/[slug] now renders the owner's edit controls inline when they're
// logged in as that store, so this route just forwards there instead of
// duplicating it.
export default function StoreProfileRedirect() {
  const { store } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (store?.slug) {
      // Keeps ?tour=profile (Welcome Guide → Configure now) so the tour starts on the shop page.
      router.replace(`/store/${store.slug}${window.location.search}`);
    }
  }, [store, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-taupe" size={32} />
    </div>
  );
}
