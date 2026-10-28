export const CUSTOM_SIZE = 'Custom Fit';

export interface RosterItem {
  name: string;
  print_name?: string;
  number?: string | number;
  size: string;
  completed?: boolean;
}

export interface GarmentSpecColumn {
  id: string;
  key: string;
  label: string;
  type?: 'text' | 'number' | 'select';
  options?: string[];
}

export interface GarmentSpecRow {
  id: string;
  completed?: boolean;
  [key: string]: unknown;
}

export interface GarmentSpecTable {
  columns: GarmentSpecColumn[];
  rows: GarmentSpecRow[];
}

export interface CustomizationInstruction {
  id: string;
  label: string;
  details: string;
  reference_link?: string | null;
  reference_image?: string | null;
  scope?: string | null;
}

export interface Payment {
  id: number;
  amount: string | number;
  payment_method: string;
  source?: 'online' | 'walk_in' | null;
  type?: 'deposit' | 'partial' | 'full' | 'balance' | null;
  reference?: string | null;
  receipt_path?: string | null;
  created_at: string;
  notes?: string;
  recorded_by?: { name: string; id: number };
  rejected_at?: string | null;
  rejected_reason?: string | null;
  rejected_by?: { name: string; id: number } | null;
  // Derived server-side: 'rejected' | 'verified' | 'pending_verification'.
  // Cash auto-verifies at creation; gcash/paymaya sit pending until an
  // owner/branch manager calls verifyPayment().
  status?: 'pending_verification' | 'verified' | 'rejected';
  cash_tendered?: string | number | null;
  change_amount?: string | number | null;
  verified_at?: string | null;
  verified_by?: { name: string; id: number } | null;
}

export interface Job {
  id: number;
  order_number: string;
  /** The consultation this order was made from, when there was one. */
  appointment_id?: number | null;
  tracking_code?: string | null;
  intake_channel: string;
  fulfillment_type: string;
  status: string;
  payment_status: string;
  balance: number | string;
  /** Sent to plain staff instead of the amounts: only whether something is still owed. */
  has_balance?: boolean;
  quantity?: number;
  total_amount: number | string;
  notes?: string;
  deadline?: string;
  due_date?: string;
  customer?: { name: string; id: number; email?: string | null; suki_tag?: string | null };
  service?: {
    name: string;
    id: number;
    service_type?: string | null;
    service_types?: string[] | null;
    category?: string | null;
    categories?: string[] | null;
    base_price?: number | string | null;
    min_order_qty?: number | null;
    estimated_days?: number | null;
    /** The service's usual rules; this order's own copy is on the order itself. */
    measurement_requirement?: 'none' | 'existing' | 'shop' | null;
    fitting_requirement?: 'none' | 'optional' | 'required' | null;
    payment_policy?: 'none' | 'full' | 'deposit' | 'custom' | null;
    payment_policy_percent?: number | null;
  };
  assigned_staff?: { name: string; id: number };
  store_branch_id?: number | null;
  branch?: { id: number; name: string } | null;
  staff_stages?: { id: number; pivot: { stage: string; completed_at?: string } }[];
  custom_order_data?: Record<string, unknown> | null;
  payments?: Payment[];
  is_rush?: boolean;
  rush_fee?: number | string;
  completion_photo_url?: string | null;
  reference_images?: string[] | null;
  reference_link?: string | null;
  /** Consultation first: where the design comes from, the customer's file and what was said. */
  design_source?: import('@/lib/designSource').DesignSource | null;
  design_link?: string | null;
  consultation_notes?: string | null;
  /** Split orders: the first order of the group, this order's place in it, who pays for it, and the group's figures. */
  parent_order_id?: number | null;
  batch_no?: number | null;
  group_kind?: 'batch' | 'set' | null;
  paid_by_name?: string | null;
  /** The completed order this one follows up, and the follow-ups made from this one (a free fix is flagged). */
  follow_up_of_id?: number | null;
  follow_up_of?: { id: number; order_number: string } | null;
  follow_ups?: { id: number; order_number: string; status: string; free_fix: boolean }[];
  batch?: import('./batches/batchTypes').BatchSummary | null;
  can_split?: boolean;
  released_with_balance_at?: string | null;
  balance_due_by?: string | null;
  material_source?: 'store_supplied' | 'customer_supplied' | null;
  // Customer-facing tracker fields — surfaced on /account/orders/[id] and
  // /track/[code]. Meaningful only while the job is in progress; see
  // docs/CUSTOMER-WORKFLOW.md §7.4/§22.
  estimated_ready_at?: string | null;
  // Only meaningful when material_source === 'customer_supplied' — tracks
  // the fabric/material the customer physically dropped off at the shop.
  customer_material_status?: 'safe' | 'damaged' | 'lost' | 'returned' | null;
  rejection_reason?: string | null;
  cancellation_reason?: string | null;
  hold_reason?: string | null;
  status_before_hold?: string | null;
  qc_passed_at?: string | null;
  discount_amount?: number | string | null;
  // Snapshotted at creation from design -> service -> store defaults.
  measurement_requirement?: 'none' | 'existing' | 'shop' | null;
  fitting_requirement?: 'none' | 'optional' | 'required' | null;
  payment_policy?: 'none' | 'full' | 'deposit' | 'custom' | null;
  payment_policy_percent?: number | null;
  customer_job_count?: number;
  // Ordering flow (server-derived).
  uses_confirmation_flow?: boolean;
  shop_accepted_at?: string | null;
  customer_decision?: 'accepted' | 'changes_requested' | 'declined' | null;
  created_at?: string;
  quotation_status?: 'estimate' | 'final' | null;
  confirmed_at?: string | null;
  production_started_at?: string | null;
  /** The Confirmed column's checks, straight from the list: materials marked ready, how the customer's own fabric was judged, and the tailors planned. */
  materials_verified_at?: string | null;
  customer_items_assessment?: 'suitable' | 'not_suitable' | null;
  assignees_count?: number;
  adjustment_count?: number;
  first_adjustment_at?: string | null;
  garment_category?: 'barong' | 'gown' | 'suit' | 'filipiniana' | 'uniform' | 'lab_gown' | 'scrub_suit' | 'corporate_wear' | 'alteration_repair' | null;
  progress_photos?: { url: string; stage: string; uploaded_at: string }[] | null;
  measurement?: {
    id: number;
    profile_name: string;
    version?: number;
    metrics: Record<string, number | string>;
    notes?: string | null;
    photo_urls?: string[] | null;
    is_stale?: boolean;
    current_version_id?: number | null;
  } | null;
  catalog_item?: {
    id: number;
    name: string;
    category?: string | null;
    price?: number | string | null;
    fabric_image_url?: string | null;
    images?: { id: number; image_url: string; is_primary: boolean }[];
  } | null;
}

export interface Staff {
  id: number;
  role: string;
  additional_roles?: string[] | null;
  specialization?: string | string[];
  store_branch_id?: number | null;
  branch?: { id: number; name: string } | null;
  // Already computed by StaffController@index (same "≥5 = overloaded"
  // threshold as the Staff dashboard page) but never surfaced at the one
  // place an owner actually picks who to assign — real-time workload
  // visibility at assignment time, not just after the fact on a separate page.
  active_jobs?: number;
  is_active?: boolean;
  is_available?: boolean;
  user: {
    id: number;
    name: string;
    email: string;
  };
}
