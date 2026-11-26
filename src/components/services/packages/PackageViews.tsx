import React from 'react';
import type { ServicePackage } from '../serviceHelpers';
import { SERVICE_CATEGORY_LABELS, type ServiceCategory } from '@/lib/canonicalTaxonomy';
import { pricedTotal } from './packageEditing';

export function PackageInfoView({ pkg }: Readonly<{ pkg: ServicePackage }>) {
  const total = pricedTotal(pkg.services);
  const price = pkg.bundle_price ? Number(pkg.bundle_price) : total;
  return (
    <div className="p-4 pr-14">
      <p className="text-xs font-semibold uppercase tracking-wide text-taupe">Service package</p>
      <h1 className="mt-2 text-2xl font-serif font-bold leading-tight text-ink">{pkg.name}</h1>
      <p className="mt-3 text-2xl font-bold text-ink">
        ₱{price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        <span className="ml-1.5 text-xs font-medium text-ink-muted">{pkg.bundle_price ? 'bundle price' : 'estimated starting price'}</span>
      </p>
      <p className="text-xs text-ink-muted mt-1">Final price may vary based on job-order details.</p>
    </div>
  );
}

export function PackageServicesView({ pkg }: Readonly<{ pkg: ServicePackage }>) {
  const cat = pkg.service_category ? SERVICE_CATEGORY_LABELS[pkg.service_category as ServiceCategory] : null;
  return (
    <div>
      {cat && <p className="text-xs text-ink-muted pb-2 border-b border-line">Category: <span className="font-semibold text-ink">Services → {cat}</span></p>}
    <ul className="divide-y divide-line">
      {pkg.services.map(s => (
        <li key={s.id} className="flex items-center gap-3 py-2.5 text-sm">
          <span className="flex-1 min-w-0 text-ink">{s.name}</span>
          <span className="text-ink-muted shrink-0">{s.base_price != null ? `₱${Number(s.base_price).toLocaleString()}` : 'Custom quote'}</span>
        </li>
      ))}
    </ul>
    </div>
  );
}

export function PackageDescriptionView({ pkg }: Readonly<{ pkg: ServicePackage }>) {
  return pkg.description
    ? <p className="text-sm leading-relaxed text-ink-body whitespace-pre-wrap">{pkg.description}</p>
    : <p className="text-sm text-ink-faint">No description yet — tap the pencil to add one.</p>;
}
