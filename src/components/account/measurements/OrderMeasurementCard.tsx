'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import StoreLogoAvatar from '@/components/StoreLogoAvatar';
import { MeasurementStatusBadge } from '@/components/measurements/MeasurementStatus';
import { getPhaseMeta } from '@/components/account/orders/ordersTypes';
import MeasurementSheet from './MeasurementSheet';
import VersionPicker from './VersionPicker';
import type { MeasurementOrder, MyMeasurement } from './measurementAccountTypes';

const day = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

/**
 * One job order and the measurements the shop recorded for it: the order on top (opens it), then the version (the one
 * this order was made with is tagged; the latest version shows first, and any other version can be opened), then the sizes.
 */
export default function OrderMeasurementCard({ order, measurement, versions = [measurement] }: { readonly order: MeasurementOrder; readonly measurement: MyMeasurement; readonly versions?: MyMeasurement[] }) {
  // Latest first; the version this order used is one tap away (VersionPicker's link).
  const [selectedId, setSelectedId] = useState(versions.at(-1)?.id ?? measurement.id);
  const shown = versions.find((v) => v.id === selectedId) ?? measurement;
  const meta = getPhaseMeta(order.status);
  const item = order.catalog_item?.name ?? order.service?.name ?? order.garment_category ?? 'Job order';

  return (
    <article className="card-soft p-4">
      <Link href={`/account/orders/${order.id}`} className="flex items-center gap-3 transition-opacity active:opacity-80">
        <StoreLogoAvatar
          src={measurement.store?.logo_path}
          name={measurement.store?.name ?? 'Shop'}
          className="h-10 w-10 rounded-full border border-line-strong shadow-none"
          textClassName="text-sm font-serif font-bold text-taupe-dark"
        />
        <span className="min-w-0 flex-1">
          <span className="mobile-h4 block break-words text-ink">{item}</span>
          <span className="mobile-caption block text-ink-muted">{measurement.store?.name ?? 'Shop'} · {order.order_number}</span>
        </span>
        <span className={`hidden shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold min-[400px]:flex ${meta.tone}`}><meta.Icon size={11} aria-hidden /> {meta.label}</span>
        <ChevronRight size={18} className="shrink-0 text-ink-faint" aria-hidden />
      </Link>

      <div className="mt-3 space-y-2 border-t border-line pt-3">
        <VersionPicker versions={versions} selectedId={shown.id} onSelect={setSelectedId} usedId={measurement.id} />
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <MeasurementStatusBadge status={shown.status} />
          <span className="mobile-caption text-ink-muted">Recorded {day(shown.updated_at)}</span>
        </div>
      </div>

      <div className="mt-3">
        <MeasurementSheet record={shown} />
      </div>
    </article>
  );
}
