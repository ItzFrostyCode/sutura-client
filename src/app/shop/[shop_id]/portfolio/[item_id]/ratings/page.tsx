'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LegacyPortfolioRatingsRedirect({ params }: Readonly<{ params: Promise<{ shop_id: string; item_id: string }> }>) {
  const { shop_id: shopId, item_id: itemId } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/shop/${shopId}/catalog/${itemId}/ratings`);
  }, [shopId, itemId, router]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-50">
      <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
    </div>
  );
}
