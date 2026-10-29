/**
 * Body measurements are taken in inches or centimeters: Philippine tailors use both (tape measures sold here carry both
 * scales, and shops vary), so the unit is chosen when measuring and kept with the measurement (`_unit`). Older
 * measurements have no unit and are inches, which is what the shop screens have always shown.
 */
export type MeasureUnit = 'in' | 'cm';

export const unitOfMetrics = (metrics?: Record<string, unknown> | null): MeasureUnit => (metrics?._unit === 'cm' ? 'cm' : 'in');

export const unitMark = (unit: MeasureUnit): string => (unit === 'cm' ? ' cm' : '″');

/** "38″" or "96.5 cm"; text such as a style ("Polo") is left alone. */
export function withUnit(value: unknown, unit: MeasureUnit): string {
  const text = String(value ?? '');
  const numeric = text.trim() !== '' && Number.isFinite(Number(text.replace(',', '.')));
  return numeric ? `${text}${unitMark(unit)}` : text;
}

/** Converts a typed number between units (1 inch = 2.54 cm), to one decimal; text such as a style is returned unchanged. */
export function convertValue(value: unknown, from: MeasureUnit, to: MeasureUnit): string {
  const text = String(value ?? '');
  const n = Number(text.replace(',', '.'));
  if (text.trim() === '' || !Number.isFinite(n) || from === to) return text;
  const out = from === 'in' ? n * 2.54 : n / 2.54;
  return String(Math.round(out * 10) / 10);
}

/**
 * One field can be in its own unit: a value in the record's unit is plain ("38"), a value in the other unit carries it ("96.5 cm"),
 * so nothing is converted or rounded and every screen that shows a measurement still reads it right.
 */
export function splitMeasure(value: unknown, recordUnit: MeasureUnit): { number: string; unit: MeasureUnit; explicit: boolean } {
  const m = /^\s*(.*?)\s*(in|cm)?\s*$/i.exec(String(value ?? ''));
  const unit = m?.[2]?.toLowerCase() as MeasureUnit | undefined;
  return { number: m?.[1] ?? '', unit: unit ?? recordUnit, explicit: Boolean(unit) };
}

export function joinMeasure(number: string, unit: MeasureUnit, recordUnit: MeasureUnit): string {
  const n = number.trim();
  return n === '' || unit === recordUnit ? n : `${n} ${unit}`;
}
