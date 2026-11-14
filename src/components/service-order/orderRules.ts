import type { StoreBranch } from '@/components/store-storefront/types';
import type { OrderService } from './useOrderData';
import { CUSTOM_FIT, customArea, rowArea, type OrderForm } from './useOrderForm';
import { autoAnswers, type AnswerContext } from './orderQuestions';
import { measureProblem, pointsFor, type Area, type MeasuringPoint } from './orderPoints';

export interface RuleContext {
  phoneOk: boolean;
  branches: StoreBranch[];
  f: OrderForm;
  pricing: NonNullable<OrderService['pricing']>;
  answerContext: AnswerContext;
  area: Area | '';
  areaLocked: boolean;
  measurementsNeeded: boolean;
  sizesNeeded: boolean;
  /** A group is sized by the shop's chart (else each person's measurements are typed in a table, any of them optional). */
  chartSizes: boolean;
  groupMin: number;
  points: readonly MeasuringPoint[];
  service: OrderService | null;
  gcash: boolean;
}

const required = (pts: readonly MeasuringPoint[]) => pts.filter((p) => !p.optional);

/** The one sentence that says what is still missing on a step, or null when the step is complete. */
export function stepProblem(step: number, c: RuleContext): string | null {
  const { f } = c;
  if (step === 1) {
    if (!c.phoneOk) return 'Enter your 11-digit mobile number starting with 09.';
    if (c.branches.length > 1 && f.branchId === null) return 'Choose the branch for your fittings and pickup.';
    return null;
  }
  if (step === 2) {
    if (c.pricing.length > 1 && f.pricingId === null) return 'Choose an option.';
    if (c.sizesNeeded && !c.area) return 'Choose Top, Bottom or Top & Bottom.';
    if (f.mode === 'individual' && (f.quantity < 1 || f.quantity > 500)) return 'Enter how many pieces (1 to 500).';
    return null;
  }
  if (step === 3) return c.sizesNeeded || f.mode === 'group' ? sizesProblem(c) : null;
  if (step === 4) {
    if (f.material === '') return 'Choose who supplies the fabric.';
    // A question the order already answers (team name, names, size count, fabric) is never asked again.
    const auto = autoAnswers(f, c.service?.custom_fields ?? [], c.answerContext);
    const missing = (c.service?.custom_fields ?? []).find((q) => {
      const field = q as unknown as { label?: string; type?: string; required?: boolean };
      if (field.label && auto[field.label.trim()]) return false;
      return field.required && field.type !== 'checkbox' && field.label?.trim() && !(f.answers[field.label] ?? '').trim();
    }) as { label?: string } | undefined;
    if (missing) return `Answer the shop's question: ${missing.label}`;
    return null;
  }
  if (step === 5) {
    if (f.payMethod === '') return 'Choose how you will pay once the shop confirms the price.';
    if (f.payMethod === 'gcash' && !c.gcash) return 'This shop has no GCash account yet. Choose Cash at the shop.';
    return null;
  }
  return null;
}

function sizesProblem(c: RuleContext): string | null {
  const { f } = c;
  if (f.mode === 'group') {
    if (!f.teamName.trim()) return 'Type the team or group name.';
    if (f.roster.length < c.groupMin) return `A group order needs at least ${c.groupMin} people. Add ${c.groupMin - f.roster.length} more.`;
    const unnamed = f.roster.filter((r) => !r.name.trim()).length;
    if (unnamed > 0) return `${unnamed} of ${f.roster.length} names left to type.`;
    // Every typed number must be a real measurement in its own unit (≤ 80 in / 200 cm), whichever way the group is sized.
    for (const r of f.roster) {
      for (const [label, v] of Object.entries(r.fit)) {
        if (measureProblem(v, r.units[label] ?? (c.chartSizes ? f.unit || 'in' : 'in'))) return `Check ${r.name.trim() || 'a person'}'s ${label}: it can't be ${v}.`;
      }
    }
    if (!c.sizesNeeded || !c.chartSizes) return null;
    const noSize = f.roster.filter((r) => !r.size || (rowArea(r, c.area, c.areaLocked) === 'both' && !r.bottomSize));
    if (noSize.length > 0) return `${noSize.length} ${noSize.length === 1 ? 'person needs a size' : 'people need a size'}: ${noSize.slice(0, 3).map((r) => r.name.trim()).join(', ')}${noSize.length > 3 ? '…' : ''}.`;
    for (const r of f.roster) {
      if (r.size === CUSTOM_FIT || r.bottomSize === CUSTOM_FIT) {
        if (!f.unit) return 'Choose inches or centimeters for the Custom Fit measurements.';
        const pts = required(pointsFor(customArea(r, rowArea(r, c.area, c.areaLocked))));
        if (pts.some((p) => !(r.fit[p.label] ?? '').trim())) return `Add ${r.name.trim()}'s Custom Fit measurements.`;
      }
    }
    return null;
  }
  // No body measurements for this service: the size comes from the chart.
  const source = c.measurementsNeeded ? f.source : 'standard';
  if (source === 'saved' && f.measurementId === null) return 'Choose the measurements on file to use.';
  if (source === 'standard') {
    if (!f.size) return c.area === 'both' ? 'Choose the top size.' : 'Choose a size.';
    if (c.area === 'both' && !f.sizeBottom) return 'Choose the bottom size.';
  }
  if (source === 'own') {
    if (!f.unit) return 'Choose inches or centimeters first.';
    const wrong = c.points.find((p) => measureProblem(f.points[p.key] ?? '', f.unit as 'in' | 'cm'));
    if (wrong) return `Check your ${wrong.label.toLowerCase()}: it can't be ${f.points[wrong.key]} ${f.unit}.`;
    const empty = required(c.points).find((p) => !(f.points[p.key] ?? '').trim());
    if (empty && f.sheets.length === 0) return `Enter your ${empty.label.toLowerCase()}, or attach a photo of your measurement card.`;
  }
  return null;
}
