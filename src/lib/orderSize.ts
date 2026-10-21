/** The size of an order, from how many people it is for: Solo, Duo, Trio, "5 people", and a Group from the service's minimum (usually 10). */
export function orderSize(people: number, minimum?: number | null): string | null {
  if (!people || people < 1) return null;
  const line = minimum && minimum > 1 ? minimum : 10;
  if (people === 1) return 'Solo';
  if (people === 2) return 'Duo';
  if (people === 3) return 'Trio';
  return people >= line ? `Group of ${people}` : `${people} people`;
}

/** How many pieces an order has in all: the team's pieces added up, else its quantity. */
export function jobPieces(job: { quantity?: number | null; custom_order_data?: Record<string, unknown> | null }): number {
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
