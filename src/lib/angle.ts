/** Smallest difference between two compass angles in degrees (350° and 10° are 20° apart). */
export function angleDiff(a: number, b: number): number {
  return Math.abs((((a - b) % 360) + 540) % 360 - 180);
}
