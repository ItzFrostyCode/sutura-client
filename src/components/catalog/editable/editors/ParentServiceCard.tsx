import React from 'react';
import type { StoreServiceOption } from '../../form/formTypes';
import { formatTurnaround } from '@/lib/formatTurnaround';

const peso = (v: string | number | null | undefined) =>
  v != null && Number(v) > 0 ? `₱${Number(v).toLocaleString('en-PH', { maximumFractionDigits: 2 })}` : null;

export default function ParentServiceCard({ service }: Readonly<{ service: StoreServiceOption }>) {
  const servicePrice = peso(service.base_price);
  const turnaround = formatTurnaround(service.estimated_days || null, service.estimated_days_max || null);

  return (
    <div className="p-4 bg-sunken/80 border border-line space-y-3 mt-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-taupe block">Parent Service Context</span>
          <h4 className="text-base font-semibold text-ink mt-0.5">{service.name}</h4>
        </div>
        <span
          className={`px-2.5 py-1 text-xs font-semibold border ${
            servicePrice ? 'bg-white border-line text-ink' : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          {servicePrice ? `Service Base: ${servicePrice}` : 'Quotation only (No base price)'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2.5 border-t border-line/60 text-xs text-ink-body">
        <div>
          <span className="text-ink-muted">Production turnaround: </span>
          <span className="font-medium text-ink">{turnaround}</span>
        </div>
        {service.garment_types && service.garment_types.length > 0 && (
          <div>
            <span className="text-ink-muted">Garments: </span>
            <span className="font-medium text-ink capitalize">{service.garment_types.slice(0, 3).join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
