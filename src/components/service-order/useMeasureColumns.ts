'use client';

import type { ServiceOrderState } from './useServiceOrder';
import { rowArea } from './useOrderForm';
import { tableColumns, type MeasuringPoint } from './orderPoints';

/** The fit a person is cut for. Optional: a blank means the shop decides or asks. Describes the garment, not the person. */
export const CUTS = ["Men's", "Ladies'", 'Kids'] as const;
export const CUT_COLUMN = 'Cut';
export const CUT_TIP = "The pattern the shop cuts from: a men's cut is straighter; a ladies' cut is shaped at the bust and waist. Choose the fit the person prefers, or leave it blank.";

/**
 * The measuring columns of a Group order typed without a shop size chart, shared by the table (tablet/desktop) and the
 * cards (phone): which parts are shown (only what someone gets), which columns are visible, removed or added, and each
 * column's unit.
 */
export function useMeasureColumns(o: ServiceOrderState) {
  const { f } = o;
  const parts = f.roster.map((r) => rowArea(r, o.area, o.areaLocked) || 'both');
  const showTop = parts.some((p) => p !== 'bottom');
  const showBottom = parts.some((p) => p !== 'top');
  const allTop = tableColumns('top', f.customCols.top);
  const allBottom = tableColumns('bottom', f.customCols.bottom);
  const visible = (pts: readonly MeasuringPoint[]) => pts.filter((p) => !f.hiddenCols.includes(p.label));
  const top = showTop ? visible(allTop) : [];
  const bottom = showBottom ? visible(allBottom) : [];
  const removed = [...(showTop ? allTop : []), ...(showBottom ? allBottom : [])].filter((p) => f.hiddenCols.includes(p.label));
  const taken = [...allTop, ...allBottom].map((p) => p.label);
  const isCustom = (label: string) => f.customCols.top.includes(label) || f.customCols.bottom.includes(label);

  return {
    showTop, showBottom, top, bottom, removed, taken,
    // A column the customer added is deleted when removed; a standard one is only hidden (and can be put back).
    removeCol: (label: string) => (isCustom(label) ? f.removeCustomCol(label) : f.toggleCol(label)),
    getsOf: (r: (typeof f.roster)[number]) => rowArea(r, o.area, o.areaLocked) || 'both',
  };
}

export type MeasureColumns = ReturnType<typeof useMeasureColumns>;
