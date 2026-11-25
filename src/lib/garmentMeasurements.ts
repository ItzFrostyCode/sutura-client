/**
 * Which body measurements an order asks for, by its Garment Type (Top,
 * Bottom, Full Set…). Shared by the walk-in Create Job Order wizard and the
 * customer's online order form, so both ask for exactly the same fields.
 *
 * "length" used to be one field for every garment; it is split into
 * top_length and pants_length so a Full Set can hold both. Older orders and
 * saved profiles may still carry "length" — LABELS keeps a name for it.
 */

export type MeasurementKey =
  | 'chest' | 'waist' | 'hips' | 'shoulders'
  | 'top_length' | 'pants_length'
  | 'neck' | 'sleeve' | 'inseam';

export type BodyMeasurements = { unit: 'in' | 'cm' } & Record<MeasurementKey, string>;

export const MEASUREMENT_FIELDS: { key: MeasurementKey; label: string; hint: string }[] = [
  { key: 'chest', label: 'Chest / Bust', hint: '38' },
  { key: 'waist', label: 'Waist', hint: '32' },
  { key: 'hips', label: 'Hips', hint: '40' },
  { key: 'shoulders', label: 'Shoulders', hint: '17.5' },
  { key: 'neck', label: 'Neck', hint: '15.5' },
  { key: 'sleeve', label: 'Sleeve', hint: '24' },
  { key: 'top_length', label: 'Top length', hint: '29' },
  { key: 'pants_length', label: 'Pants length', hint: '40' },
  { key: 'inseam', label: 'Inseam', hint: '31' },
];

const ALL: MeasurementKey[] = MEASUREMENT_FIELDS.map((f) => f.key);
const TOP: MeasurementKey[] = ['chest', 'waist', 'shoulders', 'neck', 'sleeve', 'top_length'];

const BY_GARMENT: Record<string, MeasurementKey[]> = {
  top: TOP,
  outerwear: TOP,
  bottom: ['waist', 'hips', 'inseam', 'pants_length'],
  gown_dress: ['chest', 'waist', 'hips', 'shoulders', 'neck', 'sleeve', 'top_length'],
  full_set: ALL,
};

/** The measurement keys to ask for. Unknown / unpicked types ask for everything. */
export function measurementKeysFor(garment: string | null | undefined): MeasurementKey[] {
  return (garment && BY_GARMENT[garment]) || ALL;
}

export function measurementFieldsFor(garment: string | null | undefined) {
  const keys = new Set(measurementKeysFor(garment));
  return MEASUREMENT_FIELDS.map((f) =>
    // A gown's length runs to the hem, so name it that way.
    f.key === 'top_length' && garment === 'gown_dress' ? { ...f, label: 'Dress length', hint: '58' } : f
  ).filter((f) => keys.has(f.key));
}

export const EMPTY_BODY_MEASUREMENTS: BodyMeasurements = {
  unit: 'in', chest: '', waist: '', hips: '', shoulders: '', top_length: '', pants_length: '', neck: '', sleeve: '', inseam: '',
};

/** Only the fields asked for this garment, so hidden fields never get saved. */
export function pickMeasurements(m: BodyMeasurements, garment: string | null | undefined): Partial<BodyMeasurements> {
  const out: Partial<BodyMeasurements> = { unit: m.unit };
  for (const key of measurementKeysFor(garment)) out[key] = m[key];
  return out;
}

export function hasAnyMeasurement(m: BodyMeasurements, garment: string | null | undefined): boolean {
  return measurementKeysFor(garment).some((k) => m[k].trim() !== '');
}

/** Saved profile metrics → form fields (older profiles used other key names). */
export function measurementsFromMetrics(metrics: Record<string, string | undefined> | null | undefined): Partial<BodyMeasurements> {
  if (!metrics) return {};
  const pick = (...keys: string[]) => keys.map((k) => metrics[k]).find((v) => v !== undefined && v !== null && String(v).trim() !== '');
  const out: Partial<BodyMeasurements> = {};
  const set = (key: MeasurementKey, v: string | undefined) => { if (v) out[key] = String(v); };
  set('chest', pick('chest', 'bust'));
  set('waist', pick('waist'));
  set('hips', pick('hips'));
  set('shoulders', pick('shoulders', 'shoulder'));
  set('neck', pick('neck'));
  set('sleeve', pick('sleeve', 'sleeve_length'));
  set('top_length', pick('top_length', 'length', 'shirt_length'));
  set('pants_length', pick('pants_length', 'trouser_length', 'outseam'));
  set('inseam', pick('inseam'));
  return out;
}

/** Display names for every key an order or profile may hold (incl. the old "length"). */
export const MEASUREMENT_LABELS: Record<string, string> = {
  ...Object.fromEntries(MEASUREMENT_FIELDS.map((f) => [f.key, f.label])),
  length: 'Length',
};
