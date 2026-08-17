import React from 'react';
import Link from 'next/link';
import {
  TrendingUp, Wallet, PackageCheck, Calendar as CalendarIcon,
  Users, Target, DollarSign, AlertTriangle, BarChart2, Flag, PackageX, Timer, Star, CalendarCheck,
} from 'lucide-react';
import { AnalyticsData } from './reportHelpers';

interface ReportKpiCardsProps {
  readonly data: AnalyticsData | null;
  readonly completionRate: number;
  readonly period?: string;
}

const REVENUE_PERIOD_LABELS: Record<string, string> = {
  all_time: 'Lifetime collected',
  this_month: "This month's collections",
  last_month: "Last month's collections",
  ytd: "This year's collections",
};

export default function ReportKpiCards({ data, completionRate, period = 'all_time' }: ReportKpiCardsProps) {
  const backendRate = data?.completion_rate ?? completionRate;
  // Total Revenue is computed off the same date-filtered query as every
  // other period-scoped KPI on this page — "Lifetime collected" was
  // accurate only for the all_time default and silently wrong the moment
  // an owner picked "This Month"/"Last Month"/"Year to Date".
  const revenueSub = REVENUE_PERIOD_LABELS[period] ?? REVENUE_PERIOD_LABELS.all_time;

  // Three semantic tones, not thirteen decorative ones. Colour here means
  // something — sage is money actually collected or a healthy rate, danger is
  // a real problem, neutral is everything else. The old grid gave six
  // unrelated hues to thirteen cards, so hue carried no information at all.
  const TONE: Record<'neutral' | 'good' | 'bad' | 'idle', string> = {
    neutral: 'text-taupe bg-taupe/10 border-taupe/20',
    good:    'text-sage bg-sage/10 border-sage/20',
    bad:     'text-danger bg-danger/10 border-danger/20',
    idle:    'text-ink-faint bg-sunken border-line',
  };

  const overdueColor = data?.overdue_jobs ? TONE.bad : TONE.idle;

  let completionColor = TONE.bad;
  if (backendRate >= 80) {
    completionColor = TONE.good;
  } else if (backendRate >= 50) {
    completionColor = TONE.neutral;
  }

  const kpis = [
    {
      label: 'Today\'s Revenue',
      value: `₱${Number(data?.today_revenue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      sub: 'Payments collected today',
      icon: <DollarSign size={20} />,
      color: TONE.good,
    },
    {
      label: 'Outstanding Balance',
      value: `₱${Number(data?.total_outstanding_balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      sub: 'Unpaid from clients',
      icon: <Wallet size={20} />,
      color: TONE.neutral,
    },
    {
      label: 'Avg. Order Value',
      value: `₱${Number(data?.avg_order_value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      sub: 'Per completed order',
      icon: <BarChart2 size={20} />,
      color: TONE.neutral,
    },
    {
      label: 'Completed Orders',
      value: `${data?.completed_jobs || 0} / ${data?.total_jobs || 0}`,
      sub: `${backendRate}% completion rate`,
      icon: <PackageCheck size={20} />,
      color: TONE.neutral,
    },
    {
      // How long a job actually takes from creation to completion — real
      // operational signal ("are we hitting our own turnaround promises")
      // nothing on Reports tracked before this. Approximated from
      // updated_at since job_orders has no dedicated completed_at column.
      label: 'Avg. Turnaround Time',
      value: data?.avg_turnaround_days != null ? `${data.avg_turnaround_days}d` : '—',
      sub: 'Days from order to completion',
      icon: <Timer size={20} />,
      color: TONE.neutral,
    },
    {
      label: 'Rejected Payments',
      value: `₱${Number(data?.rejected_payments_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      sub: 'Flagged as fake, balance reversed',
      icon: <Flag size={20} />,
      color: Number(data?.rejected_payments_amount || 0) > 0 ? TONE.bad : TONE.idle,
    },
    {
      label: 'Forfeited Deposits',
      value: `₱${Number(data?.forfeited_deposit_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      sub: 'Kept from abandoned orders',
      icon: <PackageX size={20} />,
      color: Number(data?.forfeited_deposit_amount || 0) > 0 ? TONE.bad : TONE.idle,
    },
    {
      label: 'Overdue Orders',
      value: data?.overdue_jobs ?? 0,
      sub: 'Past due, not completed — click to view',
      icon: <AlertTriangle size={20} />,
      color: overdueColor,
      href: '/dashboard/jobs?overdue=true',
    },
    {
      label: 'Upcoming Appointments',
      value: data?.upcoming_appointments || 0,
      sub: 'Confirmed & scheduled',
      icon: <CalendarIcon size={20} />,
      color: TONE.neutral,
    },
    {
      // How many bookings actually turn into paying work — the core
      // "discover a shop, book, order" funnel this thesis is built around,
      // and previously had zero visibility (outcome only got set through a
      // separate manual modal nobody consistently used).
      label: 'Booking Conversion',
      value: `${data?.booking_conversion_rate ?? 0}%`,
      sub: 'Appointments that became a job order',
      icon: <CalendarCheck size={20} />,
      color: TONE.neutral,
    },
    {
      label: 'Active Staff',
      value: data?.total_staff || 0,
      sub: 'Current workforce',
      icon: <Users size={20} />,
      color: TONE.neutral,
    },
    {
      label: 'Completion Rate',
      value: `${backendRate}%`,
      sub: 'Orders finished',
      icon: <Target size={20} />,
      color: completionColor,
    },
    {
      // Reports previously had zero visibility into ratings at all — an
      // owner had to go count reviews manually on the Reviews page.
      label: 'Customer Rating',
      value: data?.avg_rating != null ? `${data.avg_rating} ★` : '—',
      // All-time on purpose (a standing reputation figure, not a per-period
      // one — see AnalyticsController's own reasoning) — unlike every other
      // card here, this one doesn't move when the period filter above
      // changes, so it says so explicitly instead of silently reading like
      // it's scoped to "This Week"/"This Month" the way the rest are.
      sub: data?.total_reviews ? `All-time, from ${data.total_reviews} review${data.total_reviews === 1 ? '' : 's'} — click to view` : 'No reviews yet',
      icon: <Star size={20} />,
      color: data?.avg_rating != null && data.avg_rating >= 4 ? TONE.good : TONE.neutral,
      href: '/dashboard/reviews',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Total Revenue is the one number that matters most on a reports
          page — was sitting at the exact same visual weight as "Forfeited
          Deposits," among 13 identical cards with no hierarchy at all. */}
      <div className="bg-taupe rounded-xl p-6 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70 flex items-center gap-1.5">
          <TrendingUp size={12} /> Total Revenue
        </p>
        <p className="text-figure text-4xl sm:text-5xl font-bold mt-3 break-words">
          ₱{Number(data?.total_revenue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-white/70 mt-2">{revenueSub}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpis.map((kpi) => {
        const cardClass = 'bg-surface border border-line rounded-xl p-5 flex items-start justify-between gap-3 hover:border-line-strong transition-colors';
        const content = (
          <>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted mb-1.5">{kpi.label}</p>
              <h3 className="text-figure text-2xl font-semibold text-ink mb-1 break-words">{kpi.value}</h3>
              <p className="text-xs text-ink-faint">{kpi.sub}</p>
            </div>
            <div className={`p-2.5 rounded-lg border shrink-0 ${kpi.color}`}>{kpi.icon}</div>
          </>
        );
        return kpi.href ? (
          <Link key={kpi.label} href={kpi.href} className={cardClass}>
            {content}
          </Link>
        ) : (
          <div key={kpi.label} className={cardClass}>
            {content}
          </div>
        );
      })}
      </div>
    </div>
  );
}
