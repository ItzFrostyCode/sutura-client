import { haversineKm } from '@/lib/customerLocation';

export type LatLng = [number, number];

/** Drops road points closer than `minMeters` to the last kept one (a long road line has far more points than the eye can tell apart). */
export function thinLine(line: LatLng[], minMeters = 10): LatLng[] {
  if (line.length < 3) return line;
  const out: LatLng[] = [line[0]];
  for (let i = 1; i < line.length - 1; i++) {
    const last = out[out.length - 1];
    if (haversineKm(last[0], last[1], line[i][0], line[i][1]) * 1000 >= minMeters) out.push(line[i]);
  }
  out.push(line[line.length - 1]);
  return out;
}

/** Km travelled along the line up to each point (the first is 0, the last is the whole length). */
export function cumulativeKm(line: LatLng[]): number[] {
  const km = [0];
  for (let i = 1; i < line.length; i++) km.push(km[i - 1] + haversineKm(line[i - 1][0], line[i - 1][1], line[i][0], line[i][1]));
  return km;
}

/** Where a position is on the route: the nearest road point, how far off the road it is, and what is left to travel. */
export function locateOnRoute(line: LatLng[], cumulative: number[], pos: { lat: number; lng: number }) {
  let index = 0;
  let nearestKm = Infinity;
  for (let i = 0; i < line.length; i++) {
    const d = haversineKm(pos.lat, pos.lng, line[i][0], line[i][1]);
    if (d < nearestKm) {
      nearestKm = d;
      index = i;
    }
  }
  const total = cumulative[cumulative.length - 1] || 1;
  const remainingKm = Math.max(0, total - cumulative[index]) + nearestKm;
  return { index, offMeters: nearestKm * 1000, remainingKm, fraction: Math.min(1, remainingKm / total) };
}
