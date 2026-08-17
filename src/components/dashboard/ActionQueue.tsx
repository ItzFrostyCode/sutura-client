'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, ChevronDown, ChevronRight, Clock, CreditCard,
  PackageCheck, PauseCircle, Zap, CalendarCheck, type LucideIcon,
} from 'lucide-react';
import { AnalyticsData, JobItem } from './dashboardHelpers';

interface ActionQueueProps {
  readonly data: AnalyticsData | null;
  readonly unpaidJobs: JobItem[];
  readonly pendingDpJobs: JobItem[];
  readonly dueToday: JobItem[];
  readonly dueThisWeek: JobItem[];
}

type Severity = 'critical' | 'money' | 'ready';

/** Left-rail + figure color per severity. Three semantic tones drawn from the
 *  locked palette — replacing the six unrelated pastels (red/amber/emerald/
 *  violet/orange/slate) the old Needs Attention grid used, which gave six
 *  different problems six different visual languages and no priority order. */
const TONE: Record<Severity, { rail: string; figure: string; icon: string }> = {
  critical: { rail: 'bg-danger',       figure: 'text-danger', icon: 'bg-danger/10 text-danger' },
  money:    { rail: 'bg-taupe',        figure: 'text-ink',    icon: 'bg-taupe/10 text-taupe' },
  ready:    { rail: 'bg-sage',         figure: 'text-sage',   icon: 'bg-sage/10 text-sage' },
};

interface QueueRow {
  id: string;
  severity: Severity;
  count: number;
  label: string;
  sub: string;
  icon: LucideIcon;
  href?: string;
  /** Rows carrying real per-job detail expand in place instead of navigating. */
  detail?: JobItem[];
  detailKind?: 'balance' | 'deposit' | 'deadline';
}

const peso = (v?: number | string | null) => {
  const num = typeof v === 'number' ? v : Number.parseFloat(String(v || 0));
  return `₱${(Number.isFinite(num) ? num : 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * One prioritized queue of everything wanting attention, replacing three
 * separate systems that used to compete on the same screen (a six-card pastel
 * grid + two full-width amber accordions). Ordered by urgency, single surface,
 * hairline-divided — a shop owner works top-down instead of triaging colors.
 *
 * Now also absorbs the Deadlines section (Due Today / Due This Week) as queue
 * rows, eliminating a redundant standalone section.
 */
export default function ActionQueue({ data, unpaidJobs, pendingDpJobs, dueToday, dueThisWeek }: ActionQueueProps) {
  const [openRow, setOpenRow] = useState<string | null>(null);

  const unpaidTotal = unpaidJobs.reduce((sum, j) => sum + Number.parseFloat(String(j.balance || '0')), 0);

  const rows: QueueRow[] = ([
    {
      id: 'overdue',
      severity: 'critical',
      count: data?.overdue_jobs ?? 0,
      label: 'Overdue orders',
      sub: 'Past due date, still in production',
      icon: AlertTriangle,
      href: '/dashboard/jobs?overdue=true',
    },
    {
      id: 'due_today',
      severity: 'critical',
      count: dueToday.length,
      label: 'Due today',
      sub: 'Orders that need to ship or be ready today',
      icon: Clock,
      detail: dueToday,
      detailKind: 'deadline',
    },
    {
      id: 'balances',
      severity: 'money',
      count: unpaidJobs.length,
      label: 'Completed, still unpaid',
      sub: `${peso(unpaidTotal)} uncollected on finished work`,
      icon: CreditCard,
      detail: unpaidJobs,
      detailKind: 'balance',
    },
    {
      // The old "Pending Deposits" card duplicated this exact fact from a
      // looser backend query (pending_deposit_jobs) — same shop state, two
      // places, two styles. This list-backed one is the stricter, actionable
      // version, so the card is gone and only this remains.
      id: 'deposits',
      severity: 'money',
      count: pendingDpJobs.length,
      label: 'Awaiting downpayment',
      sub: 'Shop policy: 50% DP before cutting starts',
      icon: CreditCard,
      detail: pendingDpJobs,
      detailKind: 'deposit',
    },
    {
      id: 'due_this_week',
      severity: 'money',
      count: dueThisWeek.length,
      label: 'Due this week',
      sub: 'Upcoming deadlines within the next 7 days',
      icon: CalendarCheck,
      detail: dueThisWeek.slice(0, 5),
      detailKind: 'deadline',
    },
    {
      id: 'unclaimed',
      severity: 'critical',
      count: data?.unclaimed_pickups?.length ?? 0,
      label: 'Unclaimed pickups',
      sub: 'Ready 14+ days, not yet collected',
      icon: Clock,
      href: '/dashboard/reports',
    },
    {
      id: 'on_hold',
      severity: 'critical',
      count: data?.jobs_on_hold?.length ?? 0,
      label: 'Jobs on hold',
      sub: 'Paused 7+ days',
      icon: PauseCircle,
      href: '/dashboard/reports',
    },
    {
      id: 'rush',
      severity: 'money',
      count: data?.rush_jobs_active ?? 0,
      label: 'Active rush orders',
      sub: 'Expedited priority production',
      icon: Zap,
      href: '/dashboard/jobs',
    },
    {
      id: 'pickup',
      severity: 'ready',
      count: data?.ready_for_pickup_jobs ?? 0,
      label: 'Ready for pickup',
      sub: 'Finished, waiting on the customer',
      icon: PackageCheck,
      href: '/dashboard/jobs',
    },
  ] satisfies QueueRow[]).filter(r => r.count > 0);

  if (rows.length === 0) {
    return (
      <section>
        <h2 className="text-eyebrow-accent mb-3">Action Queue</h2>
        <div className="bg-surface border border-line rounded-xl px-5 py-8 text-center">
          <p className="text-sm font-medium text-ink">Nothing needs attention right now.</p>
          <p className="text-xs text-ink-faint mt-1">Overdue jobs, unpaid balances, deadlines, and aging pickups will appear here.</p>
        </div>
      </section>
    );
  }

  const renderRowInner = (row: QueueRow) => {
    const tone = TONE[row.severity];
    const Icon = row.icon;
    return (
      <>
        <span aria-hidden className={`absolute left-0 inset-y-0 w-0.5 ${tone.rail}`} />
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tone.icon}`}>
          <Icon size={16} />
        </div>
        <span className={`text-figure text-2xl font-bold tabular-nums w-10 shrink-0 text-left ${tone.figure}`}>
          {row.count}
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-sm font-semibold text-ink truncate">{row.label}</span>
          <span className="block text-xs text-ink-faint truncate">{row.sub}</span>
        </span>
      </>
    );
  };

  return (
    <section>
      <h2 className="text-eyebrow-accent mb-3">Action Queue</h2>
      <div className="bg-surface border border-line rounded-xl divide-y divide-line overflow-hidden">
        {rows.map(row => {
          const expandable = !!row.detail?.length;
          const isOpen = openRow === row.id;

          if (!expandable) {
            return (
              <Link
                key={row.id}
                href={row.href ?? '#'}
                className="relative flex items-center gap-3.5 px-4 sm:px-5 py-3.5 hover:bg-canvas transition-colors min-h-[44px]"
              >
                {renderRowInner(row)}
                <ChevronRight size={16} className="text-ink-faint shrink-0" />
              </Link>
            );
          }

          return (
            <div key={row.id}>
              <button
                type="button"
                onClick={() => setOpenRow(isOpen ? null : row.id)}
                aria-expanded={isOpen}
                className="relative w-full flex items-center gap-3.5 px-4 sm:px-5 py-3.5 hover:bg-canvas transition-colors min-h-[44px]"
              >
                {renderRowInner(row)}
                <ChevronDown size={16} className={`text-ink-faint shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="bg-canvas border-t border-line divide-y divide-line">
                  {row.detail!.slice(0, 8).map(j => (
                    <div key={j.id} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{j.customer?.name || 'Walk-in'}</p>
                        <p className="text-xs text-ink-faint truncate">
                          {j.order_number || `#${j.id}`}
                          {row.detailKind === 'deposit' && ` · ${peso(j.total_amount)} total`}
                          {row.detailKind === 'deadline' && j.due_date && ` · Due ${new Date(j.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}`}
                        </p>
                      </div>
                      {(() => {
                        if (row.detailKind === 'balance') {
                          return (
                            <Link
                              href={`/dashboard/jobs/${j.id}`}
                              className="text-sm font-semibold text-ink tabular-nums shrink-0 hover:text-taupe transition-colors"
                            >
                              {peso(j.balance)}
                            </Link>
                          );
                        }
                        if (row.detailKind === 'deposit') {
                          return (
                            <Link
                              href={`/dashboard/jobs/${j.id}#financials`}
                              className="text-xs font-semibold text-white bg-taupe hover:bg-taupe-hover px-3 py-2 rounded-lg transition-colors shrink-0 min-h-[36px] flex items-center"
                            >
                              Log DP
                            </Link>
                          );
                        }
                        return (
                          <Link
                            href={`/dashboard/jobs/${j.id}`}
                            className="text-xs font-semibold text-taupe hover:underline shrink-0"
                          >
                            View →
                          </Link>
                        );
                      })()}
                    </div>
                  ))}
                  {row.detail!.length > 8 && (
                    <p className="px-5 py-2.5 text-xs text-ink-faint text-center">
                      +{row.detail!.length - 8} more —{' '}
                      <Link href={row.detailKind === 'deadline' ? '/dashboard/jobs' : '/dashboard/payments'} className="text-taupe font-semibold hover:underline">View all</Link>
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
