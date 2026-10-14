export interface ChecklistItem {
  key: 'specs' | 'measurements' | 'customer_items' | 'quotation' | 'approval' | 'deposit' | 'confirmed' | 'materials' | 'tailor' | 'started';
  label: string;
  done: boolean;
  detail: string | null;
  applicable: boolean;
}

export interface Blocker {
  key: string;
  message: string;
}

export interface Assignee {
  user_id: number;
  name: string | null;
  profile_picture: string | null;
  role: 'lead' | 'tailor' | 'assistant';
  note: string | null;
}

export interface ChargeRow {
  label: string;
  amount: number;
}

export interface QuotationData {
  base_price: number;
  quantity_adjustment: number;
  additional_charges: ChargeRow[];
  customer_provided_deduction: ChargeRow[];
  notes: string | null;
  total: number;
}

export interface Capacity {
  branch_open_orders: number;
  due_within_2_days: number | null;
  has_conflict: boolean;
  tailors: { user_id: number; name: string | null; open_orders: number; conflicts: { order_number: string; due_date: string | null }[] }[];
}

export interface Refund {
  id: number;
  stage: string;
  paid_amount: number;
  suggested_amount: number;
  approved_amount: number;
  adjustment_reason: string | null;
  refunded_at: string | null;
  created_at: string;
}

export interface ReadinessData {
  uses_confirmation_flow: boolean;
  status: string;
  permissions: {
    can_see_money: boolean;
    can_edit_quotation: boolean;
    can_assign: boolean;
    can_confirm: boolean;
    can_approve_change: boolean;
    can_manage_refund: boolean;
  };
  order?: { id: number; order_number: string; due_date: string | null; measurement_requirement: string; fitting_requirement: string | null; material_source: string | null; is_rush: boolean; rush_fee: number; quantity: number };
  checklist?: ChecklistItem[];
  blockers?: { confirm: Blocker[]; start: Blocker[] };
  quotation?: {
    status: 'estimate' | 'final' | null;
    approved_at: string | null;
    approval_channel: 'online' | 'in_person' | null;
    confirmed_at: string | null;
    specs_approved_at: string | null;
    measurements_verified_at: string | null;
    materials_verified_at: string | null;
    production_started_at: string | null;
    data?: QuotationData | null;
    total?: number;
  };
  deposit?: { met: boolean; policy: string | null; policy_percent: number | null; required?: number; paid?: number; pending_verification?: number };
  materials?: {
    ready: boolean;
    waiting: boolean;
    note: string | null;
    customer_items: { applicable: boolean; assessment: 'suitable' | 'not_suitable' | null };
  };
  delivery?: Delivery;
  assignees?: Assignee[];
  policy?: string;
  capacity?: Capacity;
  refunds?: Refund[];
}

export interface RefundSuggestion {
  stage: 'no_costs_yet' | 'costs_incurred' | 'production_started';
  paid_amount: number;
  non_refundable_amount: number;
  suggested_amount: number;
  basis: { paid: number; non_refundable: number };
  policy: string | null;
}

export type CorrectionKind = 'defect' | 'fitting_issue' | 'change_request';

export interface Correction {
  id: number;
  kind: CorrectionKind;
  description: string;
  status: 'open' | 'done' | 'awaiting_approval' | 'cancelled';
  affected_quantity: number | null;
  shop_fault: boolean;
  target_date: string | null;
  assigned_user_id: number | null;
  assignee_name: string | null;
  additional_amount: number | null;
  approved_at: string | null;
  resolved_at: string | null;
}

export interface DeliveryStage {
  key: 'in_production' | 'quality_check' | 'collection' | 'fitting' | 'correction' | 'handover' | 'completed';
  label: string;
  state: 'done' | 'current' | 'upcoming';
  applicable: boolean;
}

export interface Delivery {
  current: DeliveryStage['key'] | null;
  stages: DeliveryStage[];
  qc_passed_at: string | null;
  fitting_requirement: 'none' | 'optional' | 'required' | null;
  fitting_passed_at: string | null;
  open_corrections: number;
  corrections: Correction[];
  handover: {
    quantity: number;
    handed_over: number;
    remaining: number;
    records: { id: number; quantity: number; received_by: string | null; note: string | null; handed_over_at: string; recorded_by: string | null }[];
  };
  balance_clear: boolean;
  balance: number | null;
}
