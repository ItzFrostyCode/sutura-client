import React from 'react';
import Link from 'next/link';
import { AppointmentItemData } from './appointmentHelpers';

interface AppointmentItemsBreakdownProps {
  items: AppointmentItemData[];
  storeSlug?: string;
}

/** What was asked for, one row per item: its full name (it wraps, never cut), its size / colour / add-ons, and how many pieces. */
export default function AppointmentItemsBreakdown({ items, storeSlug }: AppointmentItemsBreakdownProps) {
  if (!items || items.length === 0) return null;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Requested ({items.length})</p>
        <p className="text-xs font-medium text-ink-muted">Total: {totalQuantity} {totalQuantity === 1 ? 'piece' : 'pieces'}</p>
      </div>

      <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-sunken/40">
        {items.map((item, idx) => {
          const href = storeSlug
            ? item.catalog_item_id ? `/store/${storeSlug}/catalog/${item.catalog_item_id}`
              : item.service_id ? `/store/${storeSlug}/service/${item.service_id}` : null
            : null;
          return (
            <li key={item.id || idx} className="flex items-start justify-between gap-3 px-3 py-3">
              <div className="min-w-0">
                {href ? (
                  <Link href={href} target="_blank" rel="noopener noreferrer" className="text-[15px] font-semibold leading-snug text-ink hover:underline">{item.item_name}</Link>
                ) : (
                  <p className="text-[15px] font-semibold leading-snug text-ink">{item.item_name}</p>
                )}
                {(item.selected_size || item.selected_color) && (
                  <p className="mt-0.5 text-xs text-ink-muted">{[item.selected_size && `Size ${item.selected_size}`, item.selected_color && `Color ${item.selected_color}`].filter(Boolean).join(' · ')}</p>
                )}
                {item.add_ons && item.add_ons.length > 0 && <p className="mt-0.5 text-xs text-ink-muted">Add-ons: {item.add_ons.join(', ')}</p>}
                {item.notes && <p className="mt-0.5 text-xs text-ink-muted">Note: {item.notes}</p>}
              </div>
              <span className="shrink-0 rounded-md border border-line bg-white px-2 py-1 text-xs font-semibold tabular-nums text-ink">{item.quantity} {item.quantity === 1 ? 'pc' : 'pcs'}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
