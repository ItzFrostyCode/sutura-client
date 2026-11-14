'use client';

import { ExternalLink, Ruler } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import type { OrderService } from './useOrderData';
import type { Area } from './orderPoints';

export const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const;

/** The sizes a customer may pick: the shop's chart rows, else the usual letter sizes. */
export const sizesOf = (service: OrderService | null) => {
  const fromChart = (service?.size_chart_rows ?? []).map((r) => r.size).filter(Boolean);
  return fromChart.length > 0 ? fromChart : [...DEFAULT_SIZES];
};

/**
 * The shop's size chart, shown before any size is asked: its photo (tap to open it full size) and/or its table.
 * The table scrolls sideways inside the card on a narrow phone instead of widening the page.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function OrderSizeChart({ service, area, group = false }: Readonly<{ service: OrderService | null; area: Area | ''; group?: boolean }>) {
  const image = service?.size_chart_image_url;
  const cols = service?.size_chart_columns ?? [];
  const rows = service?.size_chart_rows ?? [];
  // No chart from the shop: say so, and what to do instead (SUTURA's own words, never a chart it made up).
  if (!image && rows.length === 0) {
    return (
      <section aria-labelledby="size-chart-title" className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sunken text-ink-muted"><Ruler size={18} aria-hidden /></span>
        <div className="min-w-0">
          <h3 id="size-chart-title" className="mobile-h4 text-ink">Size chart</h3>
          <p className="mobile-body-sm mt-0.5 text-ink-muted">
            {group
              ? "This shop hasn't posted a size chart or size guide for this service yet, so standard sizes (S, M, L…) aren't offered. Enter each person's measurements below; a blank is fine, the shop measures it."
              : "This shop hasn't posted a size chart or size guide for this service yet. Enter your measurements, or have the shop measure you."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="size-chart-title" className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <h3 id="size-chart-title" className="mobile-h4 text-ink">Size chart</h3>
        {image && (
          <a href={getMediaUrl(image)} target="_blank" rel="noopener noreferrer" className="flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-ink underline-offset-4 hover:underline">
            Open full size <ExternalLink size={14} aria-hidden />
          </a>
        )}
      </div>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={getMediaUrl(image)} alt="The shop's size chart" className="mt-3 max-h-80 w-full bg-sunken object-contain" />
      )}
      {rows.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-max text-left text-sm">
            <thead className="bg-sunken text-ink-muted">
              <tr>
                <th scope="col" className="px-4 py-2 font-semibold">Size</th>
                {cols.map((c, i) => <th key={`${i}-${c}`} scope="col" className="whitespace-nowrap px-4 py-2 font-semibold">{c}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r, ri) => (
                <tr key={`${ri}-${r.size}`}>
                  <th scope="row" className="px-4 py-2 font-semibold text-ink">{r.size}</th>
                  {cols.map((c, i) => <td key={`${i}-${c}`} className="whitespace-nowrap px-4 py-2 tabular-nums text-ink-body">{r.values[i] || '—'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mobile-caption px-4 py-3 text-ink-muted">Body measurements as the shop lists them. Between two sizes? Choose the bigger one.</p>
    </section>
  );
}
