import {
  Clock, Palette, Ruler, Scissors, Shirt, Wrench, Sparkles, Package, Flag, AlertCircle, Ban, PauseCircle,
} from 'lucide-react';
import { CUSTOMER_PHASE_STATUS_MAP, TERMINAL_STATUSES } from '@/components/shared/OrderTrackingView';

export interface MyOrder {
  id: number;
  order_number: string;
  tracking_code: string;
  status: string;
  garment_category: string | null;
  catalog_item_name: string | null;
  service_name: string | null;
  is_rush: boolean;
  due_date: string | null;
  total_amount: number;
  balance: number;
  payment_status: string;
  created_at: string;
  store: { name: string; slug: string; logo_path: string | null } | null;
}

export const STATUS_META: Record<string, { label: string; Icon: typeof Clock; tone: string }> = {
  pending: { label: 'Pending', Icon: Clock, tone: 'text-ink-muted bg-sunken border-line' },
  design: { label: 'Design', Icon: Palette, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  pattern_making: { label: 'Pattern Making', Icon: Ruler, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  mass_cutting_printing: { label: 'Cutting & Printing', Icon: Scissors, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  cutting: { label: 'Cutting', Icon: Scissors, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  sewing: { label: 'Sewing', Icon: Shirt, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  ready_for_fitting: { label: 'Ready for Fitting', Icon: Ruler, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  final_adjustments: { label: 'Final Adjustments', Icon: Wrench, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  qc_ironing: { label: 'QC & Ironing', Icon: Sparkles, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  ready_for_pickup: { label: 'Ready for Pickup', Icon: Package, tone: 'text-sage bg-sage/10 border-sage/20' },
  completed: { label: 'Completed', Icon: Flag, tone: 'text-sage bg-sage/10 border-sage/20' },
  cancelled: { label: 'Cancelled', Icon: Ban, tone: 'text-danger bg-danger/10 border-danger/20' },
  rejected: { label: 'Rejected', Icon: AlertCircle, tone: 'text-danger bg-danger/10 border-danger/20' },
  on_hold: { label: 'On Hold', Icon: PauseCircle, tone: 'text-ink-muted bg-sunken border-line' },
};

export const IN_PRODUCTION = new Set([
  'pending', 'design', 'pattern_making', 'mass_cutting_printing', 'cutting',
  'sewing', 'ready_for_fitting', 'final_adjustments', 'qc_ironing', 'on_hold',
]);

/**
 * List-card badge: the collapsed 6-phase view (CUSTOMER-WORKFLOW.md §12),
 * not the full internal pipeline STATUS_META above still renders on the
 * order detail page's stepper. Terminal exceptions (cancelled/rejected/
 * on_hold) keep their own distinct styling instead of being folded into a
 * phase, same rule OrderTrackingView.tsx applies.
 */
const PHASE_TONE: Record<string, { Icon: typeof Clock; tone: string }> = {
  'Order Received': { Icon: Clock, tone: 'text-ink-muted bg-sunken border-line' },
  'In Production': { Icon: Shirt, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  'Fitting / Adjustment': { Icon: Ruler, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  Finalizing: { Icon: Sparkles, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  'Ready for Pickup': { Icon: Package, tone: 'text-sage bg-sage/10 border-sage/20' },
  Completed: { Icon: Flag, tone: 'text-sage bg-sage/10 border-sage/20' },
};

export function getPhaseMeta(status: string): { label: string; Icon: typeof Clock; tone: string } {
  if (status in TERMINAL_STATUSES) {
    const t = TERMINAL_STATUSES[status];
    return { label: t.label, Icon: t.Icon, tone: t.tone };
  }
  const phase = CUSTOMER_PHASE_STATUS_MAP[status];
  if (phase && PHASE_TONE[phase]) {
    return { label: phase, ...PHASE_TONE[phase] };
  }
  return STATUS_META[status] ?? STATUS_META.pending;
}

export const TABS: { key: string; label: string; match: (status: string) => boolean }[] = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'production', label: 'In Production', match: (s) => IN_PRODUCTION.has(s) },
  { key: 'pickup', label: 'Ready for Pickup', match: (s) => s === 'ready_for_pickup' },
  { key: 'completed', label: 'Completed', match: (s) => s === 'completed' },
  { key: 'cancelled', label: 'Cancelled', match: (s) => s === 'cancelled' || s === 'rejected' },
];
