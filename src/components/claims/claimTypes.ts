// After-sale claims ("Report a problem"). Same shapes as the server's OrderClaim, so this works on either server.

export type ClaimType = 'repair' | 'refund';
export type ClaimReason = 'poor_stitching' | 'wrong_fit' | 'damaged' | 'other';
export type ClaimStatus = 'submitted' | 'repair_offered' | 'repairing' | 'resolved' | 'declined' | 'awaiting_return' | 'refunded';

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
  /** Set when the shop offered a free repair instead of a refund. */
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

export const MAX_CLAIM_PHOTOS = 5;

export const CLAIM_REASONS: { value: ClaimReason; label: string }[] = [
  { value: 'poor_stitching', label: 'Poor stitching' },
  { value: 'wrong_fit', label: 'Wrong fit' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'other', label: 'Something else' },
];

export const reasonLabel = (r: ClaimReason) => CLAIM_REASONS.find((x) => x.value === r)?.label ?? r;

/** Status words and pill colours, written for the customer. */
export const CLAIM_STATUS: Record<ClaimStatus, { label: string; tone: string }> = {
  submitted: { label: 'Waiting for the shop', tone: 'bg-amber-50 text-amber-800' },
  repair_offered: { label: 'Shop offered a free repair', tone: 'bg-blue-50 text-blue-700' },
  repairing: { label: 'Being repaired', tone: 'bg-blue-50 text-blue-700' },
  resolved: { label: 'Repaired', tone: 'bg-sage/10 text-sage' },
  declined: { label: 'Declined', tone: 'bg-danger/10 text-danger' },
  awaiting_return: { label: 'Return the garment', tone: 'bg-amber-50 text-amber-800' },
  refunded: { label: 'Refunded', tone: 'bg-sage/10 text-sage' },
};

export const peso = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

/** Date with a time (when something was sent or decided). */
export const claimDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

/** Plain calendar date; a "YYYY-MM-DD" value is read as that day, not shifted by the time zone. */
export const claimDay = (iso: string | null) =>
  iso ? new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
