import React from 'react';
import {
  TrendingUp, Wallet, PackageCheck, Calendar as CalendarIcon,
  Users, Target, DollarSign, AlertTriangle, BarChart2, Flag, PackageX,
} from 'lucide-react';
import { AnalyticsData } from './reportHelpers';

interface ReportKpiCardsProps {
  readonly data: AnalyticsData | null;
  readonly completionRate: number;
}

export default function ReportKpiCards({ data, completionRate }: ReportKpiCardsProps) {
  const backendRate = data?.completion_rate ?? completionRate;

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
      sub: 'Lifetime collected',
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
      sub: 'Past due, not completed',
      icon: <AlertTriangle className="text-red-500" size={20} />,
      color: overdueColor,
    },
    {
      label: 'Upcoming Appointments',
      value: data?.upcoming_appointments || 0,
      sub: 'Confirmed & scheduled',
      icon: <CalendarIcon className="text-violet-500" size={20} />,
      color: 'text-violet-500 bg-violet-50 border-violet-200',
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
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="bg-white border border-[#EBE6E0] rounded-2xl p-5 flex items-start justify-between shadow-sm hover:shadow-md transition-shadow"
        >
          <div>
            <p className="text-sm font-medium text-[#827A73] mb-1">{kpi.label}</p>
            <h3 className="text-2xl font-bold text-[#2D2A26] tracking-tight mb-1">{kpi.value}</h3>
            <p className="text-xs text-[#A8A19A]">{kpi.sub}</p>
          </div>
          <div className={`p-2.5 rounded-xl border ${kpi.color}`}>{kpi.icon}</div>
        </div>
      ))}
    </div>
  );
}
