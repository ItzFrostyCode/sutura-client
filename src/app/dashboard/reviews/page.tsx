'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';

// Review management (reply/feature/delete) moved to the storefront's Reviews
// tab, so it's the same list and the same actions whether a customer or the
// owner is looking at it — this route just forwards there now.
export default function DashboardReviewsRedirect() {
  const { store } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (store?.slug) {
      router.replace(`/store/${store.slug}?tab=reviews`);
    }
  }, [store, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-taupe" size={32} />
    </div>
  );
}
