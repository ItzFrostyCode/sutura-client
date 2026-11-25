'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { useShopReadOnly } from '@/hooks/useShopReadOnly';

/**
 * Dashboard-wide line when the shop has no running plan: it is read-only for
 * everyone (server: CheckRole refuses changes, Billing and Support excepted).
 * Owners get a link to Billing; staff are told to ask the owner. An owner whose
 * free trial ran out already sees TrialBanner's own "paused" line, so it's skipped.
 */
export default function ReadOnlyShopBanner({ storeId, isOwner }: Readonly<{ storeId: number | undefined; isOwner: boolean }>) {
  const { readOnly, sub } = useShopReadOnly(storeId);
  const trialBannerCovers = isOwner && Boolean(sub?.trial_ends_at) && sub?.status === 'expired';

  if (!readOnly || trialBannerCovers) return null;
  return (
    <div role="alert" className="mb-4 flex flex-col gap-2 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 print:hidden sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2">
        <Lock size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          <strong className="font-semibold">This shop is read-only: its plan has ended.</strong>{' '}
          {isOwner
            ? 'All records are kept and you can view and export them, but nothing new or changed until you choose a plan.'
            : 'You can view records, but not add or change anything. Ask the shop owner to renew the plan.'}
        </span>
      </p>
      {isOwner && (
        <Link href="/dashboard/billing" className="inline-flex min-h-10 shrink-0 items-center self-start border border-red-300 bg-white px-3 text-xs font-semibold hover:bg-red-100 sm:self-auto">
          Choose a plan
        </Link>
      )}
    </div>
  );
}
