/** "49 mins", "13 hrs 23 mins". */
export function formatTravel(minutes: number): string {
  const m = Math.max(1, Math.round(minutes));
  if (m < 60) return `${m} ${m === 1 ? 'min' : 'mins'}`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return `${h} ${h === 1 ? 'hr' : 'hrs'}${rest ? ` ${rest} ${rest === 1 ? 'min' : 'mins'}` : ''}`;
}

/** Rough city speeds, only used for an estimate before a real route is drawn: walking 5, bike 15, car 30 km/h. */
export const ESTIMATE_KMH = { foot: 5, bike: 15, car: 30 };
