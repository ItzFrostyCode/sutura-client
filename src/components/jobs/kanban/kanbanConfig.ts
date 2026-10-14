import type { Job } from '../jobHelpers';

/** A limit this big means "no limit" (Completed, On Hold). */
export const WIP_UNLIMITED = 999;

/**
 * Work-in-progress limits per column — how many orders a stage should hold at once.
 * Dragging a card into a full column is refused (the column shakes and says so); the
 * Approve button and the card's "Move to" menu are not limited, so a busy day never
 * locks the shop out. Tune the numbers here.
 */
export const WIP_LIMITS: Record<string, number> = {
  pending: 6,
  confirmed: 6,
  awaiting_materials: 6,
  design: 3,
  pattern_making: 2,
  mass_cutting_printing: 3,
  cutting: 3,
  sewing: 3,
  ready_for_fitting: 3,
  final_adjustments: 2,
  qc_ironing: 3,
  ready_for_pickup: 6,
  balance_handover: 6,
  queued: 3,
  in_repair: 2,
  qc_check: 2,
  completed: WIP_UNLIMITED,
  on_hold: WIP_UNLIMITED,
};

/** The band each column sits under, so the board reads in the workflow's order. */
const PHASE_OF: Record<string, string> = {
  pending: 'Set up', confirmed: 'Set up', awaiting_materials: 'Set up',
  queued: 'Repairs', in_repair: 'Repairs', qc_check: 'Repairs',
  design: 'In production', pattern_making: 'In production', mass_cutting_printing: 'In production', cutting: 'In production', sewing: 'In production',
  qc_ironing: 'Quality check',
  ready_for_pickup: 'Fitting & collection', ready_for_fitting: 'Fitting & collection', final_adjustments: 'Fitting & collection',
  balance_handover: 'Handover', completed: 'Handover',
};

export function phaseOf(colId: string): string {
  return PHASE_OF[colId] ?? '';
}

export type WipState = 'ok' | 'near' | 'full';

export function wipLimitFor(colId: string): number {
  return WIP_LIMITS[colId] ?? WIP_UNLIMITED;
}

export function wipState(count: number, limit: number): WipState {
  if (limit >= WIP_UNLIMITED) return 'ok';
  if (count >= limit) return 'full';
  return count === limit - 1 ? 'near' : 'ok';
}

export type DeptKey = 'men' | 'women' | 'children' | 'service' | 'other';

export const DEPT_TABS: { id: DeptKey; label: string; title: string }[] = [
  { id: 'men', label: 'MEN', title: "Men's apparel (Barong Tagalog, suits)" },
  { id: 'women', label: 'WOMEN', title: "Women's apparel (gowns, Filipiniana)" },
  { id: 'children', label: 'KIDS', title: 'Kids, uniforms and teamwear' },
  { id: 'service', label: 'SERVICE', title: 'Alterations, repairs and resizing' },
];

export const DEPT_LANE_TITLES: Record<DeptKey, string> = {
  men: "Men's Apparel",
  women: "Women's Apparel",
  children: 'Kids & Uniforms',
  service: 'Services (Alterations & Repairs)',
  other: 'Other / Unclassified',
};

const MEN = ['barong', 'suit'];
const WOMEN = ['gown', 'filipiniana'];
const CHILDREN = ['uniform', 'lab_gown', 'scrub_suit'];

/** Which department an order belongs to: its design/service first, then the garment category. */
export function departmentOf(job: Job): DeptKey {
  if (job.garment_category === 'alteration_repair') return 'service';
  const raw = (job.catalog_item?.department ?? job.service?.department ?? '').toLowerCase();
  if (raw === 'men' || raw === 'women') return raw;
  if (raw === 'children' || raw === 'kids') return 'children';
  const cat = job.garment_category ?? '';
  if (MEN.includes(cat)) return 'men';
  if (WOMEN.includes(cat)) return 'women';
  if (CHILDREN.includes(cat)) return 'children';
  // Services without a department: team jerseys and uniforms are the "Kids & Uniforms" lane,
  // repairs and alterations are the "Service" lane.
  const name = job.service?.name ?? '';
  if (job.service?.service_types?.includes('bulk_sublimation') || /uniform|jersey|teamwear|school/i.test(name)) return 'children';
  if (/alteration|repair|resiz/i.test(name)) return 'service';
  return 'other';
}
