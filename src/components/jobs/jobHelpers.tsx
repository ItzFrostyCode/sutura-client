import React from 'react';
import { depositFraction, type PaymentPolicy } from './requirements';
import { Store, ShoppingBag, Scissors, Pause, Clock, Wrench, ShieldCheck, Sparkles, Check, Factory } from 'lucide-react';

/**
 * The 7 Streamlined Production Order Stages (aligned with Bongo's JobOrder::STATUSES):
 * 1. pending
 * 2. production
 * 3. quality_check (matches backend enum; shown as "Quality Check")
 * 4. ready_for_fitting
 * 5. adjustments
 * 6. ready_for_pickup
 * 7. completed
 *
 * Sub-stages (normalized into the 7 columns via normalizeJobStatus()):
 * - production lane: design → pattern_making → cutting → sewing → (qc_ironing)
 * - bulk order override: mass_cutting (backend enum; shown as "Cutting" only)
 * - repair/alteration override: queued → in_repair → qc_check
 * - ready_for_pickup loops back to adjustments on revision/alteration
 */
export const PRODUCTION_COLUMNS = [
  { id: 'pending',           title: 'Pending',            color: 'bg-amber-50/50',   border: 'border-amber-200/70' },
  { id: 'production',        title: 'Production',         color: 'bg-blue-50/50',    border: 'border-blue-200/70' },
  { id: 'quality_check',     title: 'Quality Check',      color: 'bg-purple-50/50',  border: 'border-purple-200/70' },
  { id: 'ready_for_fitting', title: 'Ready for Fitting',  color: 'bg-violet-50/50',  border: 'border-violet-200/70' },
  { id: 'adjustments',       title: 'Adjustments',        color: 'bg-rose-50/50',    border: 'border-rose-200/70' },
  { id: 'ready_for_pickup',  title: 'Ready for Pickup',   color: 'bg-emerald-50/50', border: 'border-emerald-200/70' },
  { id: 'completed',         title: 'Completed',          color: 'bg-taupe/10',      border: 'border-taupe/30' },
] as const;

export const ALL_COLUMNS = [...PRODUCTION_COLUMNS];

/**
 * One colour per stage so a stage is spotted at a glance: the column's dot and
 * top accent, and the stage chip in list view. Full class strings so Tailwind
 * keeps them. Hues stay clear of the red/amber used for overdue / due today.
 */
export const STAGE_STYLE: Record<string, { chip: string; dot: string; accent: string }> = {
  pending:           { chip: 'bg-slate-100 text-slate-700',    dot: 'bg-slate-400',   accent: 'border-t-slate-400' },
  production:        { chip: 'bg-blue-50 text-blue-800',       dot: 'bg-blue-500',    accent: 'border-t-blue-500' },
  quality_check:     { chip: 'bg-purple-50 text-purple-800',   dot: 'bg-purple-500',  accent: 'border-t-purple-500' },
  ready_for_fitting: { chip: 'bg-cyan-50 text-cyan-800',       dot: 'bg-cyan-500',    accent: 'border-t-cyan-500' },
  adjustments:       { chip: 'bg-orange-50 text-orange-800',   dot: 'bg-orange-500',  accent: 'border-t-orange-500' },
  ready_for_pickup:  { chip: 'bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500', accent: 'border-t-emerald-500' },
  completed:         { chip: 'bg-sunken text-ink-body',        dot: 'bg-taupe',       accent: 'border-t-taupe' },
  on_hold:           { chip: 'bg-yellow-50 text-yellow-800',   dot: 'bg-yellow-500',  accent: 'border-t-yellow-500' },
};

/**
 * Where a card can go next from each stage (the board's one-click actions).
 * Used to preview the destination column while hovering an action button.
 * Repair override: qc_check → ready_for_pickup (skips fitting)
 * Ready for Pickup can loop back to adjustments on revision/alteration.
 */
export const NEXT_STAGES: Record<string, readonly string[]> = {
  pending: ['production'],
  production: ['quality_check'],
  quality_check: ['ready_for_fitting'],
  ready_for_fitting: ['adjustments', 'ready_for_pickup'],
  adjustments: ['quality_check'],
  ready_for_pickup: ['completed', 'adjustments'], // revision/alteration loops back
};

export const nextStagesFor = (status: string): readonly string[] => NEXT_STAGES[normalizeJobStatus(status)] ?? [];

/**
 * Normalizes any legacy or sub-stage status into one of the 7 primary production stages.
 * This guarantees backwards compatibility with existing database rows while presenting
 * a clean, frictionless 7-column workflow to staff and shop owners.
 *
 * Aligned with Bongo's JobOrder::STATUSES enum (23 statuses):
 * - production lane: design → pattern_making → cutting → sewing → qc_ironing
 * - bulk order override: mass_cutting (shown as "Cutting" only)
 * - repair/alteration override: queued → in_repair → qc_check
 * - ready_for_pickup loops back to adjustments on revision/alteration
 */
export function normalizeJobStatus(status: string): string {
  switch (status) {
    case 'pending':
      return 'pending';
    case 'production':
    case 'design':
    case 'pattern_making':
    case 'mass_cutting':
    case 'cutting':
    case 'sewing':
    case 'queued':
    case 'in_repair':
      return 'production';
    case 'quality_check':
    case 'qc_ironing':
    case 'qc_check':
      return 'quality_check';
    case 'ready_for_fitting':
      return 'ready_for_fitting';
    case 'adjustments':
    case 'final_adjustments':
      return 'adjustments';
    case 'ready_for_pickup':
      return 'ready_for_pickup';
    case 'completed':
      return 'completed';
    case 'on_hold':
      return 'on_hold';
    default:
      return status;
  }
}

export const ON_HOLD_COLUMN = { id: 'on_hold', title: 'On Hold', color: 'bg-amber-50/60', border: 'border-amber-300/60' };

/**
 * "No DP, No Layout, No Cut": a job cannot enter any of these production
 * stages until downpayment has been logged.
 * Mirrors JobOrder::STAGES_REQUIRING_DOWNPAYMENT on the backend exactly.
 */
export const STAGES_REQUIRING_DOWNPAYMENT = new Set([
  'production', 'quality_check', 'ready_for_fitting', 'adjustments', 'ready_for_pickup',
  // legacy/sub-stage keys preserved (all granular stages from backend)
  'design', 'pattern_making', 'mass_cutting', 'cutting', 'sewing',
  'qc_ironing', 'final_adjustments', 'in_repair', 'qc_check',
  'queued',
]);

/**
 * Assignable Multi-Stage Staff Assignment stages — mirrors
 * JobOrder::STAFF_STAGES on the backend. Deliberately excludes 'fitting'
 * (happens front-of-house with the master cutter/owner, not a backroom
 * stage) and 'mass_cutting'/other non-staffed statuses.
 */
export const STAFF_STAGES = ['design', 'pattern_making', 'cutting', 'sewing', 'qc_ironing'] as const;
export type StaffStage = typeof STAFF_STAGES[number];

export const STAFF_STAGE_LABELS: Record<StaffStage, string> = {
  design: 'Design',
  pattern_making: 'Pattern Making',
  cutting: 'Cutting',
  sewing: 'Sewing',
  qc_ironing: 'Finishing / Quality Check / Ironing',
};

// Mirrors JobOrder::isBulkOrder() on the backend exactly: a Team Roster /
// Size Sheet was submitted, OR the linked service is itself typed as bulk
// sublimation (a job can be bulk by service type alone, with no roster yet).
export function isBulkOrder(job: Pick<Job, 'custom_order_data' | 'service'>): boolean {
  const data = job.custom_order_data as { team_roster?: unknown[]; size_breakdown?: Record<string, number> } | null | undefined;
  const roster = data?.team_roster;
  if (Array.isArray(roster) && roster.length > 0) return true;
  if (data?.size_breakdown && typeof data.size_breakdown === 'object' && Object.keys(data.size_breakdown).length > 0) return true;
  return serviceHasType(job.service, 'bulk_sublimation');
}

// Mirrors JobOrder::isRepairOnly() on the backend exactly: a job whose
// garment_category is 'alteration_repair', or whose linked service carries
// that type, is a candidate for the short repair pipeline (queued ->
// in_repair -> qc_check) instead of the full custom-tailoring one.
export function isRepairOnly(job: Pick<Job, 'garment_category' | 'service'>): boolean {
  if (job.garment_category === 'alteration_repair') return true;
  return serviceHasType(job.service, 'alteration_repair');
}

// Services moved from a single `service_type` to a multi-select
// `service_types` array (the backend's Service::hasType() reads only the
// array); the legacy column is still checked for older rows. Exported —
// also used by the job-create form (form/types.ts's ServiceData has the
// same two fields), so bulk/alteration detection doesn't drift between the
// two places a job order gets created.
export function serviceHasType(
  service: { service_type?: string | null; service_types?: string[] | null } | null | undefined,
  type: string,
): boolean {
  return Boolean(service?.service_types?.includes(type)) || service?.service_type === type;
}

/**
 * Mirrors JobOrder::requiresDownpaymentFor(): repairs only need the 50%
 * downpayment when the shop turned on "Require downpayment for repairs".
 */
export function requiresDownpayment(
  job: Pick<Job, 'garment_category' | 'service' | 'payment_policy' | 'payment_policy_percent'>,
  status: string,
  repairRequiresDownpayment: boolean,
): boolean {
  if (!STAGES_REQUIRING_DOWNPAYMENT.has(status)) return false;
  if (isRepairOnly(job) && !repairRequiresDownpayment) return false;
  return depositFraction(job.payment_policy, job.payment_policy_percent) > 0;
}

/**
 * Kanban stage columns — shows the relevant production pipeline based on job types:
 * - Standard custom tailoring: design → pattern_making → cutting → sewing → qc_ironing (all normalize to 'production')
 * - Bulk orders (team_roster/size_breakdown/bulk_sublimation): mass_cutting → cutting → sewing → qc_ironing (shown as "Cutting" only)
 * - Repair/alteration (garment_category=alteration_repair): queued → in_repair → qc_check (separate lane)
 *
 * Hides irrelevant columns (pattern_making vs mass_cutting) and
 * hides the Repair Override lane unless a repair job is actually on the board.
 */
export function columnsForJobs(jobs: Job[] = []) {
  const hasBulk = jobs.some(isBulkOrder);
  const hasRepair = jobs.some(isRepairOnly);

  // For now, return standard 7 columns since sub-stages are shown within the Production column
  // The detailed sub-stage tracking happens inside JobKanbanBoard/JobProductionTimeline
  return [...PRODUCTION_COLUMNS];
}

/**
 * Online order where the customer asked the shop to measure them and no
 * measurements are on the order yet (the "Needs measuring" tag).
 */
export function needsMeasuring(job: { measurement_source?: string | null; measurement_id?: number | null; status: string }): boolean {
  return job.measurement_source === 'shop' && !job.measurement_id && !['completed', 'cancelled', 'rejected'].includes(job.status);
}

export interface Job {
  /** This order's own copy of the measuring rule (design → service → shop default at creation). */
  measurement_requirement?: 'none' | 'existing' | 'shop' | null;
  id: number;
  order_number?: string;
  intake_channel: 'walk_in' | 'online';
  fulfillment_type: 'pickup' | 'shipping' | 'delivery';
  status: string;
  payment_status: string;
  balance: number | string;
  /** Sent to plain staff instead of the amounts: only whether something is still owed. */
  has_balance?: boolean;
  downpayment?: number | string;
  total_amount?: number | string;
  quantity?: number;
  discount_amount?: number | string | null;
  payment_policy?: PaymentPolicy | null;
  payment_policy_percent?: number | null;
  customer?: { name: string; suki_tag?: string | null; id?: number; phone?: string | null; email?: string | null } | null;
  service?: { id?: number; name: string; service_type?: string | null; service_types?: string[] | null; min_order_qty?: number | null; base_price?: number | string | null; estimated_days?: number | null } | null;
  assigned_staff?: { name: string; id?: number; email?: string } | null;
  due_date?: string | null;
  updated_at?: string;
  custom_order_data?: Record<string, unknown> | null;
  hold_reason?: string | null;
  garment_category?: string | null;
  catalog_item_id?: number | null;
  tracking_code?: string | null;
  is_rush?: boolean;
  // Ordering flow (server-derived). Orders created before the flow have uses_confirmation_flow = false.
  uses_confirmation_flow?: boolean;
  shop_accepted_at?: string | null;
  fitting_requirement?: 'none' | 'optional' | 'required' | null;
  customer_decision?: 'accepted' | 'changes_requested' | 'declined' | null;
  created_at?: string;
  quotation_status?: 'estimate' | 'final' | null;
  /** Garments went out before the balance was paid (released by the owner or a branch manager). */
  released_with_balance_at?: string | null;
  balance_due_by?: string | null;
  batch_no?: number | null;
  group_kind?: 'batch' | 'set' | null;
  specs_approved_at?: string | null;
  customer_approved_at?: string | null;
  confirmed_at?: string | null;
  production_started_at?: string | null;
  /** The Confirmed column's checks, straight from the list: materials marked ready, how the customer's own fabric was judged, tailors planned. */
  material_source?: 'store_supplied' | 'customer_supplied' | null;
  materials_verified_at?: string | null;
  customer_items_assessment?: 'suitable' | 'not_suitable' | null;
  assignees_count?: number;
  /** The list names the tailors (lead first) so the Being made card can show who has it. */
  assignees?: { role: string; user?: { name: string } | null }[];
  qc_passed_at?: string | null;
  /** The Ready card's facts: when the customer was told, whether the fitting was passed, and how many pieces / people have been handed over. */
  ready_for_pickup_at?: string | null;
  fitting_passed_at?: string | null;
  handed_over_count?: number | string | null;
  /** The Done card's "Handed over Oct 22": the latest handover (the list sends it with the order). */
  last_handover_at?: string | null;
  /** Orders made as a follow-up to this one (a free fix is flagged); sent with the order page. */
  follow_ups?: { id: number; order_number: string; status: string; free_fix: boolean }[];
  status_before_hold?: string | null;
  catalog_item?: {
    id: number;
    name: string;
    category?: string | null;
    garment_type?: string | null;
    price?: number | string | null;
    /** The service this design is a style of, and what one piece of it costs (set by the server for the order page). */
    service_id?: number | string | null;
    pricing?: import('@/lib/designPricing').DesignPricing | null;
    fabric_image_url?: string | null;
    images?: Array<{ id?: number; image_url: string; is_primary?: boolean | number }>;
  } | null;
  reference_images?: string[] | null;
  /** The group this order belongs to (a set from one consultation, or a split by who pays). */
  batch?: import('./batches/batchTypes').BatchSummary | null;
  // From the other side of the merge with Bongo's Sutura_Client:
  /** The branch the order belongs to (staff of other branches can't take it). */
  store_branch_id?: number | null;
  /** Online order: how the customer said they'd be measured (shop = "have the shop measure me"). */
  measurement_source?: 'own' | 'saved' | 'shop' | null;
  measurement_id?: number | null;
  service_package?: { id: number; name: string } | null;
  assigned_staff_id?: number | null;
  assigned_to?: number | null;
  assignedStaff?: { id?: number; name: string; email?: string } | null;
  assignedTo?: { id?: number; name: string; email?: string } | null;
  design_origin?: string | null;
  reference_link?: string | null;
  rush_fee?: number | string;
  notes?: string;
}

export type Tab = 'all' | 'walk_in' | 'online';

export const CANCELLATION_REASON_LABELS: Record<string, string> = {
  customer_request: 'Customer requested cancellation',
  store_unable_to_fulfill: 'Shop unable to fulfill',
  forfeited_deposit_abandoned: 'Forfeited deposit — customer went uncontactable',
  other: 'Other',
};

/**
 * Garment Type on the New Job Order form: broad structural classes rather
 * than garment-by-name. Server: App\Support\GarmentCategory::STANDARD.
 */
export const GARMENT_TYPE_OPTIONS = [
  { value: 'top', label: 'Top', examples: 'Barong Tagalog, polo, blouse, shirt, blazer' },
  { value: 'bottom', label: 'Bottom', examples: 'Pants, trousers, slacks, skirt, shorts' },
  { value: 'full_set', label: 'Full Set / Suit', examples: '2- or 3-piece suit, school or company uniform set, scrub suit set' },
  { value: 'gown_dress', label: 'Gown / Dress', examples: 'Evening gown, wedding gown, Filipiniana, modern terno' },
  { value: 'outerwear', label: 'Outerwear / Specialty', examples: 'Academic toga, lab gown, vest, robe' },
  { value: 'others', label: 'Others / Custom Item', examples: 'Anything that doesn’t fit the groups above' },
] as const;

export type GarmentTypeValue = (typeof GARMENT_TYPE_OPTIONS)[number]['value'];

// Labels for every garment_category value an order can hold: the standard
// classes, the automatic alteration marker, and the older garment-by-name
// values still on existing orders.
export const GARMENT_CATEGORY_LABELS: Record<string, string> = {
  ...Object.fromEntries(GARMENT_TYPE_OPTIONS.map((o) => [o.value, o.label])),
  alteration_repair: 'Alterations & Repair',
  barong: 'Barong Tagalog',
  gown: 'Gown',
  suit: 'Suit',
  filipiniana: 'Filipiniana',
  uniform: 'School Uniform',
  lab_gown: 'Lab Gown',
  scrub_suit: 'Scrub Suit',
  corporate_wear: 'Corporate Wear',
};

export const getDueStatus = (dueDateStr: string | null | undefined, status: string) => {
  if (!dueDateStr) return null;
  // Mirrors NotifyOverdueJobs/AnalyticsController's exact "overdue" definition
  // server-side — 'rejected' was missing here, so a declined job could still
  // show an "Overdue" badge even though it was never going into production.
  if (['completed', 'cancelled', 'on_hold', 'rejected'].includes(status)) return null;

  const dueDate = new Date(dueDateStr);
  const today = new Date();
  
  const dueTime = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  
  if (dueTime < todayTime) {
    return { label: 'Overdue', className: 'bg-danger/10 text-danger border-danger/20' };
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
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-sunken text-ink-muted px-1.5 py-0.5 rounded">
      <Store size={9} /> Walk-in
    </span>
  );
}

export function ColumnIcon({ id }: { readonly id: string }) {
  switch (id) {
    case 'pending':
      return <Clock size={14} className="text-amber-600" />;
    case 'production':
      return <Scissors size={14} className="text-blue-600" />;
    case 'quality_check':
      return <ShieldCheck size={14} className="text-purple-600" />;
    case 'ready_for_fitting':
      return <Sparkles size={14} className="text-violet-600" />;
    case 'adjustments':
      return <Wrench size={14} className="text-rose-600" />;
    case 'ready_for_pickup':
      return <Store size={14} className="text-emerald-600" />;
    case 'completed':
      return <Check size={14} className="text-taupe" />;
    case 'on_hold':
      return <Pause size={14} className="text-amber-600" />;
    default:
      return null;
  }
}

// From 38c0962 (merge with Bongo's Sutura_Client).
/** The garments went out before the balance was paid, and the date the customer promised to pay by has passed. */
export function isLateBalance(job: Pick<Job, 'balance' | 'released_with_balance_at' | 'balance_due_by'>): boolean {
  if (!job.released_with_balance_at || !job.balance_due_by) return false;
  if ((Number.parseFloat(String(job.balance)) || 0) <= 0.005) return false;
  const today = new Date();
  const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return job.balance_due_by.slice(0, 10) < key;
}

// From 38c0962 (merge with Bongo's Sutura_Client).
/** The order is being made, or is closed: its sizes and specifications are only shown from then on. */
export const detailsLocked = (job: { status: string }) => STAGES_REQUIRING_DOWNPAYMENT.has(job.status) || ['completed', 'cancelled', 'rejected'].includes(job.status);
