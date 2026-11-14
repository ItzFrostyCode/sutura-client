/**
 * Top and Bottom, the two parts the shop's measurement form is laid out in (New Job Order and the job's
 * "Edit measurements"). The form keeps field names flat in `metrics`, so which part a field belongs to is decided by
 * its name — one rule here, used by the form and by every screen that shows a recorded measurement, so a customer
 * reads their sizes in the same Top / Bottom groups the shop typed them in.
 */
export const KNOWN_BOTTOM_KEYS = new Set([
  'waist', 'hips', 'high hips', 'full hips', 'inseam', 'outseam', 'thigh', 'knee', 'bottom hem', 'crotch / rise',
  'crotch', 'rise', 'skirt length', 'leg opening', 'ankle',
]);

/**
 * Keys in `metrics` that are not sizes: `_unit` / `_area` (and any other `_` key), and the plain `unit` older records
 * used before `_unit`. Never shown as a measurement row anywhere.
 */
export const isInternalMetricKey = (key: string) => key.startsWith('_') || key.trim().toLowerCase() === 'unit';

export const isBottomField = (key: string) => KNOWN_BOTTOM_KEYS.has(key.toLowerCase().replaceAll('_', ' '));

/** The filled-in fields of a measurement, in Top and Bottom, in the order they were typed. Internal keys (`_unit`, `_area`) are left out. */
export function splitByArea(metrics: Record<string, unknown> | null | undefined): { top: [string, string][]; bottom: [string, string][] } {
  const top: [string, string][] = [];
  const bottom: [string, string][] = [];
  for (const [rawKey, raw] of Object.entries(metrics ?? {})) {
    let key = rawKey;
    let value = String(raw ?? '').trim();
    if (isInternalMetricKey(key) || value === '') continue;
    // Older online group orders put a centimeter value's unit in the name ("Waist (cm)": "90"): read it as "Waist": "90 cm".
    const cm = /^(.*?)\s*\(cm\)$/i.exec(key);
    if (cm) {
      key = cm[1];
      if (!/(in|cm)\s*$/i.test(value)) value = `${value} cm`;
    }
    (isBottomField(key) ? bottom : top).push([key, value]);
  }
  return { top, bottom };
}
