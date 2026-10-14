import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SERVICE_CATEGORY_LABELS, type ServiceCategory } from '@/lib/canonicalTaxonomy';
import {
  GARMENT_CATEGORIES,
  GARMENTS,
  SERVICE_GROUPS,
  canonicalGarment,
  capabilityLabel,
  type ServiceGroup,
  type ServiceGroupKey,
} from '@/lib/garmentTaxonomy';
import { formatServiceTurnaround } from '@/lib/turnaroundHelper';
import { PublicService } from '@/components/store-storefront/types';
import GuideImage from '@/components/shared/GuideImage';

// The content of each numbered card on a service page, kept apart from the
// accordion chrome so the owner's editable page can wrap the very same blocks
// in its own boxes (as the Catalog Design page does).

export function hasServiceChart(service: PublicService): boolean {
  return Boolean(service.size_chart_image_url || (service.size_chart_columns && service.size_chart_columns.length > 0));
}

const ANY_GARMENT_GROUPS = ['alterations_repairs', 'garment_customization'];
const peso = (n: number) => `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;

/** "Barong: Barong Tagalog, Short-Sleeve Barong · Formal Wear: Suit" — the service's garments by category. */
export function garmentsByCategory(slugs: readonly string[]): string {
  const byCat = new Map<string, string[]>();
  for (const s of slugs) {
    const c = canonicalGarment(s);
    if (!c) continue;
    const cat = GARMENT_CATEGORIES[GARMENTS[c].category].label;
    byCat.set(cat, [...(byCat.get(cat) ?? []), GARMENTS[c].label]);
  }
  return Array.from(byCat.entries()).map(([cat, names]) => `${cat}: ${names.join(', ')}`).join(' · ');
}

export interface AlsoAlters {
  readonly href: string;
  readonly name: string;
}

/** What the service is: the kind of work, the garments, the tasks, the minimum order and the time it takes. */
export function ServiceWorkBlock({ service }: Readonly<{ service: PublicService }>) {
  const group = service.service_category && service.service_category in SERVICE_GROUPS
    ? (SERVICE_GROUPS[service.service_category as ServiceGroupKey] as ServiceGroup)
    : null;
  const garments = garmentsByCategory(service.garment_types ?? []);
  const caps = (service.capabilities ?? []).map((c) => capabilityLabel(service.service_category, c));
  const bulk = (service.capabilities ?? []).includes('bulk_orders') || (service.service_types ?? []).includes('bulk_sublimation');
  const rows: [string, string][] = [];
  const kind = group?.label ?? (service.service_category ? SERVICE_CATEGORY_LABELS[service.service_category as ServiceCategory] : null);
  if (kind) rows.push(['Service', kind]);
  if (garments) rows.push(['Works on', garments]);
  else if (ANY_GARMENT_GROUPS.includes(service.service_category ?? '')) rows.push(['Works on', 'Any garment — bring it in or ask for a quotation']);
  if (caps.length > 0) rows.push(['What they do', caps.join(' · ')]);
  if (bulk && service.min_order_qty) rows.push(['Minimum order', `${service.min_order_qty} piece${service.min_order_qty === 1 ? '' : 's'}`]);
  rows.push(['Estimated Completion', formatServiceTurnaround(service.estimated_days, service.estimated_days_max)]);

  return (
    <table className="w-full mobile-body-sm">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-b border-line last:border-0">
            <td className="py-2 pr-4 text-ink-faint font-medium w-2/5 align-top">{label}</td>
            <td className="py-2 text-ink-body font-normal">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Prices & add-ons. A row with no price depends on the job: the shop quotes it, or the customer walks in with the item. */
export function ServicePricesBlock({ service }: Readonly<{ service: PublicService }>) {
  const rows = service.pricing ?? [];
  if (rows.length === 0) return <p className="text-sm text-ink-faint">No prices or add-ons listed yet.</p>;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-ink-faint uppercase tracking-wider">Prices &amp; add-ons</p>
      <div className="border border-line divide-y divide-line">
        {rows.map((tier) => {
          const amount = Number.parseFloat(String(tier.amount));
          return (
            <div key={tier.id} className="flex items-start justify-between gap-3 px-3 py-2.5 text-sm">
              <span className="text-ink-body min-w-0">{tier.label}</span>
              {amount > 0 ? (
                <span className="font-semibold text-ink shrink-0">{peso(amount)}</span>
              ) : (
                <span className="text-ink-muted text-right text-xs max-w-[55%]">Depends — quotation, or walk in with the item</span>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-ink-faint">The shop confirms the final price before any work starts.</p>
    </div>
  );
}

// The customer's Specification card: what the service is, then its prices, then — when the same shop also
// alters and repairs this kind of garment — a link to that service.
export function ServiceSpecBlock({ service, alsoAlters }: Readonly<{ service: PublicService; alsoAlters?: AlsoAlters | null }>) {
  return (
    <div className="space-y-4">
      <ServiceWorkBlock service={service} />
      <ServicePricesBlock service={service} />
      {alsoAlters && (
        <Link href={alsoAlters.href} className="flex items-center justify-between gap-3 border-t border-line pt-3 group">
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink group-hover:text-taupe">This shop also alters &amp; repairs it</span>
            <span className="block text-xs text-ink-muted truncate">{alsoAlters.name}</span>
          </span>
          <ChevronRight size={16} className="text-ink-faint shrink-0" />
        </Link>
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
