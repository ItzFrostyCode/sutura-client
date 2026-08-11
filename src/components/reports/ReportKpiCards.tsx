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

  const overdueColor = data?.overdue_jobs
    ? 'text-red-500 bg-red-50 border-red-200'
    : 'text-[#A8A19A] bg-gray-50 border-gray-200';

  let completionColor = 'text-red-500 bg-red-50 border-red-200';
  if (backendRate >= 80) {
    completionColor = 'text-[#4A7C59] bg-[#4A7C59]/10 border-[#4A7C59]/20';
  } else if (backendRate >= 50) {
    completionColor = 'text-amber-500 bg-amber-50 border-amber-200';
  }

  const kpis = [
    {
      label: 'Today\'s Revenue',
      value: `₱${Number(data?.today_revenue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      sub: 'Payments collected today',
      icon: <DollarSign className="text-[#4A7C59]" size={20} />,
      color: 'text-[#4A7C59] bg-[#4A7C59]/10 border-[#4A7C59]/20',
    },
    {
      label: 'Total Revenue',
      value: `₱${Number(data?.total_revenue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      sub: revenueSub,
      icon: <TrendingUp className="text-[#7A8B76]" size={20} />,
      color: 'text-[#7A8B76] bg-[#7A8B76]/10 border-[#7A8B76]/20',
    },
    {
      label: 'Outstanding Balance',
      value: `₱${Number(data?.total_outstanding_balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      sub: 'Unpaid from clients',
      icon: <Wallet className="text-amber-500" size={20} />,
      color: 'text-amber-500 bg-amber-50 border-amber-200',
    },
    {
      label: 'Avg. Order Value',
      value: `₱${Number(data?.avg_order_value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      sub: 'Per completed order',
      icon: <BarChart2 className="text-[#9A8073]" size={20} />,
      color: 'text-[#9A8073] bg-[#9A8073]/10 border-[#9A8073]/20',
    },
    {
      label: 'Completed Orders',
      value: `${data?.completed_jobs || 0} / ${data?.total_jobs || 0}`,
      sub: `${backendRate}% completion rate`,
      icon: <PackageCheck className="text-taupe" size={20} />,
      color: 'text-[#9A8073] bg-[#9A8073]/10 border-[#9A8073]/20',
    },
    {
      // How long a job actually takes from creation to completion — real
      // operational signal ("are we hitting our own turnaround promises")
      // nothing on Reports tracked before this. Approximated from
      // updated_at since job_orders has no dedicated completed_at column.
      label: 'Avg. Turnaround Time',
      value: data?.avg_turnaround_days != null ? `${data.avg_turnaround_days}d` : '—',
      sub: 'Days from order to completion',
      icon: <Timer className="text-violet-500" size={20} />,
      color: 'text-violet-500 bg-violet-50 border-violet-200',
    },
    {
      label: 'Rejected Payments',
      value: `₱${Number(data?.rejected_payments_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      sub: 'Flagged as fake, balance reversed',
      icon: <Flag className="text-[#B26959]" size={20} />,
      color: 'text-[#B26959] bg-[#B26959]/10 border-[#B26959]/20',
    },
    {
      label: 'Forfeited Deposits',
      value: `₱${Number(data?.forfeited_deposit_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      sub: 'Kept from abandoned orders',
      icon: <PackageX className="text-[#B26959]" size={20} />,
      color: 'text-[#B26959] bg-[#B26959]/10 border-[#B26959]/20',
    },
    {
      label: 'Overdue Orders',
      value: data?.overdue_jobs ?? 0,
      sub: 'Past due, not completed — click to view',
      icon: <AlertTriangle className="text-red-500" size={20} />,
      color: overdueColor,
      href: '/dashboard/jobs?overdue=true',
    },
    {
      label: 'Upcoming Appointments',
      value: data?.upcoming_appointments || 0,
      sub: 'Confirmed & scheduled',
      icon: <CalendarIcon className="text-violet-500" size={20} />,
      color: 'text-violet-500 bg-violet-50 border-violet-200',
    },
    {
      // How many bookings actually turn into paying work — the core
      // "discover a shop, book, order" funnel this thesis is built around,
      // and previously had zero visibility (outcome only got set through a
      // separate manual modal nobody consistently used).
      label: 'Booking Conversion',
      value: `${data?.booking_conversion_rate ?? 0}%`,
      sub: 'Appointments that became a job order',
      icon: <CalendarCheck className="text-teal-600" size={20} />,
      color: 'text-teal-600 bg-teal-50 border-teal-200',
    },
    {
      label: 'Active Staff',
      value: data?.total_staff || 0,
      sub: 'Current workforce',
      icon: <Users className="text-blue-500" size={20} />,
      color: 'text-blue-500 bg-blue-50 border-blue-200',
    },
    {
      label: 'Completion Rate',
      value: `${backendRate}%`,
      sub: 'Orders finished',
      icon: <Target className="text-[#4A7C59]" size={20} />,
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
      icon: <Star className="text-amber-500" size={20} />,
      color: 'text-amber-500 bg-amber-50 border-amber-200',
      href: '/dashboard/reviews',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {kpis.map((kpi) => {
        const cardClass = 'bg-white border border-[#EBE6E0] rounded-2xl p-5 flex items-start justify-between shadow-sm hover:shadow-md transition-shadow';
        const content = (
          <>
            <div>
              <p className="text-sm font-medium text-[#827A73] mb-1">{kpi.label}</p>
              <h3 className="text-2xl font-bold text-[#2D2A26] tracking-tight mb-1">{kpi.value}</h3>
              <p className="text-xs text-[#A8A19A]">{kpi.sub}</p>
            </div>
            <div className={`p-2.5 rounded-xl border ${kpi.color}`}>{kpi.icon}</div>
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
  );
}
