/**
 * The body measuring points an online order asks for, per part. The keys are the ones the server and the walk-in form
 * read (individual_measurements.*); the label is what the customer sees and the tip says exactly where to measure.
 */
export type Part = 'top' | 'bottom';
export type Unit = 'in' | 'cm';

export interface MeasuringPoint {
  readonly key: string;
  readonly label: string;
  readonly tip: string;
  readonly optional?: boolean;
  /** A typical adult value in inches, shown as the placeholder (converted for cm, never stored). */
  readonly sampleIn: number;
}

export const TOP_POINTS: readonly MeasuringPoint[] = [
  { key: 'chest', label: 'Chest / Bust', tip: 'Around the fullest part of the chest, under the arms.', sampleIn: 38 },
  { key: 'shoulders', label: 'Shoulder width', tip: 'From one shoulder tip to the other, across the back.', sampleIn: 17.5 },
  { key: 'length', label: 'Top length', tip: 'From the base of the neck at the back down to where the top should end.', sampleIn: 29 },
  { key: 'sleeve', label: 'Sleeve length', tip: 'From the shoulder tip down to the wrist.', sampleIn: 24, optional: true },
  { key: 'neck', label: 'Neck', tip: 'Around the base of the neck, one finger loose.', sampleIn: 15.5, optional: true },
];

export const BOTTOM_POINTS: readonly MeasuringPoint[] = [
  { key: 'waist', label: 'Waist', tip: 'Around where you wear your pants or skirt.', sampleIn: 32 },
  { key: 'hips', label: 'Hips', tip: 'Around the fullest part of the hips and seat.', sampleIn: 40 },
  { key: 'inseam', label: 'Inseam', tip: 'From the crotch down the inside of the leg to the ankle.', sampleIn: 31, optional: true },
];

export type Area = 'top' | 'bottom' | 'both';

export function pointsFor(area: Area | ''): readonly MeasuringPoint[] {
  if (area === 'top') return TOP_POINTS;
  if (area === 'bottom') return BOTTOM_POINTS;
  if (area === 'both') return [...TOP_POINTS, ...BOTTOM_POINTS];
  return [];
}

export const sample = (p: MeasuringPoint, unit: Unit) => (unit === 'cm' ? String(Math.round(p.sampleIn * 2.54)) : String(p.sampleIn));

export const UNIT_LABEL: Record<Unit, string> = { in: 'Inches', cm: 'Centimeters' };
export const UNIT_SHORT: Record<Unit, string> = { in: 'in', cm: 'cm' };

/** Ease the shop adds for comfort, said in the unit the customer chose. */
// The team's wording (Bongo's measuring tip): the customer adds the room for movement themselves.
export const EASE_TIP: Record<Unit, string> = {
  // Room is added around the body only: a length (sleeve, inseam, pants or top length) is entered as measured,
  // otherwise the garment comes out 3 inches too long.
  in: 'To ensure a comfortable fit, add 3 inches to your chest, waist and hips measurements. (Example: If your chest measures 38 inches, please enter 41.) Enter lengths (sleeve, inseam, pants length) as measured.',
  cm: 'To ensure a comfortable fit, add 7.5 cm (3 inches) to your chest, waist and hips measurements. (Example: If your chest measures 97 cm, please enter 104.5.) Enter lengths (sleeve, inseam, pants length) as measured.',
};

/** "09171234567": 11 digits that start with 09. */
export const PHONE_DIGITS = 11;
export const phoneDigits = (v: string) => v.replace(/\D/g, '').slice(0, PHONE_DIGITS);
export const isPhoneValid = (v: string) => /^09\d{9}$/.test(phoneDigits(v));
/** "0917 123 4567" for display while typing. */
export const formatPhone = (v: string) => {
  const d = phoneDigits(v);
  return [d.slice(0, 4), d.slice(4, 7), d.slice(7, 11)].filter(Boolean).join(' ');
};

/**
 * The full measuring columns of a Group order's table (used when the shop has no size chart): every top point, then
 * every bottom point. The customer removes the ones not needed; a blank cell is fine (the shop measures it).
 * Values are stored under the label (fit_metrics), the same keys the shop's team list reads.
 */
export const TABLE_TOP: readonly MeasuringPoint[] = [
  { key: 'chest', label: 'Chest', tip: 'Around the fullest part of the chest, under the arms.', sampleIn: 38 },
  { key: 'shirt_waist', label: 'Shirt waist', tip: 'Around the natural waist, where the top should follow the body.', sampleIn: 34 },
  { key: 'shirt_hip', label: 'Shirt hip', tip: 'Around the hips, where the hem of the top ends.', sampleIn: 40 },
  { key: 'shoulders', label: 'Shoulder', tip: 'Across the back, from one shoulder tip to the other.', sampleIn: 17.5 },
  { key: 'length', label: 'Top length', tip: 'From the base of the neck at the back down to where the top should end.', sampleIn: 29 },
  { key: 'sleeve', label: 'Sleeve', tip: 'From the shoulder tip down to where the sleeve should end.', sampleIn: 24 },
  { key: 'short_sleeve', label: 'Short sleeve', tip: 'From the shoulder tip down to where a short sleeve should end, above the elbow.', sampleIn: 9 },
  { key: 'back_width', label: 'Back width', tip: 'Across the back between the armpits, arms relaxed.', sampleIn: 15 },
  { key: 'neck', label: 'Neck', tip: 'Around the base of the neck, one finger loose.', sampleIn: 15.5 },
  { key: 'armhole', label: 'Armhole', tip: 'Around the arm where it meets the shoulder, through the armpit.', sampleIn: 18 },
  { key: 'bicep', label: 'Bicep', tip: 'Around the fullest part of the upper arm.', sampleIn: 13 },
  { key: 'elbow', label: 'Elbow', tip: 'Around the elbow, arm slightly bent.', sampleIn: 11 },
  { key: 'wrist', label: 'Wrist', tip: 'Around the wrist bone.', sampleIn: 7 },
];

export const TABLE_BOTTOM: readonly MeasuringPoint[] = [
  { key: 'waist', label: 'Waist', tip: 'Around where the pants or skirt will sit.', sampleIn: 32 },
  { key: 'hips', label: 'Hips', tip: 'Around the fullest part of the hips and seat.', sampleIn: 40 },
  { key: 'outseam', label: 'Pants length', tip: 'From the waist down the outside of the leg to where it should end.', sampleIn: 40 },
  { key: 'inseam', label: 'Inseam', tip: 'From the crotch down the inside of the leg to the ankle.', sampleIn: 31 },
  { key: 'thigh', label: 'Thigh', tip: 'Around the fullest part of the upper leg.', sampleIn: 22 },
  { key: 'knee', label: 'Knee', tip: 'Around the knee, leg straight.', sampleIn: 15 },
  { key: 'calf', label: 'Calf', tip: 'Around the fullest part of the lower leg.', sampleIn: 14 },
  { key: 'leg_opening', label: 'Leg opening', tip: 'Around the bottom of the pant leg, as wide as you want it.', sampleIn: 14 },
  { key: 'rise', label: 'Rise', tip: 'From the crotch up to the waistband, front.', sampleIn: 11 },
  { key: 'skirt_length', label: 'Skirt length', tip: 'From the waist down to where the skirt should end.', sampleIn: 24 },
];

/** The columns of one part: the standard ones, then the ones the customer added ("Collar"…). */
export function tableColumns(part: 'top' | 'bottom', custom: string[]): MeasuringPoint[] {
  const extra = custom.map((label) => ({ key: label, label, tip: 'A measurement you added. Write how you measured it in the notes if it helps the shop.', sampleIn: 0 }));
  return [...(part === 'top' ? TABLE_TOP : TABLE_BOTTOM), ...extra];
}

/** A table row's typed numbers, for the columns still shown and the part(s) the person gets; blanks are dropped. */
export function tableFit(
  fit: Record<string, string>, gets: Area | '', hidden: string[], units: Record<string, Unit> = {},
  custom: { top: string[]; bottom: string[] } = { top: [], bottom: [] },
): Record<string, string> {
  const cols = [...(gets === 'bottom' ? [] : tableColumns('top', custom.top)), ...(gets === 'top' ? [] : tableColumns('bottom', custom.bottom))];
  const out: Record<string, string> = {};
  for (const p of cols) {
    const v = (fit[p.label] ?? '').trim();
    // Inches by default; a value typed in centimeters carries its unit ("90 cm"), the same way the shop's own
    // measurement form saves a field switched to cm, so every screen reads it right (lib/measurementUnit splitMeasure).
    if (v && !hidden.includes(p.label)) out[p.label] = units[p.label] === 'cm' ? `${v} cm` : v;
  }
  return out;
}

/**
 * How big a body measurement can be, per unit. No body measurement passes 80 in / 200 cm (the largest are chest,
 * hips and pants length on a plus size or very tall person). Tailors work in quarter inches and half centimeters, so
 * inches take 2 decimals and centimeters 1. Inches still take a 3rd digit so a cm number typed by mistake (150) is
 * caught and offered "Switch to cm" instead of being cut to 15.
 */
export const UNIT_LIMIT: Record<Unit, { max: number; intDigits: number; decimals: number }> = {
  in: { max: 80, intDigits: 3, decimals: 2 },
  cm: { max: 200, intDigits: 3, decimals: 1 },
};

/** What the field keeps while typing: digits and one dot only, no more digits or decimals than the unit allows. */
export function cleanMeasure(raw: string, unit: Unit): string {
  const { intDigits, decimals } = UNIT_LIMIT[unit];
  const only = raw.replace(',', '.').replace(/[^\d.]/g, '');
  const [whole = '', ...rest] = only.split('.');
  const intPart = whole.replace(/^0+(?=\d)/, '').slice(0, intDigits);
  if (rest.length === 0) return intPart;
  return `${intPart || '0'}.${rest.join('').slice(0, decimals)}`;
}

/** Why a typed measurement is wrong, or null. In inches, a number that only fits centimeters is probably cm. */
export function measureProblem(value: string, unit: Unit): 'zero' | 'probably-cm' | 'too-big' | null {
  if (!value.trim()) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 'zero';
  if (n > UNIT_LIMIT[unit].max) return unit === 'in' && n <= UNIT_LIMIT.cm.max ? 'probably-cm' : 'too-big';
  return null;
}
