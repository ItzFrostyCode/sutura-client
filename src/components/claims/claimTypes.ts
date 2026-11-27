// After-sale claims ("Report a problem") — mirrors App\Models\OrderClaim on the server.

export type ClaimType = 'repair' | 'refund';
export type ClaimReason = 'poor_stitching' | 'wrong_fit' | 'damaged' | 'other';
export type ClaimStatus = 'submitted' | 'repair_offered' | 'declined' | 'repairing' | 'resolved' | 'awaiting_return' | 'refunded';

export interface OrderClaim {
  id: number;
  job_order_id: number;
  type: ClaimType;
  reason: ClaimReason;
  description: string;
  photos: string[];
  status: ClaimStatus;
  decline_reason: string | null;
  escalated_ticket_id: number | null;
  /** Set when the shop offered a free repair on a refund claim. */
  repair_offer: { due_date: string | null; note: string | null; offered_at: string; declined_at: string | null } | null;
  decided_at: string | null;
  repair_order: { id: number; order_number: string; tracking_code: string; status: string; due_date: string | null } | null;
  garment_returned_at: string | null;
  refund_amount: number | null;
  refund_method: 'cash' | 'gcash' | null;
  refund_reference: string | null;
  refund_proof_path: string | null;
  refunded_at: string | null;
  resolved_at: string | null;
  created_at: string;
  filed_by?: string | null;
  decided_by?: string | null;
}

export interface ClaimsPayload {
  can_file: boolean;
  window_ends_at: string | null;
  reason: string | null;
  window_days: number;
  paid_amount: number;
  claims: OrderClaim[];
}

export interface NewClaim {
  type: ClaimType;
  reason: ClaimReason;
  description: string;
  photos: string[];
}

export const CLAIM_REASONS: { value: ClaimReason; label: string }[] = [
  { value: 'poor_stitching', label: 'Poor stitching' },
  { value: 'wrong_fit', label: 'Wrong fit' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'other', label: 'Other' },
];

export const reasonLabel = (r: ClaimReason) => CLAIM_REASONS.find((x) => x.value === r)?.label ?? r;

/** Status words and tones, from the customer's point of view and the shop's. */
export const CLAIM_STATUS: Record<ClaimStatus, { label: string; tone: string }> = {
  submitted: { label: 'Waiting for the shop', tone: 'bg-amber-50 text-amber-800 border-amber-200' },
  repair_offered: { label: 'Repair offered', tone: 'bg-blue-50 text-blue-800 border-blue-200' },
  declined: { label: 'Declined', tone: 'bg-rose-50 text-rose-800 border-rose-200' },
  repairing: { label: 'Being repaired', tone: 'bg-blue-50 text-blue-800 border-blue-200' },
  resolved: { label: 'Repaired', tone: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  awaiting_return: { label: 'Return the garment', tone: 'bg-amber-50 text-amber-800 border-amber-200' },
  refunded: { label: 'Refunded', tone: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
};

export const shortDate = (d: string | null) =>
  d ? new Date(`${d.slice(0, 10)}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

export const peso =(n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const claimDate = (d: string | null) =>
  d ? new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
