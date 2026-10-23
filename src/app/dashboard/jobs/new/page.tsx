'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import JobCreateForm from '@/components/jobs/JobCreateForm';
import { useAuthStore } from '@/store/useAuthStore';
import { useShopRole } from '@/hooks/useShopRole';

export default function NewJobOrderPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isOwnerOrManager } = useShopRole();
  // Plain staff do not make orders; they go back to the Job Orders board.
  useEffect(() => {
    if (user && !isOwnerOrManager) router.replace('/dashboard/jobs');
  }, [user, isOwnerOrManager, router]);
  if (!user || !isOwnerOrManager) return null;

  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-ink-faint animate-pulse">
          Loading form details...
        </div>
      }
    >
      <JobCreateForm />
    </Suspense>
  );
}
