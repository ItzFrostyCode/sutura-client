import { SERVICE_GROUP_KEYS, capabilityLabel, type ServiceGroupKey } from './garmentTaxonomy';

/**
 * The same taxonomy in the customer's words. The shop's editor keeps its own labels ("Bulk / Batch Orders Accepted",
 * "Standard Size Chart Production"): those describe how the shop works. A customer is asking "what can I get done?",
 * so every customer-facing screen (All Categories, service detail, search chips) reads from here instead.
 */

/** The 4 services as the thing a customer needs. */
export const SERVICE_INTENTS: Record<ServiceGroupKey, { title: string; line: string }> = {
  custom_tailoring: { title: 'Have clothes made', line: 'Made to your size: shirts, pants, barong, gowns and suits.' },
  uniform_production: { title: 'Uniforms and team orders', line: 'For one person, or a whole class, office or team.' },
  alterations_repairs: { title: 'Fix or adjust your clothes', line: 'Hemming, resizing, zippers and tears.' },
  garment_customization: { title: 'Embroider your clothes', line: 'Names, logos, patches and callado on clothes you have.' },
};

/** Each task a service can tick, as a customer would say it. */
const TASKS: Record<string, string> = {
  made_to_measure: 'Made to your measurements',
  bespoke_pattern_making: 'A pattern drafted just for you',
  labor_only: 'Bring your own fabric',
  full_package: 'Fabric included',
  garment_embroidery: 'Embroidery or beadwork on the new garment',
  custom_measured_uniform: 'One person, made to measure',
  standard_size_production: 'Standard sizes (XS–5XL)',
  bulk_orders: 'Group and bulk orders',
  cut_and_sew_jersey: 'Sewn sports jerseys',
  uniform_embroidery: 'Logo, name or patch on the uniform',
  hemming_length_adjustment: 'Shorten or lengthen (putol / pahaba)',
  original_denim_hemming: 'Shorten jeans, keep the original hem',
  waist_seat_adjustment: 'Take in or let out the waist (paliit / paluwag)',
  tapering_resizing: 'Taper or resize (baston)',
  sleeve_adjustment: 'Shorten the sleeves',
  zipper_replacement: 'Replace a zipper',
  button_fastener_replacement: 'Replace buttons or hooks',
  garment_repair_mending: 'Mend a tear or seam (tahing punit)',
  logo_embroidery: 'School or company logo',
  name_rank_embroidery: 'Name, rank or title',
  badge_patch_attachment: 'Sew on a badge or patch',
  monogram_callado: 'Initials or barong callado',
};

/** A task in the customer's words; an unknown one falls back to the shop's label. */
export function customerTaskLabel(group: string | null | undefined, capability: string): string {
  return TASKS[capability] ?? capabilityLabel(group, capability);
}

/** The tasks of one service, in order, in the customer's words. */
export function customerTasksOf(group: ServiceGroupKey, capabilities: readonly string[]): string[] {
  return capabilities.map((c) => customerTaskLabel(group, c));
}

export const SERVICE_INTENT_KEYS: readonly ServiceGroupKey[] = SERVICE_GROUP_KEYS;

/**
 * Who a service takes orders from, in one line, from what it ticked: "One person", "Groups of 10 or more", or both.
 * (Bulk alone is group-only; bulk plus "Individual / Custom-Measured Uniform" takes either: Service::deriveOrderTypes.)
 */
export function whoItIsFor(capabilities: readonly string[] | null | undefined, serviceTypes: readonly string[] | null | undefined, minOrderQty: number | null | undefined): string {
  const caps = capabilities ?? [];
  const types = serviceTypes ?? [];
  const group = caps.includes('bulk_orders') || types.includes('bulk_sublimation');
  if (!group) return 'One person';
  const min = Math.max(2, Number(minOrderQty) || 2);
  const onePersonToo = types.some((t) => t !== 'bulk_sublimation');
  return onePersonToo ? `One person, or a group of ${min} or more` : `Groups of ${min} or more people`;
}
