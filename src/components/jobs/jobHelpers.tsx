import React from 'react';
import { Store, ShoppingBag, Scissors } from 'lucide-react';

// Unified with the Multi-Stage Staff Assignment stages (design/pattern_making/
// cutting/sewing/qc_ironing) so the customer-facing timeline and the internal
// "who's assigned to what" tracking describe the same production process
// instead of two different vocabularies. Store pickup is the only
// fulfillment path — the approved thesis excludes logistics/courier/delivery
// management from the system's scope.
//
// 'mass_cutting_printing' is the Bulk Order Override: a job with a Team
// Roster / Size Sheet skips 'pattern_making' and goes straight here instead
// — see columnsForJobs(), which only shows whichever of the two columns is
// actually relevant to the jobs on the board.
export const ALL_COLUMNS = [
  { id: 'pending',                title: 'Pending',                color: 'bg-[#EBE6E0]/50',   border: 'border-[#D1C7BD]' },
  { id: 'design',                 title: 'Design',                 color: 'bg-pink-50/50',      border: 'border-pink-200/50' },
  { id: 'pattern_making',         title: 'Pattern Making',         color: 'bg-sky-50/50',       border: 'border-sky-200/50' },
  { id: 'mass_cutting_printing',  title: 'Mass Cutting & Printing', color: 'bg-cyan-50/50',     border: 'border-cyan-200/50' },
  { id: 'cutting',                title: 'Cutting',                color: 'bg-amber-50/50',     border: 'border-amber-200/50' },
  { id: 'sewing',                 title: 'Sewing / Assembly',      color: 'bg-orange-50/50',    border: 'border-orange-200/50' },
  { id: 'ready_for_fitting',      title: 'Ready for Fitting',      color: 'bg-violet-50/50',    border: 'border-violet-200/50' },
  { id: 'final_adjustments',      title: 'Final Adjustments',      color: 'bg-rose-50/50',      border: 'border-rose-200/50' },
  { id: 'qc_ironing',             title: 'QC & Ironing',           color: 'bg-fuchsia-50/50',   border: 'border-fuchsia-200/50' },
  { id: 'ready_for_pickup',       title: 'Ready for Pickup',       color: 'bg-emerald-50/50',   border: 'border-emerald-200/50' },
  { id: 'completed',              title: 'Completed',              color: 'bg-[#9A8073]/10',    border: 'border-[#9A8073]/30' },
];

/**
 * "No DP, No Layout, No Cut": a job cannot enter any of these production
 * stages until a 50% downpayment has been logged — mirrors
 * JobOrder::STAGES_REQUIRING_DOWNPAYMENT on the backend exactly so the
 * Kanban board's drag-and-drop guard never drifts out of sync with what the
 * API actually enforces.
 */
export const STAGES_REQUIRING_DOWNPAYMENT = new Set([
  'pattern_making', 'mass_cutting_printing', 'cutting', 'sewing',
  'ready_for_fitting', 'final_adjustments', 'qc_ironing',
]);

/**
 * Assignable Multi-Stage Staff Assignment stages — mirrors
 * JobOrder::STAFF_STAGES on the backend. Deliberately excludes 'fitting'
 * (happens front-of-house with the master cutter/owner, not a backroom
 * stage) and 'mass_cutting_printing'/other non-staffed statuses.
 */
export const STAFF_STAGES = ['design', 'pattern_making', 'cutting', 'sewing', 'qc_ironing'] as const;
export type StaffStage = typeof STAFF_STAGES[number];

export const STAFF_STAGE_LABELS: Record<StaffStage, string> = {
  design: 'Design',
  pattern_making: 'Pattern Making',
  cutting: 'Cutting',
  sewing: 'Sewing',
  qc_ironing: 'Finishing / QC',
};

// Mirrors JobOrder::isBulkOrder() on the backend exactly: a Team Roster /
// Size Sheet was submitted, OR the linked service is itself typed as bulk
// sublimation (a job can be bulk by service type alone, with no roster yet).
function isBulkOrder(job: Pick<Job, 'custom_order_data' | 'service'>): boolean {
  const roster = (job.custom_order_data as { team_roster?: unknown[] } | null | undefined)?.team_roster;
  if (Array.isArray(roster) && roster.length > 0) return true;
  return job.service?.service_type === 'bulk_sublimation';
}

/**
 * Kanban stage columns — hides whichever of Pattern Making / Mass Cutting &
 * Printing isn't relevant to the jobs actually on the board, instead of
 * always showing both (most shops only ever use one of the two paths).
 */
export function columnsForJobs(jobs: Job[] = []) {
  const hasBulkOrders = jobs.some(isBulkOrder);
  const hasStandardOrders = jobs.some(j => !isBulkOrder(j));

  return ALL_COLUMNS.filter(c => {
    if (c.id === 'mass_cutting_printing') return hasBulkOrders;
    if (c.id === 'pattern_making') return hasStandardOrders || !hasBulkOrders;
    return true;
  });
}

export interface Job {
  id: number;
  order_number?: string;
  intake_channel: 'walk_in' | 'online';
  fulfillment_type: 'pickup' | 'shipping' | 'delivery';
  courier_name?: string | null;
  courier_tracking_number?: string | null;
  status: string;
  payment_status: string;
  balance: number | string;
  downpayment?: number | string;
  total_amount?: number | string;
  customer?: { name: string; suki_tag?: string | null } | null;
  service?: { name: string; service_type?: string | null } | null;
  assigned_staff?: { name: string } | null;
  due_date?: string | null;
  updated_at?: string;
  custom_order_data?: Record<string, unknown> | null;
}

export type Tab = 'all' | 'walk_in' | 'online';

export const getDueStatus = (dueDateStr: string | null | undefined, status: string) => {
  if (!dueDateStr) return null;
  if (['completed', 'cancelled'].includes(status)) return null;

  const dueDate = new Date(dueDateStr);
  const today = new Date();
  
  const dueTime = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  
  if (dueTime < todayTime) {
    return { label: 'Overdue', className: 'bg-[#B26959]/10 text-[#B26959] border-[#B26959]/20' };
  }
  
  const diffTime = dueTime - todayTime;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 2) {
    return { label: 'Due Soon', className: 'bg-amber-50 text-amber-600 border-amber-200' };
  }
  
  return null;
};

export function TypeBadge({ type }: { readonly type: string }) {
  if (type === 'online') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
        <ShoppingBag size={9} /> Online
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#F0EAE3] text-[#827A73] px-1.5 py-0.5 rounded">
      <Store size={9} /> Walk-in
    </span>
  );
}

export function ColumnIcon({ id }: { readonly id: string }) {
  switch (id) {
    case 'ready_for_pickup':
      return <Store size={14} className="text-emerald-600" />;
    case 'completed':
      return <Scissors size={14} className="text-[#9A8073]" />;
    default:
      return null;
  }
}
