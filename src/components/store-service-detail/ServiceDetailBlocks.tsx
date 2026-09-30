import React from 'react';
import { serviceCategoryPath } from '@/lib/canonicalTaxonomy';
import { formatServiceTurnaround } from '@/lib/turnaroundHelper';
import { PublicService } from '@/components/store-storefront/types';
import GuideImage from '@/components/shared/GuideImage';

// The content of each numbered card on a service page, kept apart from the
// accordion chrome so the owner's editable page can wrap the very same blocks
// in its own boxes (as the Catalog Design page does).

export function hasServiceChart(service: PublicService): boolean {
  return Boolean(service.size_chart_image_url || (service.size_chart_columns && service.size_chart_columns.length > 0));
}

// Category is always the first row — the same trail the breadcrumb links through.
export function ServiceSpecBlock({ service }: Readonly<{ service: PublicService }>) {
  const categoryPath = serviceCategoryPath(service);
  const rawType = service.service_type || service.category || '';
  const rows: [string, string][] = [];
  if (categoryPath.length > 0) rows.push(['Category', categoryPath.join(' → ')]);
  if (rawType) rows.push(['Service Type', rawType.replace(/_/g, ' ')]);
  rows.push(['Estimated Completion', formatServiceTurnaround(service.estimated_days, service.estimated_days_max)]);

  return (
    <div className="space-y-4">
      <table className="w-full mobile-body-sm">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-line last:border-0">
              <td className="py-2 pr-4 text-ink-faint font-medium w-2/5 align-top">{label}</td>
              <td className={label === 'Category' ? 'py-2 text-blue-900 font-normal' : 'py-2 text-ink-body font-normal'}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {service.pricing && service.pricing.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-ink-faint uppercase tracking-wider">Pricing Options</p>
          <div className="border border-line divide-y divide-line">
            {service.pricing.map((tier) => (
              <div key={tier.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
                <span className="text-ink-body">{tier.label}</span>
                <span className="font-semibold text-ink">
                  ₱{Number.parseFloat(tier.amount.toString()).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ServiceChartBlock({ service }: Readonly<{ service: PublicService }>) {
  const columns = service.size_chart_columns ?? [];
  return (
    <div className="space-y-2">
      {service.size_chart_image_url && <GuideImage src={service.size_chart_image_url} alt="Reference chart" />}
      {columns.length > 0 && (
        <div className={`overflow-x-auto border border-line rounded-none ${service.size_chart_image_url ? 'mt-3' : ''}`}>
          <table className="w-full mobile-body-sm">
            <thead>
              <tr className="bg-canvas">
                <th className="sticky left-0 z-10 bg-canvas px-3 py-2 text-left font-semibold text-ink-body whitespace-nowrap">Size</th>
                {columns.map((col) => (
                  <th key={col} className="px-3 py-2 text-left font-semibold text-ink-body whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(service.size_chart_rows ?? []).map((row) => (
                <tr key={row.size} className="border-t border-line">
                  <td className="sticky left-0 z-10 bg-surface px-3 py-2 font-semibold text-ink whitespace-nowrap">{row.size}</td>
                  {row.values.map((val, ci) => (
                    <td key={`${row.size}-${ci}`} className="px-3 py-2 text-ink-body font-normal whitespace-nowrap">{val || '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {columns.length > 3 && <p className="mt-1.5 text-[11px] text-ink-faint">Swipe to see more sizes →</p>}
    </div>
  );
}

export function ServiceDescriptionBlock({ service }: Readonly<{ service: PublicService }>) {
  return (
    <p className="mobile-body-sm text-ink-muted leading-relaxed whitespace-pre-wrap font-normal">
      {service.description || 'No description provided for this service yet.'}
    </p>
  );
}
