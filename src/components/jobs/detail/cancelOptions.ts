import { CANCELLATION_REASON_LABELS } from '../jobHelpers';
import type { RadioOption } from '../ui/RadioGroup';

export const AGREED_VIA_LABELS: Record<string, string> = {
  in_person: 'In person',
  message: 'Text or chat',
  phone: 'Phone call',
  online: 'They cancelled online',
};

export const AGREED_VIA_OPTIONS: RadioOption[] = Object.entries(AGREED_VIA_LABELS).map(([value, label]) => ({ value, label }));

export const REASON_OPTIONS: RadioOption[] = Object.entries(CANCELLATION_REASON_LABELS).map(([value, label]) => ({ value, label }));

export interface CancellationRecord { agreed_via?: string; note?: string | null; by?: number; at?: string }

/** "Cancelled Oct 22 · Customer requested cancellation · Customer agreed in person", from what the cancel action stored. */
export function cancelledLine(job: { status: string; cancellation_reason?: string | null; custom_order_data?: Record<string, unknown> | null }): string | null {
  if (job.status !== 'cancelled') return null;
  const rec = job.custom_order_data?.cancellation as CancellationRecord | undefined;
  const parts = ['Cancelled'];
  if (rec?.at) parts[0] = `Cancelled ${new Date(rec.at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  if (job.cancellation_reason) parts.push(CANCELLATION_REASON_LABELS[job.cancellation_reason] ?? job.cancellation_reason);
  if (rec?.agreed_via) parts.push(`Customer agreed ${(AGREED_VIA_LABELS[rec.agreed_via] ?? rec.agreed_via).toLowerCase()}`);
  return parts.join(' · ');
}
