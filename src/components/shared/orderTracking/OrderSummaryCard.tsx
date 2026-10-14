import Link from 'next/link';
import Image from 'next/image';
import { CalendarClock, CalendarDays, Shirt, Store, Wallet, Wrench } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import type { TrackedOrder } from '@/components/shared/OrderTrackingView';

interface OrderSummaryCardProps {
  readonly order: TrackedOrder;
  /** The customer-facing phase ("In Production"…), null for cancelled / rejected / on hold. */
  readonly phase: string | null;
}

const row = 'mobile-body-sm flex items-center gap-2 text-ink-muted';

/** The top card of an order: the shop, the order number and phase, what it is, when it is due, and what is still to pay. */
export default function OrderSummaryCard({ order, phase }: OrderSummaryCardProps) {
  const itemName = order.catalog_item_name ?? order.service_package?.name ?? order.service_name ?? order.garment_category ?? 'Garment';
  const hasMaterialNote = order.customer_material_status && order.customer_material_status !== 'safe';

  return (
    <div className="card-soft p-4">
      <div className="flex gap-3">
        <span className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-sunken">
          {order.store?.logo_path ? <Image src={getMediaUrl(order.store.logo_path)} alt="" fill className="object-cover" /> : <Store size={20} className="text-ink-faint" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            {order.store?.slug ? (
              <Link href={`/store/${order.store.slug}`} className="mobile-overline inline-flex items-center py-1 text-taupe hover:text-taupe-hover">{order.store.name}</Link>
            ) : (
              <p className="mobile-overline text-taupe">Order</p>
            )}
            {order.is_rush && <span className="shrink-0 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-semibold text-danger">Rush</span>}
          </div>
          <h3 className="mobile-h3 text-ink">{order.order_number}</h3>
        </div>
      </div>

      {phase && <span className="mt-3 inline-flex items-center rounded-full bg-taupe/10 px-2.5 py-1 text-xs font-semibold text-taupe">{phase}</span>}

      <div className="mt-3 space-y-1.5">
        <div className="mobile-body-sm flex items-center gap-2 text-ink">
          <Shirt size={16} className="shrink-0 text-ink-faint" />
          <span>{itemName}</span>
          {(order.quantity ?? 1) > 1 && <span className="text-ink-muted">× {order.quantity}</span>}
        </div>
        {order.service_package && (order.service_package.services?.length ?? 0) > 0 && (
          <p className="mobile-caption pl-6 text-ink-muted">Package · includes {order.service_package.services!.join(', ')}</p>
        )}
        {order.due_date && (
          <div className={row}>
            <CalendarDays size={16} className="shrink-0 text-ink-faint" />
            Due {new Date(order.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        )}
        {order.estimated_ready_at && (
          <div className={row}>
            <CalendarClock size={16} className="shrink-0 text-ink-faint" />
            Estimated ready {new Date(order.estimated_ready_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </div>
        )}
        <div className={row}>
          <Wallet size={16} className="shrink-0 text-ink-faint" />
          ₱{order.balance.toLocaleString()} balance of ₱{order.total_amount.toLocaleString()} ({order.payment_status})
        </div>
        {!!order.pending_payment_amount && order.pending_payment_amount > 0 && (
          <div className="mobile-caption rounded-xl bg-amber-50 px-3 py-2 text-amber-800">
            ₱{order.pending_payment_amount.toLocaleString()} payment submitted — pending shop verification, not yet reflected above
          </div>
        )}
      </div>

      {order.repair_note && (
        <div className="mt-3 rounded-xl bg-sunken p-3">
          <div className="mobile-caption mb-1 flex items-center gap-2 text-ink-muted">
            <Wrench size={14} className="text-ink-faint" />
            Repair request
          </div>
          <p className="mobile-body-sm text-ink">&ldquo;{order.repair_note}&rdquo;</p>
        </div>
      )}

      {hasMaterialNote && (
        <p className="mobile-body-sm mt-3">
          <span className="font-semibold text-ink">Your material: </span>
          <span className="capitalize text-ink-muted">{order.customer_material_status}</span>
        </p>
      )}

      {order.tracking_code && (
        <p className="mobile-caption mt-3 text-ink-faint">
          Tracking code: <span className="font-mono text-ink-muted">{order.tracking_code}</span>
        </p>
      )}
    </div>
  );
}
