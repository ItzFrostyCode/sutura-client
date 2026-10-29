import { areaOf, customParts, FIT_PREFIX, hasAllSizes } from '../rosterHelpers';
import type { JobCreateForm } from '../useJobCreateForm';

/**
 * The four steps of New Job Order. Bongo's approved flow is Customer → Measurements → Specifications → Invoice & Payment; the
 * service is chosen before sizing here because whether measurements are needed (and which size chart applies) comes from the service.
 */
export const WIZARD_STEPS = [
  { id: 1, label: 'Customer' },
  { id: 2, label: 'Order details' },
  { id: 3, label: 'Sizing' },
  { id: 4, label: 'Review & pay' },
] as const;

export const LAST_STEP = WIZARD_STEPS.length;

/**
 * What still stops someone from leaving a step, in plain words (null = fine to go on).
 * It only keeps a gap from travelling to the end: the server's own rules are unchanged, and measuring can always be
 * left for later, so the Sizing step never blocks.
 */
export function stepProblem(step: number, form: JobCreateForm): string | null {
  if (step === 1 && !form.formData.customer_id) return 'Choose the customer first.';
  if (step === 2) {
    if (!form.formData.service_id) return 'Choose the service.';
    if (form.optionRequired) return 'Choose which option this order is for. It sets what is covered and what one unit is.';
    if (form.isRepair && !form.damageNotes.trim()) return 'Write down the garment’s condition before taking it in (stains, tears, missing buttons).';
  }
  if (step === 3) return sizingProblem(form);
  if (step === 4 && !form.isRepair && !form.pricing.dueDate) return 'Set the date the order is due.';
  return null;
}

/**
 * Sizing is required, and it starts with what the person gets: Top, Bottom or Top & Bottom comes first, for one person or for every
 * person on a team. Then every covered part has a size (Custom Fit needs its numbers), or the one wearer has measurements or a saved profile.
 */
function sizingProblem(form: JobCreateForm): string | null {
  if (form.isRepair || form.measurementHidden) return null;
  const people = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  if (form.isBulk) {
    const nameless = form.roster.filter((r) => !String(r.player_name ?? '').trim()).length;
    if (nameless > 0) return `${people(nameless, 'person has', 'people have')} no name yet. Type a name for everyone in the team list.`;
    const noArea = form.roster.filter((r) => !areaOf(r)).length;
    if (noArea > 0) return `${people(noArea, 'person has', 'people have')} not been set to Top, Bottom or Top & Bottom. Choose that first: it decides the sizes.`;
    const unsized = form.roster.filter((r) => !hasAllSizes(r)).length;
    if (unsized > 0) return `${people(unsized, 'person has', 'people have')} no size yet. Pick a size for every part, or Custom Fit to measure them.`;
    const unmeasured = form.roster.filter((r) => customParts(r).length > 0 && !r.measurement_id && !Object.entries(r).some(([k, v]) => k.startsWith(FIT_PREFIX) && String(v).trim() !== '')).length;
    return unmeasured > 0 ? `${people(unmeasured, 'person is', 'people are')} set to Custom Fit without measurements. Type them, or pick a size.` : null;
  }
  const area = form.inlineMeasurement.measurement_area;
  if (!area) return 'Choose what is being made first: Top, Bottom or Top & Bottom.';
  if (form.measurementMode === 'existing') return form.formData.measurement_id ? null : 'Pick the saved measurements to use, or take new ones.';
  if (form.measurementMode === 'standard_size') {
    const ok = (v: string) => Boolean(v) && v !== 'Custom Measurements';
    if (!ok(form.standardSize)) return area === 'both' ? 'Pick the top size.' : 'Pick the size.';
    return area === 'both' && !ok(form.standardSizeBottom) ? 'Pick the bottom size too.' : null;
  }
  const typed = Object.entries(form.inlineMeasurement.metrics ?? {}).some(([k, v]) => !k.startsWith('_') && k !== 'Style' && String(v).trim() !== '');
  return typed ? null : 'Measurements are required. Type at least one, or pick a saved or standard size.';
}

/** How the order is being sized, in a few words. */
export function sizingSummary(form: JobCreateForm): string {
  if (form.isBulk) {
    const unsized = form.roster.filter((r) => !hasAllSizes(r)).length;
    return unsized > 0 ? `${unsized} ${unsized === 1 ? 'person' : 'people'} still without a size` : 'Everyone has a size';
  }
  if (form.measurementHidden) return 'No measurements needed';
  switch (form.measurementMode) {
    case 'existing': return form.formData.measurement_id ? 'Saved measurements' : 'Saved measurements (none picked yet)';
    case 'record_now': return 'Custom fit, measured now';
    case 'standard_size': return `Standard size ${form.inlineMeasurement.measurement_area === 'both' ? `${form.standardSize} / ${form.standardSizeBottom}` : form.standardSize}`;
    default: return 'To be measured later';
  }
}

/** What is still open on the order, for the last look. These do not stop it from being created. */
export function openItems(form: JobCreateForm): string[] {
  const out: string[] = [];
  if (form.isBulk) {
    const unsized = form.roster.filter((r) => !hasAllSizes(r)).length;
    if (unsized > 0) out.push(`${unsized} ${unsized === 1 ? 'person has' : 'people have'} no size yet. Production cannot start until everyone has one.`);
  } else if (!form.measurementHidden) {
    if (form.measurementMode === 'none') out.push('Measurements are still to be taken. The order cannot be priced or started until they are recorded.');
    if (form.measurementMode === 'existing' && !form.formData.measurement_id) out.push('No saved measurements are picked yet.');
  }
  if (form.pricing.needsQuote && !form.pricing.price) out.push('No price yet. It can be quoted from Order Steps after the order is created.');
  return out;
}
