'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LegacyDashboardPortfolioEditRedirect({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/dashboard/catalog/${id}/edit`);
  }, [id, router]);

  return (
    <div className="py-24 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-taupe" />
    </div>
  );
}
