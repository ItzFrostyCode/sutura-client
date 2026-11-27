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

/**
 * The body part a measurement belongs to, for reading a recorded sheet (My Measurements). Tailors measure more than a
 * top and a bottom: arms, lengths (shirt, gown, barong, height) and the shop's own custom fields each get their place.
 * Decided by the field name, exact names first, then words in the name; anything unknown goes to "Other".
 */
export const BODY_PARTS = ['Upper body', 'Arms', 'Lower body', 'Lengths', 'Other'] as const;
export type BodyPart = (typeof BODY_PARTS)[number];

const EXACT: Record<string, BodyPart> = {
  chest: 'Upper body', bust: 'Upper body', 'under bust': 'Upper body', underbust: 'Upper body', 'upper bust': 'Upper body',
  shoulder: 'Upper body', shoulders: 'Upper body', 'shoulder width': 'Upper body', neck: 'Upper body', collar: 'Upper body',
  'across back': 'Upper body', 'across chest': 'Upper body', 'back width': 'Upper body', 'front width': 'Upper body',
  armhole: 'Upper body', 'arm hole': 'Upper body', 'bust point': 'Upper body',
  sleeve: 'Arms', 'sleeve length': 'Arms', 'long sleeve': 'Arms', 'short sleeve': 'Arms', bicep: 'Arms', biceps: 'Arms',
  elbow: 'Arms', forearm: 'Arms', wrist: 'Arms', cuff: 'Arms', 'arm length': 'Arms', 'upper arm': 'Arms',
  hip: 'Lower body', seat: 'Lower body', calf: 'Lower body',
};

export function bodyPartOf(rawKey: string): BodyPart {
  const key = rawKey.toLowerCase().replaceAll('_', ' ').trim();
  if (EXACT[key]) return EXACT[key];
  if (KNOWN_BOTTOM_KEYS.has(key)) return key === 'skirt length' ? 'Lengths' : 'Lower body';
  if (/sleeve|wrist|bicep|elbow|forearm|cuff/.test(key)) return 'Arms';
  if (/length|height|to knee|to floor|to ankle|to waist|nape/.test(key)) return 'Lengths';
  if (/waist|hip|thigh|knee|ankle|inseam|outseam|crotch|rise|seat|leg|calf/.test(key)) return 'Lower body';
  if (/chest|bust|shoulder|neck|collar|back|armhole/.test(key)) return 'Upper body';
  return 'Other';
}

/** The filled-in sizes grouped by body part, in BODY_PARTS order (empty parts left out), each in the order typed. */
export function groupByBodyPart(metrics: Record<string, unknown> | null | undefined): { part: BodyPart; rows: [string, string][] }[] {
  const { top, bottom } = splitByArea(metrics);
  const byPart = new Map<BodyPart, [string, string][]>();
  for (const row of [...top, ...bottom]) {
    const part = bodyPartOf(row[0]);
    byPart.set(part, [...(byPart.get(part) ?? []), row]);
  }
  return BODY_PARTS.filter((p) => byPart.has(p)).map((part) => ({ part, rows: byPart.get(part)! }));
}
