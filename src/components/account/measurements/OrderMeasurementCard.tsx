import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Ruler, Store } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { MeasurementStatusBadge } from '@/components/measurements/MeasurementStatus';
import { MetricPill, humanizeMetricKey } from '@/components/measurements/measurementHelpers';
import { getPhaseMeta } from '@/components/account/orders/ordersTypes';
import type { MeasurementOrder, MyMeasurement } from './measurementAccountTypes';

/** One order and the measurements it is being made with: the order on top (opens it), then the sizes the shop used. */
export default function OrderMeasurementCard({ order, measurement }: { readonly order: MeasurementOrder; readonly measurement: MyMeasurement }) {
  const meta = getPhaseMeta(order.status);
  const item = order.catalog_item?.name ?? order.service?.name ?? order.garment_category ?? 'Order';
  const metrics = Object.entries(measurement.metrics || {}).filter(([, v]) => v);

  return (
    <div className="card-soft p-4">
      <Link href={`/account/orders/${order.id}`} className="flex items-center gap-3 transition-opacity active:opacity-80">
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-sunken">
          {measurement.store?.logo_path ? <Image src={getMediaUrl(measurement.store.logo_path)} alt="" fill className="object-cover" /> : <Store size={16} className="text-ink-faint" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="mobile-h4 block truncate text-ink">{item}</span>
          <span className="mobile-caption block truncate text-ink-muted">
            {measurement.store?.name ?? 'Store'} · {order.order_number} · {new Date(order.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </span>
        <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.tone}`}><meta.Icon size={11} /> {meta.label}</span>
        <ChevronRight size={18} className="shrink-0 text-ink-faint" />
      </Link>

      <div className="mt-3 rounded-2xl bg-sunken p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Ruler size={15} className="shrink-0 text-taupe" />
          <span className="mobile-body-sm font-semibold text-ink">{measurement.profile_name}</span>
          <span className="mobile-caption text-ink-muted">Version {measurement.version}</span>
          <MeasurementStatusBadge status={measurement.status} />
        </div>
        {metrics.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {metrics.map(([key, value]) => <MetricPill key={key} label={humanizeMetricKey(key)} value={value} />)}
          </div>
        ) : (
          <p className="mobile-caption mt-2 text-ink-faint">No sizes typed in for this version.</p>
        )}
      </div>
    </div>
  );
}
