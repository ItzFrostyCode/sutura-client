import React from 'react';
import { SERVICE_TYPE_LABELS, serviceCategoryPath } from '@/lib/canonicalTaxonomy';
import { serviceGroupLabel } from '@/lib/garmentTaxonomy';
import { formatServiceTurnaround } from '@/lib/turnaroundHelper';
import { PublicService } from '@/components/store-storefront/types';
import ChartImageViewer from '@/components/shared/ChartImageViewer';
import { getActiveSale } from '@/lib/salePricing';

// The content of each numbered card on a service page, kept apart from the
// accordion chrome so the owner's editable page can wrap the very same blocks
// in its own boxes (as the Catalog Design page does).

// All Reference Chart images (e.g. Men's and Women's sizing). Older records
// only have the single size_chart_image_url.
export function serviceChartImages(service: Pick<PublicService, 'size_chart_image_url' | 'size_chart_image_urls'>): string[] {
  const list = (service.size_chart_image_urls ?? []).filter(Boolean);
  if (list.length > 0) return list;
  return service.size_chart_image_url ? [service.size_chart_image_url] : [];
}

// The Reference Chart is an image (no size table).
export function hasServiceChart(service: PublicService): boolean {
  return serviceChartImages(service).length > 0;
}

// Category is always the first row — the same trail the breadcrumb links through.
export function ServiceSpecBlock({ service }: Readonly<{ service: PublicService }>) {
  // Category stops at the service's category; its type has its own row below.
  const group = serviceGroupLabel(service.service_category);
  const categoryPath = serviceCategoryPath({ service_category: service.service_category }).length > 0
    ? serviceCategoryPath({ service_category: service.service_category })
    : group ? ['Services', group] : [];
  const leaf = service.service_leaf_type ? SERVICE_TYPE_LABELS[service.service_leaf_type] ?? service.service_leaf_type : '';
  const rawType = leaf || service.service_type || service.category || '';
  const rows: [string, string][] = [];
  if (categoryPath.length > 0) rows.push(['Category', categoryPath.join(' → ')]);
  if (rawType) rows.push(['Service Type', rawType.replace(/_/g, ' ')]);
  rows.push(['Estimated Completion', formatServiceTurnaround(service.estimated_days, service.estimated_days_max)]);
  // A running discount takes the same % off every tier (server: Service::discountedAmount).
  const sale = service.base_price != null
    ? getActiveSale({ price: service.base_price, sale_price: service.sale_price, sale_starts_at: service.sale_starts_at, sale_ends_at: service.sale_ends_at })
    : null;
  const percent = sale && service.sale_percent ? service.sale_percent : 0;
  const peso = (n: number) => `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
                {percent > 0 ? (
                  <span className="flex items-baseline gap-2">
                    <span className="text-xs text-ink-faint line-through tabular-nums">{peso(Number(tier.amount))}</span>
                    <span className="font-semibold text-rose-600 tabular-nums">{peso(Math.round(Number(tier.amount) * (100 - percent)) / 100)}</span>
                  </span>
                ) : (
                  <span className="font-semibold text-ink">
                    ₱{Number.parseFloat(tier.amount.toString()).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ServiceChartBlock({ service, compact = false }: Readonly<{ service: PublicService; compact?: boolean }>) {
  const images = serviceChartImages(service);
  return (
    <div className="space-y-2">
      <ChartImageViewer images={images} compact={compact} />
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
