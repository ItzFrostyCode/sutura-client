// Kinds of uniform (2026-11-14). Office / School / Medical / Maritime were merged into one
// "Uniform" service; each uniform service picks one of these as its type (service_leaf_type),
// and customers narrow "Uniform" by them. Mirrors CanonicalTaxonomy::UNIFORM_TYPES.
export const UNIFORM_TYPES: { value: string; label: string }[] = [
  { value: 'school_uniforms', label: 'School' },
  { value: 'office_uniforms', label: 'Office / Corporate' },
  { value: 'medical_uniforms', label: 'Medical' },
  { value: 'maritime_uniforms', label: 'Maritime' },
  { value: 'police_uniforms', label: 'PNP / Police' },
  { value: 'military_uniforms', label: 'AFP / Military' },
  { value: 'fire_uniforms', label: 'BFP / Fire' },
  { value: 'security_uniforms', label: 'Security Guard' },
  { value: 'hospitality_uniforms', label: 'Hospitality' },
  { value: 'other_uniforms', label: 'Other uniform' },
];

export const uniformTypeLabel = (value: string) => UNIFORM_TYPES.find((t) => t.value === value)?.label ?? value;

// First match wins; same order as the server migration's guesses.
const GUESSES: [RegExp, string][] = [
  [/\b(pnp|police|pulis)\b/i, 'police_uniforms'],
  [/\b(bfp|fire|bombero)\b/i, 'fire_uniforms'],
  [/\b(afp|army|military|navy|air force|rotc)\b/i, 'military_uniforms'],
  [/\b(security|guard)\b/i, 'security_uniforms'],
  [/\b(maritime|seaman|seafarer|marine)\b/i, 'maritime_uniforms'],
  [/\b(medical|nurse|nursing|scrubs?|hospital|doctor|lab coat)\b/i, 'medical_uniforms'],
  [/\b(school|student|deped|p\.?e\.?)\b/i, 'school_uniforms'],
  [/\b(hotel|restaurant|chef|waiter|resort|hospitality)\b/i, 'hospitality_uniforms'],
  [/\b(office|corporate|company|bank)\b/i, 'office_uniforms'],
];

/** A suggested type from the service name ("PNP Uniform" → PNP / Police); the owner can change it. */
export function guessUniformType(name: string): string {
  return GUESSES.find(([re]) => re.test(name))?.[1] ?? 'other_uniforms';
}
