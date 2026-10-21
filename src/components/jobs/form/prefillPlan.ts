import type { CatalogItem } from '@/components/catalog/catalogHelpers';
import { parseBookingNotes, type Appointment } from '@/components/appointments/appointmentHelpers';
import { serviceHasType } from '@/components/jobs/jobHelpers';
import { canonicalGarment, categoryOfGarment, type GarmentCategory } from '@/lib/garmentTaxonomy';
import type { DesignSource } from '@/lib/designSource';
import { designImage, serviceGarments } from './jobFormHelpers';
import type { ServiceData } from './types';

/** Everything Create Job Order starts with, worked out ONCE from the link, the consultation and the shop's lists. */
export interface PrefillPlan {
  customerId: string;
  branchId: number | null;
  serviceId: string;
  designId: string;
  garment: string;
  garmentCategory: GarmentCategory | '';
  /** A group order: how many people, and how many pieces each (adds up to `pieces`). */
  group: boolean;
  people: number;
  rowPieces: number[];
  /** One person: how many pieces. */
  quantity: string;
  standardSize: string;
  /** How measuring starts: a booked size means a standard size; a consultation means "later"; null = the form's own default. */
  measurementMode: 'standard_size' | 'none' | null;
  notes: string;
  consultationNotes: string;
  designSource: DesignSource | null;
  designLink: string;
  materialSource: 'customer_supplied' | 'store_supplied' | null;
  answers: Record<string, string>;
  images: string[];
  referenceLink: string;
  intake: 'online' | 'walk_in';
  fromAppointment: boolean;
}

const fileKey = (u: string) => decodeURIComponent(u).split('?')[0].split('/').pop()?.toLowerCase() ?? '';
const photosOf = (d: CatalogItem) => [...(d.images ?? []).map((i) => i.image_url), d.fabric_image_url].filter(Boolean) as string[];

/** Splits `pieces` across `people`: everyone gets at least one, the rest are shared from the first person on. */
export function sharePieces(pieces: number, people: number): number[] {
  const n = Math.max(1, people);
  const total = Math.max(pieces, n);
  const base = Math.floor(total / n);
  const extra = total % n;
  return Array.from({ length: n }, (_, i) => base + (i < extra ? 1 : 0));
}

/**
 * The one place that decides what the form starts with. Order: customer, branch, service, design, people and quantity,
 * size and measuring, notes, fabric, answers, photos. The consultation wins over the link, and nothing is filled twice.
 */
export function planPrefill(args: {
  params: { get: (k: string) => string | null };
  apt: Appointment | null;
  services: ServiceData[];
  catalogItems: CatalogItem[];
}): PrefillPlan {
  const { params, apt, services, catalogItems } = args;
  const item = apt?.items?.[0];

  // Service, then design (a design belongs to one service, so it can correct the service).
  let serviceId = params.get('service_id') || String(apt?.service_id || apt?.service?.id || item?.service_id || '');
  let design = catalogItems.find((c) => String(c.id) === (params.get('catalog_item_id') || String(apt?.catalog_item_id || apt?.catalog_item?.id || item?.catalog_item_id || ''))) ?? null;
  // A booking can carry the design's picture without naming it: match the picture to one of the service's designs.
  if (!design && apt?.reference_images?.length) {
    const wanted = new Set(apt.reference_images.map(fileKey));
    design = catalogItems.find((c) => (!serviceId || String(c.service_id) === serviceId) && photosOf(c).some((u) => wanted.has(fileKey(u)))) ?? null;
  }
  if (design?.service_id != null) serviceId = String(design.service_id);
  const service = services.find((s) => String(s.id) === serviceId);

  const garmentSlug = design ? canonicalGarment(design.garment_type) ?? design.garment_type ?? '' : (() => { const only = service ? serviceGarments(service) : null; return only && only.length === 1 ? only[0] : ''; })();

  // People (how many are measured) and pieces (how many in all): the consultation says both; a booking says pieces.
  const itemsQty = apt?.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) ?? 0;
  const paramQty = Number(params.get('quantity')) || 0;
  const people = apt?.people_count && apt.people_count >= 2 ? apt.people_count : 0;
  const pieces = Math.max(1, apt?.pieces_count || paramQty || itemsQty || people || 1);
  const group = serviceHasType(service, 'bulk_sublimation') || people >= 2;
  const rowPieces = group ? sharePieces(pieces, people || Math.max(2, itemsQty >= 2 ? itemsQty : 2)) : [];

  const bookedSize = apt?.selected_size || item?.selected_size || params.get('size') || params.get('standard_size') || '';
  const answers = Object.fromEntries(Object.entries((apt?.answers ?? {}) as Record<string, unknown>).filter(([, v]) => typeof v === 'string' && v.trim() !== '')) as Record<string, string>;
  const booked = apt ? parseBookingNotes(apt.notes) : null;
  const designKeys = new Set(design ? photosOf(design).map(fileKey) : []);
  const design1 = design ? designImage(design) : null;
  const images = Array.from(new Set([...(design1 ? [design1] : []), ...(apt?.reference_images ?? []).filter((u) => !designKeys.has(fileKey(u)))]));

  return {
    customerId: params.get('customer_id') || (apt?.customer?.id ? String(apt.customer.id) : ''),
    branchId: apt?.store_branch_id ?? apt?.branch?.id ?? null,
    serviceId,
    designId: design ? String(design.id) : '',
    garment: garmentSlug,
    garmentCategory: garmentSlug ? categoryOfGarment(garmentSlug) ?? 'other' : '',
    group,
    people: group ? rowPieces.length : 0,
    rowPieces,
    quantity: String(pieces),
    standardSize: bookedSize,
    measurementMode: !apt ? null : bookedSize && !group ? 'standard_size' : 'none',
    notes: params.get('notes') || booked?.text || '',
    consultationNotes: [apt?.visit_notes?.trim(), apt?.fitting_notes?.trim() ? `Shop's fitting note: ${apt.fitting_notes.trim()}` : ''].filter(Boolean).join('\n'),
    designSource: design ? 'shop_design' : apt?.design_source ?? null,
    designLink: apt?.design_link ?? '',
    materialSource: apt?.material_source ? (apt.material_source === 'own' ? 'customer_supplied' : 'store_supplied') : null,
    answers,
    images,
    referenceLink: apt?.reference_link ?? '',
    intake: apt?.intake_channel === 'online' ? 'online' : 'walk_in',
    fromAppointment: !!apt,
  };
}
