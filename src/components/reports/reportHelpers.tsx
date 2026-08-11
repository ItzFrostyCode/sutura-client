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
  avg_turnaround_days?: number | null;
  rejected_payments_amount?: number;
  forfeited_deposit_amount?: number;
  completion_rate?: number;
  revenue_data?: { month: string; revenue: number }[];
  jobs_by_status?: { status: string; count: number }[];
  garment_breakdown?: { garment_category: string; count: number; revenue: number }[];
  outstanding_balances?: OutstandingBalanceRow[];
  unclaimed_pickups?: UnclaimedPickupRow[];
  jobs_on_hold?: JobOnHoldRow[];
  avg_rating?: number | null;
  total_reviews?: number;
  booking_conversion_rate?: number;
}

export const GARMENT_CATEGORY_LABELS: Record<string, string> = {
  barong: 'Barong Tagalog',
  gown: 'Gown',
  suit: 'Suit',
  filipiniana: 'Filipiniana',
  uniform: 'School Uniform',
  lab_gown: 'Lab Gown',
  scrub_suit: 'Scrub Suit',
  corporate_wear: 'Corporate Wear',
  alteration_repair: 'Alterations & Repair',
};

export interface OutstandingBalanceRow {
  id: number;
  order_number: string;
  customer: { id: number; name: string; phone?: string | null } | null;
  total_amount: number;
  balance: number;
  due_date: string | null;
  status: string;
}

export interface UnclaimedPickupRow {
  id: number;
  order_number: string;
  customer: { id: number; name: string; phone?: string | null } | null;
  total_amount: number;
  balance: number;
  ready_for_pickup_at: string;
  days_waiting: number;
}

export interface JobOnHoldRow {
  id: number;
  order_number: string;
  customer: { id: number; name: string; phone?: string | null } | null;
  hold_reason: string | null;
  held_at: string;
  days_held: number;
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

// Matches JobOrder::STATUSES on the backend exactly.
export const STATUS_LABELS: Record<string, string> = {
  pending:                 'Pending',
  design:                  'Design',
  pattern_making:          'Pattern Making',
  mass_cutting_printing:   'Mass Cutting & Printing',
  cutting:                 'Cutting',
  sewing:                  'Sewing',
  ready_for_fitting:       'Ready for Fitting',
  final_adjustments:       'Final Adjustments',
  qc_ironing:              'QC & Ironing',
  ready_for_pickup:        'Ready for Pickup',
  completed:               'Completed',
  cancelled:               'Cancelled',
  rejected:                'Rejected',
  on_hold:                 'On Hold',
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
