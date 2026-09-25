'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LegacyPortfolioRedirect({ params }: Readonly<{ params: Promise<{ store_id: string }> }>) {
  const { store_id: storeId } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/store/${storeId}?tab=catalog`);
  }, [storeId, router]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-white">
      <Loader2 className="w-8 h-8 animate-spin text-ink-faint" />
    </div>
  );
}
