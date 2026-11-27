'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, PauseCircle } from 'lucide-react';
import api from '@/lib/axios';

interface Sub { status: string; ends_at: string | null; trial_ends_at?: string | null }

const day = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', timeZone: 'Asia/Manila' });

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
    // Calm while there's time (the old solid orange strained eyes); a warmer
    // tint in the last 3 days so it still stands out when it matters.
    const urgent = left <= 3;
    return (
      <div
        role="status"
        className={`flex flex-col gap-3 rounded-lg border px-4 py-3.5 text-sm text-ink-body shadow-[0_1px_3px_rgba(45,42,38,0.06)] sm:flex-row sm:items-center sm:justify-between ${
          urgent ? 'border-amber-300 bg-amber-50' : 'border-line-strong bg-surface'
        }`}
      >
        <p className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
            <Clock size={18} aria-hidden="true" />
          </span>
          <span>
            <strong className="font-semibold text-ink">Free trial: {left === 0 ? 'last day' : `${left} day${left === 1 ? '' : 's'} left`}.</strong>{' '}
            Choose a plan before {day(sub.ends_at)} to keep your shop open.
          </span>
        </p>
        {showLink && (
          <Link href="/dashboard/billing" className="inline-flex min-h-11 shrink-0 items-center self-start rounded-full bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:self-auto">
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
