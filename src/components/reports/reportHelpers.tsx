import React from 'react';

export interface AnalyticsData {
  total_jobs: number;
  completed_jobs: number;
  total_revenue: number;
  total_outstanding_balance: number;
  upcoming_appointments: number;
  total_appointments: number;
  total_staff: number;
  total_customers: number;
  total_collections: number;
  total_branches: number;
  total_services: number;
  // Enhanced KPIs
  today_revenue?: number;
  overdue_jobs?: number;
  avg_order_value?: number;
  rejected_payments_amount?: number;
  forfeited_deposit_amount?: number;
  completion_rate?: number;
  revenue_data?: { month: string; revenue: number }[];
  jobs_by_status?: { status: string; count: number }[];
  outstanding_balances?: OutstandingBalanceRow[];
}

export interface OutstandingBalanceRow {
  id: number;
  order_number: string;
  customer: { id: number; name: string; phone?: string | null } | null;
  total_amount: number;
  balance: number;
  due_date: string | null;
  status: string;
}

export const STATUS_COLORS: Record<string, string> = {
  pending:           '#BCA89F',
  cutting:           '#9A8073',
  sewing:            '#7A8B76',
  fitting:           '#D4B896',
  ready_for_pickup:  '#4A7C59',
  completed:         '#2D6A4F',
  cancelled:         '#B26959',
};

export const STATUS_LABELS: Record<string, string> = {
  pending:           'Pending',
  cutting:           'Cutting',
  sewing:            'Sewing',
  fitting:           'Fitting',
  ready_for_pickup:  'Ready',
  completed:         'Completed',
  cancelled:         'Cancelled',
};

export const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-[#EBE6E0] rounded-xl shadow-lg px-4 py-3">
        <p className="text-xs text-[#A8A19A] mb-1">{label}</p>
        <p className="text-base font-bold text-[#2D2A26]">
          ₱{payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export const PieTooltip = ({ active, payload }: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-[#EBE6E0] rounded-xl shadow-lg px-4 py-3">
        <p className="text-xs font-medium text-[#2D2A26]">
          {STATUS_LABELS[payload[0].name] ?? payload[0].name}
        </p>
        <p className="text-base font-bold text-taupe">{payload[0].value} orders</p>
      </div>
    );
  }
  return null;
};
