'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LegacyPortfolioRatingsRedirect({ params }: Readonly<{ params: Promise<{ store_id: string; item_id: string }> }>) {
  const { store_id: storeId, item_id: itemId } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/store/${storeId}/catalog/${itemId}/ratings`);
  }, [storeId, itemId, router]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-50">
      <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
    </div>
  );
}
