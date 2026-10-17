import { GARMENTS, GARMENT_CATEGORIES, canonicalGarment, type GarmentCategory } from '@/lib/garmentTaxonomy';
import type { SearchActiveTab } from '../types';

/**
 * The garment (or garment category) a link carried. Links made today search with ?q=; an old bookmark may still carry
 * garment_type / category / specialization. Men / Women / Kids, subcategory and top/bottom are not filters any more,
 * so ?department= ?subcategory= ?structure= are simply ignored.
 */
export function garmentParam(params: URLSearchParams): string {
  return params.get('garment_type') ?? params.get('category') ?? params.get('specialization') ?? '';
}

/** What to show in the search box when a link carried a garment instead of typed text (e.g. "Barong"). */
export function categoryText(params: URLSearchParams): string {
  const label = params.get('qlabel');
  if (label) return label;
  const slug = garmentParam(params);
  if (!slug) return '';
  const key = slug.toLowerCase();
  const garment = GARMENTS[key]?.label.split(' / ')[0];
  const category = GARMENT_CATEGORIES[key as GarmentCategory]?.label;
  return garment ?? category ?? slug.replace(/[-_]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

export interface GarmentFilter {
  garment_type?: string;
  garment_category?: string;
  /** An old name that is neither a garment nor a category: searched as plain words. */
  words?: string;
}

/** How a garment slug from a link narrows results: one garment, a whole garment category, or plain words. */
export function garmentFilter(slug: string): GarmentFilter {
  const key = slug.trim().toLowerCase();
  if (!key) return {};
  if (canonicalGarment(key)) return { garment_type: key };
  if (key in GARMENT_CATEGORIES && key !== 'other') return { garment_category: key };
  return { words: key.replace(/[-_]+/g, ' ') };
}

/** ?tab= (several spellings are accepted); without one, a garment link opens the designs and anything else the shops. */
export function resolveTab(params: URLSearchParams): SearchActiveTab {
  const tab = params.get('tab');
  if (tab === 'services' || tab === 'service') return 'services';
  if (tab === 'showroom' || tab === 'catalog') return 'showroom';
  if (tab === 'store' || tab === 'stores') return 'store';
  return params.get('category') || params.get('specialization') ? 'showroom' : 'store';
}

/** Everything a link can carry to say what the person is looking for. Dropped by "remove category". */
export const CONTEXT_PARAMS = [
  'garment_type', 'category', 'specialization', 'service_category', 'service_type', 'qlabel',
  // Old links only; ignored when read.
  'department', 'subcategory', 'structure',
];
