/**
 * Work on the customer's own garment comes in two kinds that share one form and one short pipeline
 * (queued → in repair → quality check → ready): fixing or adjusting it, or stitching something onto it.
 * Every label says exactly what the customer does at that point.
 */
export type GarmentWorkKind = 'repair' | 'embroidery';

export interface GarmentWorkCopy {
  title: string;
  intro: string;
  itemLabel: string;
  itemPlaceholder: string;
  workLabel: string;
  workHint: string;
  detailLabel: string;
  detailHint: string;
  detailPlaceholder: string;
  detailRequired: boolean;
  photosHint: string;
  submit: string;
  sentTitle: string;
}

export const GARMENT_WORK_COPY: Record<GarmentWorkKind, GarmentWorkCopy> = {
  repair: {
    title: 'Repair or alter your clothes',
    intro: 'Tell the shop what you are bringing and what it needs. You pay when you pick it up.',
    itemLabel: 'What are you bringing?',
    itemPlaceholder: 'e.g. Black slacks, waist a bit loose',
    workLabel: 'What should the shop do?',
    workHint: 'Pick everything it needs. Each one has its own price.',
    detailLabel: 'Exact change',
    detailHint: 'Only for a fit change: where, and by how much.',
    detailPlaceholder: 'e.g. Shorten the pants to 38 in, take in the waist by 1 in',
    detailRequired: false,
    photosHint: 'A photo of the tear or the part to change helps the shop price it right.',
    submit: 'Send request',
    sentTitle: 'Request sent',
  },
  embroidery: {
    title: 'Embroider your clothes',
    intro: 'Tell the shop what to stitch and where. You pay when you pick it up.',
    itemLabel: 'What are you bringing?',
    itemPlaceholder: 'e.g. White school polo, size M',
    workLabel: 'What should the shop add?',
    workHint: 'Pick everything to stitch. Each one has its own price.',
    detailLabel: 'What to stitch, and where',
    detailHint: 'The exact words, the colour of the thread, and the spot on the garment.',
    detailPlaceholder: 'e.g. "J. CRUZ" above the left pocket, navy thread',
    detailRequired: true,
    photosHint: 'Add your logo, and a photo of where it goes.',
    submit: 'Send request',
    sentTitle: 'Request sent',
  },
};

/** Embroidery services (Garment Customization group) stitch onto the customer's own clothes; the rest repair or alter. */
export const kindOf = (category?: string | null): GarmentWorkKind => (category === 'garment_customization' ? 'embroidery' : 'repair');

/** Written on the order when the customer says the garment has no damage, so the shop still has a record. */
export const NO_DAMAGE = 'No visible damage noted by the customer.';
