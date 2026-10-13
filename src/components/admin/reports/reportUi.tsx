'use client';

// Shared bits for the admin Reports page — chart colours follow the dashboard
// charts (taupe / sand on a warm grid), so admin and shop reports look alike.
export const CHART = {
  primary: '#9A8073',
  secondary: '#D9CDB8',
  grid: '#EBE6E0',
  axis: '#A8A19A',
} as const;

export const PERIODS = [3, 6, 12] as const;
export type Period = (typeof PERIODS)[number];

/** ₱12,300 → "₱12k" on chart axes, where the full figure is in the tooltip. */
export function compactPeso(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (Math.abs(value) >= 1_000) return `₱${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return `₱${value}`;
}

export const tooltipStyle = {
  contentStyle: { border: '1px solid #EBE6E0', borderRadius: 0, fontSize: 12 },
  cursor: { fill: '#F5F1EC' },
};

export function ReportCard({ title, aside, children }: { readonly title: string; readonly aside?: React.ReactNode; readonly children: React.ReactNode }) {
  return (
    <div className="border border-line bg-surface">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-4">
        <h3 className="tablet-h3 text-ink">{title}</h3>
        {aside && <div className="text-sm text-ink-muted">{aside}</div>}
      </div>
      {children}
    </div>
  );
}

export function SectionHeading({ title, description }: { readonly title: string; readonly description: string }) {
  return (
    <div>
      <h2 className="text-display text-2xl font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-muted">{description}</p>
    </div>
  );
}
