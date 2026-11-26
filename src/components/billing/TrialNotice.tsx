'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, PauseCircle } from 'lucide-react';
import api from '@/lib/axios';

export interface Sub { status: string; ends_at: string | null; trial_ends_at?: string | null; cancelled_at?: string | null; plan?: { name?: string | null; slug?: string | null } | null }

const day = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' });

/** Whole days left until `iso` (0 on the last day). */
export const daysLeft = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));

/**
 * The free-trial line shown across the owner's dashboard: days left while the trial runs, and
 * "paused" once it ran out unpaid (shop hidden from customers, records kept, current orders
 * still workable). Nothing for a paid plan.
 */
export function TrialBanner({ sub, showLink = true }: { readonly sub: Sub | null; readonly showLink?: boolean }) {
  if (!sub?.trial_ends_at) return null;

  if (sub.status === 'trial' && sub.ends_at) {
    const left = daysLeft(sub.ends_at);
    return (
      <div role="status" className="flex flex-col gap-3 rounded-lg border-2 border-orange-400 bg-orange-100 px-4 py-3.5 text-sm text-ink sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2.5">
          <Clock size={18} className="mt-0.5 shrink-0 text-orange-800" aria-hidden="true" />
          <span>
            {/* Says which plan is on trial (any plan can be tried), so the owner knows what they have. */}
            <strong className="font-semibold">
              Free trial{sub.plan?.name ? ` of ${sub.plan.name}` : ''}: {left === 0 ? 'last day' : `${left} day${left === 1 ? '' : 's'} left`}.
            </strong>{' '}
            {sub.plan?.name ? `You have every ${sub.plan.name} feature until ${day(sub.ends_at)}. ` : ''}
            Choose a plan before {day(sub.ends_at)} to keep your shop open.
          </span>
        </p>
        {showLink && (
          <Link href="/dashboard/billing" className="inline-flex min-h-11 shrink-0 items-center self-start rounded-full bg-orange-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-orange-700 sm:self-auto">
            Choose a Plan
          </Link>
        )}
      </div>
    );
  }

  if (sub.status === 'expired') {
    return (
      <div role="alert" className="flex flex-col gap-2 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2">
          <PauseCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            <strong className="font-semibold">Your free trial has ended, so your shop is paused.</strong>{' '}
            Customers can&apos;t find or book it, and the shop is read-only: all your records are kept and viewable, but nothing
            new or changed. Choose a plan to open it again.
          </span>
        </p>
        {showLink && (
          <Link href="/dashboard/billing" className="inline-flex min-h-10 shrink-0 items-center self-start border border-red-300 bg-white px-3 text-xs font-semibold hover:bg-red-100 sm:self-auto">
            Choose a plan
          </Link>
        )}
      </div>
    );
  }

  return null;
}

/** The store's latest subscription, for the dashboard-wide trial line (owners only). */
export function useLatestSubscription(storeId: number | undefined, enabled: boolean) {
  const [sub, setSub] = useState<Sub | null>(null);
  useEffect(() => {
    if (!storeId || !enabled) return;
    let alive = true;
    api.get(`/stores/${storeId}/subscription`)
      .then((res) => { if (alive) setSub(res.data.data ?? null); })
      .catch(() => { /* the line is a hint; Billing has the full picture */ });
    return () => { alive = false; };
  }, [storeId, enabled]);
  return sub;
}
