'use client';

// Shared bits for the admin Reports page — chart colours follow the dashboard
// charts (taupe / sand on a warm grid), so admin and shop reports look alike.
export const CHART = {
  primary: '#9A8073',
  secondary: '#D9CDB8',
  grid: '#EDE7DF',
  axis: '#8A817A',
} as const;

/** Bar look shared by every report chart: a little wider, top corners rounded. */
export const BAR = { maxBarSize: 44, radius: [4, 4, 0, 0] as [number, number, number, number] };
/** Same, for every bar of a stack except the top one (square corners). */
export const BAR_STACK_BASE = { maxBarSize: 44, radius: [0, 0, 0, 0] as [number, number, number, number] };
export const AXIS = { stroke: CHART.axis, fontSize: 12, tickLine: false, axisLine: false } as const;
// Legend text stays dark; by default it takes the series colour, which is too pale on the sand bars.
export const LEGEND = {
  iconType: 'circle' as const,
  iconSize: 9,
  wrapperStyle: { fontSize: 12, paddingTop: 8 },
  formatter: (value: string) => <span style={{ color: '#4A423C' }}>{value}</span>,
};

export const PERIODS = [3, 6, 12] as const;
export type Period = (typeof PERIODS)[number];

/** Either the last 3/6/12 months or a custom date range (YYYY-MM-DD). */
export type ReportRange = { months: Period } | { from: string; to: string };

/** "the last 6 months" / "Sep 1, 2026 – Oct 31, 2026", for section descriptions. */
export function rangeText(range: ReportRange): string {
  if ('months' in range) return `the last ${range.months} months`;
  const f = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${f(range.from)} – ${f(range.to)}`;
}

/** ₱12,300 → "₱12k" on chart axes, where the full figure is in the tooltip. */
export function compactPeso(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (Math.abs(value) >= 1_000) return `₱${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return `₱${value}`;
}

export const tooltipStyle = {
  contentStyle: { border: '1px solid #E6E0D6', borderRadius: 10, fontSize: 12, boxShadow: '0 4px 14px rgba(30,26,23,0.08)' },
  cursor: { fill: '#F5F1EC' },
};

/** Crisp ivory card with a hairline border and a soft lift off the page. */
export const CARD = 'admin-card';
/** Table header cells. */
export const TH = 'px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#6E655F]';

export function ReportCard({ title, aside, children }: { readonly title: string; readonly aside?: React.ReactNode; readonly children: React.ReactNode }) {
  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[#EDE7DF] px-5 py-4">
        <h3 className="text-lg font-semibold text-[#1E1A17]">{title}</h3>
        {aside && <div className="text-sm text-[#6E655F]">{aside}</div>}
      </div>
      {children}
    </div>
  );
}

/** A KPI tile: eyebrow label, a bold number, then a hint (plain text or a pill). */
export function ReportStat({ label, value, hint, hintPill = false }: {
  readonly label: string; readonly value: React.ReactNode; readonly hint?: string; readonly hintPill?: boolean;
}) {
  return (
    <div className={`${CARD} flex h-full flex-col gap-2 p-5`}>
      <p className="min-h-[2lh] text-[11px] font-semibold uppercase leading-snug tracking-wider text-[#6E655F]">{label}</p>
      <p className="text-2xl font-bold tabular-nums text-[#1E1A17]">{value}</p>
      {hint && (hintPill
        ? <span className="self-start rounded-md bg-[#F3EFEA] px-2 py-0.5 text-xs text-[#4A423C]">{hint}</span>
        : <p className="text-xs leading-relaxed text-[#6E655F]">{hint}</p>)}
    </div>
  );
}

export function SectionHeading({ title, description }: { readonly title: string; readonly description: string }) {
  return (
    <div>
      <h2 className="text-display text-2xl font-semibold text-[#1E1A17]">{title}</h2>
      <p className="mt-1 text-sm text-[#6E655F]">{description}</p>
    </div>
  );
}
