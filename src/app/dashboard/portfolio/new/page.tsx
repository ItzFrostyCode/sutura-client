'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LegacyDashboardPortfolioNewRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/catalog/new');
  }, [router]);

  return (
    <div className="py-24 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-taupe" />
    </div>
  );
}
