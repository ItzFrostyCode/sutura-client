import type { ServiceSection } from './serviceEditing';

/**
 * One order for a service, top to bottom, exactly as the customer reads it (store/[id]/service/[id]):
 * the photo, the name/price/turnaround box, the numbered cards (What they do & prices, Reference Chart,
 * Description), then what the customer meets when they book (booking questions, requirements).
 * The owner's page shows the same order, and a new service is filled in by walking it in sequence.
 */
export interface ServiceStep {
  readonly section: ServiceSection;
  readonly title: string;
  /** Where the customer sees it: on the service page, or only when they book. */
  readonly where: 'page' | 'booking';
  readonly optional?: boolean;
}

export const SERVICE_STEPS: readonly ServiceStep[] = [
  { section: 'photo', title: 'Photo', where: 'page', optional: true },
  { section: 'info', title: 'Name, price & turnaround', where: 'page' },
  { section: 'workprices', title: 'What they do & prices', where: 'page' },
  { section: 'chart', title: 'Reference Chart', where: 'page', optional: true },
  { section: 'description', title: 'Description', where: 'page' },
  { section: 'booking', title: 'Booking questions', where: 'booking', optional: true },
  { section: 'requirements', title: 'Before they book', where: 'booking', optional: true },
];

/**
 * Card numbers as the customer sees them: the chart card is numbered only when the shop added one, so
 * Description is 2 or 3 and the booking cards continue after it.
 */
export function cardNumbers(hasChart: boolean): Partial<Record<ServiceSection, number>> {
  const n: Partial<Record<ServiceSection, number>> = { workprices: 1 };
  let next = 2;
  if (hasChart) n.chart = next++;
  n.description = next++;
  n.booking = next++;
  n.requirements = next;
  return n;
}
