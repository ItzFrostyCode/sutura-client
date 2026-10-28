import { garmentsPerUnit, unitNoun, type SoldAs } from '@/lib/orderUnits';

/** The size of an order, from how many people it is for: Solo, Duo, Trio, "5 people", and a Group from the service's minimum (usually 10). */
export function orderSize(people: number, minimum?: number | null): string | null {
  if (!people || people < 1) return null;
  const line = minimum && minimum > 1 ? minimum : 10;
  if (people === 1) return 'Solo';
  if (people === 2) return 'Duo';
  if (people === 3) return 'Trio';
  return people >= line ? `Group of ${people}` : `${people} people`;
}

/** What the screens need to know of an order's counts. The server sends them with every order (`ordered_quantity`, `garment_count`); the rest is only for an order that is not saved yet. */
type Counted = { quantity?: number | null; ordered_quantity?: number | null; garment_count?: number | null; custom_order_data?: Record<string, unknown> | null };

/** Ordered quantity, in the unit it was sold in (pieces, or sets): the team's units added up, else its quantity. */
export function jobPieces(job: Counted): number {
  if (typeof job.ordered_quantity === 'number') return job.ordered_quantity;
  const roster = job.custom_order_data?.team_roster;
  if (Array.isArray(roster) && roster.length > 0) {
    return roster.reduce((sum: number, r) => sum + Math.max(1, Number.parseInt(String((r as Record<string, unknown>).qty ?? '1'), 10) || 1), 0);
  }
  return Math.max(1, Number(job.quantity) || 1);
}

/** How many people a saved order is for: the recorded count, else its team list; 0 when it is one person. */
export function jobPeople(job: { custom_order_data?: Record<string, unknown> | null }): number {
  const d = job.custom_order_data ?? {};
  const counted = Number(d.people_count);
  if (counted > 0) return counted;
  const roster = d.team_roster;
  return Array.isArray(roster) ? roster.length : 0;
}

/** The order was sold as sets (a top and a bottom each): read from the option it was made from, fixed when it was created. */
export const jobSoldAs = (job: { custom_order_data?: Record<string, unknown> | null }): SoldAs => (job.custom_order_data?.option_sold_as === 'set' ? 'set' : 'garment');
export const jobSoldAsSet = (job: { custom_order_data?: Record<string, unknown> | null }): boolean => jobSoldAs(job) === 'set';

/** Physical garments to hand over: the server's count (ordered quantity × garments in one unit). */
export function jobGarments(job: Counted): number {
  if (typeof job.garment_count === 'number') return job.garment_count;
  return jobPieces(job) * garmentsPerUnit(jobSoldAs(job));
}

/** "3 sets" / "1 piece": the ordered quantity in the unit it was sold in. */
export const orderedLabel = (job: Counted): string => `${jobPieces(job)} ${unitNoun(jobSoldAs(job), jobPieces(job))}`;
