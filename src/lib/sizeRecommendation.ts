// Shared with the Size Profile page's own field labels — kept here since
// this is where a metric key needs to become human-readable for the "My
// Size" picker's list of selectable measurements.
export const METRIC_LABELS: Record<string, string> = {
  shoulder: 'Shoulder', bust: 'Bust', under_bust: 'Under Bust', waist: 'Waist',
  hip: 'Hip', thigh: 'Thigh', ball_girth: 'Ball Girth', foot_length: 'Foot Length',
};

const normalize = (s: string) => s.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z]/g, '');

// The chart row whose value in `colIndex` is numerically closest to
// `value` — the actual "nearest match" comparison both functions below
// share, so a customer picking a size two different ways never disagrees.
function nearestSizeForColumn(rows: { size: string; values: string[] }[], colIndex: number, value: number): string | null {
  let best: { size: string; diff: number } | null = null;
  for (const row of rows) {
    const num = parseFloat(row.values[colIndex]);
    if (Number.isNaN(num)) continue;
    const diff = Math.abs(num - value);
    if (!best || diff < best.diff) best = { size: row.size, diff };
  }
  return best?.size ?? null;
}

// Matches a size chart column (e.g. "Waist (cm)") to *any* metric the
// customer has saved in their Size Profile, then finds the chart row whose
// value for that column is closest to theirs — a real comparison against
// real numbers, not a guess. Powers the automatic "Recommended: Size X"
// banner, which doesn't ask the customer to pick which measurement to use.
export function findRecommendedSize(
  columns: string[],
  rows: { size: string; values: string[] }[],
  metrics: Record<string, number> | null
): string | null {
  if (!metrics || columns.length === 0 || rows.length === 0) return null;

  let colIndex = -1;
  let metricValue: number | null = null;
  for (let i = 0; i < columns.length; i++) {
    const norm = normalize(columns[i]);
    for (const [key, value] of Object.entries(metrics)) {
      const normKey = key.replace(/_/g, '');
      if (value != null && (norm.includes(normKey) || normKey.includes(norm))) {
        colIndex = i;
        metricValue = value;
        break;
      }
    }
    if (colIndex >= 0) break;
  }
  if (colIndex < 0 || metricValue === null) return null;

  return nearestSizeForColumn(rows, colIndex, metricValue);
}

// Matches a size chart column to ONE specific metric the customer picked
// (e.g. they chose "Waist" from their own saved measurements, not letting
// the system guess) — powers the "My Size" picker's manual selection.
export function matchSizeForMetric(
  columns: string[],
  rows: { size: string; values: string[] }[],
  metricKey: string,
  metricValue: number
): string | null {
  if (columns.length === 0 || rows.length === 0) return null;
  const normKey = metricKey.replace(/_/g, '');
  const colIndex = columns.findIndex(col => {
    const norm = normalize(col);
    return norm.includes(normKey) || normKey.includes(norm);
  });
  if (colIndex < 0) return null;
  return nearestSizeForColumn(rows, colIndex, metricValue);
}
