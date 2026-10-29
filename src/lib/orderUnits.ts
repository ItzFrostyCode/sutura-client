/**
 * The one vocabulary for what a pricing option covers and what one ordered unit is. The service editor, the option lists
 * (customer and shop), the order's details, the chips and the review all read these words, so a label in a form and the same
 * thing shown later on the order or the service never differ.
 *
 *   Covers   Top | Bottom | Top & Bottom   which part(s) of the person (decides the sizing asked)
 *   Sold as  Garment | Set (top + bottom)  what ONE ordered unit is
 *   Ordered quantity is counted in pieces (garment) or sets; "garments" is only the physical count to hand over.
 */
export type Covers = 'top' | 'bottom' | 'both';
export type SoldAs = 'garment' | 'set';

export const COVERS_FIELD = 'Covers';
export const SOLD_AS_FIELD = 'Sold as';
export const NOT_SET = 'Not set';

export const COVERS_LABEL: Record<Covers, string> = { top: 'Top', bottom: 'Bottom', both: 'Top & Bottom' };
export const COVERS_HINT: Record<Covers, string> = {
  top: 'Shirts, barongs, jackets, polos',
  bottom: 'Pants, trousers, skirts, shorts',
  both: 'Suits, matching sets, uniforms',
};
export const SOLD_AS_LABEL: Record<SoldAs, string> = { garment: 'Garment', set: 'Set (top + bottom)' };

/** What a set must be: one top and one bottom. */
export const SET_NEEDS_BOTH = `A set is top + bottom: set ${COVERS_FIELD} to ${COVERS_LABEL.both}.`;

/** "Covers Top & Bottom · Sold as Set (top + bottom)": only what is configured; '' when nothing is. */
export function optionLine(o: { covers?: Covers | null; sold_as?: SoldAs | null }): string {
  return [o.covers ? `${COVERS_FIELD} ${COVERS_LABEL[o.covers]}` : '', o.sold_as ? `${SOLD_AS_FIELD} ${SOLD_AS_LABEL[o.sold_as]}` : ''].filter(Boolean).join(' · ');
}

/** The noun of the ordered quantity: "set(s)" for a set, "piece(s)" otherwise. */
export const unitNoun = (soldAs: SoldAs | null | undefined, n: number): string => (soldAs === 'set' ? (n === 1 ? 'set' : 'sets') : n === 1 ? 'piece' : 'pieces');

/** Physical garments in one ordered unit: 2 for a set, 1 otherwise. */
export const garmentsPerUnit = (soldAs: SoldAs | null | undefined): number => (soldAs === 'set' ? 2 : 1);

/** "4 garments": the physical count to hand over. */
export const garmentsLabel = (n: number): string => `${n} ${n === 1 ? 'garment' : 'garments'}`;
