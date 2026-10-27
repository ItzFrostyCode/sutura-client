'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function MeasurementsRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const custId = searchParams.get('customer_id');
    if (custId) {
      router.replace(`/dashboard/customers/${custId}?tab=measurements`);
    } else {
      router.replace('/dashboard/customers');
    }
  }, [router, searchParams]);

  return (
    <div className="p-12 flex flex-col items-center justify-center gap-3 text-ink-muted">
      <Loader2 size={24} className="animate-spin text-taupe" />
      <span className="text-sm">Redirecting to Customer Records...</span>
    </div>
  );
}

export default function MeasurementsPage() {
  return (
    <Suspense fallback={null}>
      <MeasurementsRedirectContent />
    </Suspense>
  );
}
