'use client';

import React from 'react';

interface AddOnOption {
  name: string;
  price: number;
  level: 'design' | 'service';
}

interface CatalogAddOnsSelectorProps {
  designAddOns?: { id?: string; name: string; price: number }[] | null;
  serviceAddOns?: { id?: number; label: string; amount: number }[] | null;
}

export default function CatalogAddOnsSelector({
  designAddOns,
  serviceAddOns,
}: CatalogAddOnsSelectorProps) {
  const designItems: AddOnOption[] = (designAddOns || [])
    .filter((a) => a.name && Number(a.price) >= 0)
    .map((a) => ({ name: a.name.trim(), price: Number(a.price), level: 'design' }));

  const serviceItems: AddOnOption[] = (serviceAddOns || [])
    .filter((s) => s.label && Number(s.amount) > 0)
    // Avoid showing identical label if design already has a specific one
    .filter((s) => !designItems.some((d) => d.name.toLowerCase() === s.label.trim().toLowerCase()))
    .map((s) => ({ name: s.label.trim(), price: Number(s.amount), level: 'service' }));

  if (designItems.length === 0 && serviceItems.length === 0) {
    return null;
  }

  return (
    <div className="py-3.5 border-b border-line space-y-3">
      {/* Design Add-ons Section */}
      {designItems.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-0">
          <div className="w-[110px] shrink-0 text-sm text-ink-muted">
            <span>Design</span>
            <span className="block text-[11px] text-ink-faint">Add-ons</span>
          </div>
          <div className="flex-1 w-full">
            <div className="rounded-lg bg-sunken/50 border border-line/60 divide-y divide-line/40 overflow-hidden">
              {designItems.map((addon) => (
                <div
                  key={`design-${addon.name}`}
                  className="flex items-center justify-between px-3 py-1.5 text-xs select-none"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-taupe/50 shrink-0" />
                    <span className="text-ink-body font-normal">{addon.name}</span>
                  </div>
                  <span className="text-[11px] font-medium text-taupe tabular-nums shrink-0">
                    {addon.price > 0 ? `+₱${addon.price.toLocaleString('en-PH')}` : 'Included'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Service-level Add-ons Section */}
      {serviceItems.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-0 pt-1">
          <div className="w-[110px] shrink-0 text-sm text-ink-muted">
            <span>Service</span>
            <span className="block text-[11px] text-ink-faint">Add-ons</span>
          </div>
          <div className="flex-1 w-full">
            <div className="rounded-lg bg-sunken/50 border border-line/60 divide-y divide-line/40 overflow-hidden">
              {serviceItems.map((addon) => (
                <div
                  key={`service-${addon.name}`}
                  className="flex items-center justify-between px-3 py-1.5 text-xs select-none"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-taupe/50 shrink-0" />
                    <span className="text-ink-body font-normal">{addon.name}</span>
                  </div>
                  <span className="text-[11px] font-medium text-taupe tabular-nums shrink-0">
                    {addon.price > 0 ? `+₱${addon.price.toLocaleString('en-PH')}` : 'Included'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pricing clarification */}
      <p className="text-[11px] text-ink-muted leading-tight">
        Add-on pricing is indicative only. Applicable add-ons, alterations, and custom specifications are discussed and finalized with the tailor during your in-store visit.
      </p>
    </div>
  );
}

