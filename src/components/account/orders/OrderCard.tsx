import Link from 'next/link';
import Image from 'next/image';
import { Store, CalendarDays, Wallet, ChevronRight } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { type MyOrder, getPhaseMeta } from './ordersTypes';

/** One job order as a soft card: shop, what it is and where it stands, due date, and what is still to pay. */
export default function OrderCard({ order }: Readonly<{ order: MyOrder }>) {
  const meta = getPhaseMeta(order.status, order.progress);
  const StatusIcon = meta.Icon;
  const itemName = order.catalog_item_name ?? order.service_name ?? order.garment_category ?? 'Garment';

  return (
    <Link href={`/account/orders/${order.id}`} className="card-soft flex gap-3 p-4 transition-opacity active:opacity-80">
      <span className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-sunken">
        {order.store?.logo_path ? <Image src={getMediaUrl(order.store.logo_path)} alt="" fill className="object-cover" /> : <Store size={20} className="text-ink-faint" />}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="mobile-caption truncate text-ink-muted">{order.store?.name ?? 'Store'}</span>
          {order.is_rush && <span className="shrink-0 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-semibold text-danger">Rush</span>}
        </div>

        <div className="mt-0.5 flex items-start justify-between gap-2">
          <h3 className="mobile-h4 min-w-0 flex-1 truncate text-ink">
            {itemName}
            {(order.quantity ?? 1) > 1 && <span className="font-normal text-ink-muted"> × {order.quantity}</span>}
          </h3>
          <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.tone}`}>
            <StatusIcon size={12} /> {meta.label}
          </span>
        </div>

        {order.progress && <p className="mobile-body-sm mt-1 truncate font-normal text-ink-body">{order.progress.headline}</p>}
        {order.progress?.action && <p className="mobile-caption mt-1 font-semibold text-taupe">{order.progress.action.label}</p>}

        <div className="mobile-caption mt-1 flex items-center gap-3 text-ink-muted">
          <span className="truncate">{order.order_number}</span>
          {order.due_date && (
            <span className="flex shrink-0 items-center gap-1">
              <CalendarDays size={12} className="text-ink-faint" />
              Due {new Date(order.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        <div className="mobile-caption mt-3 flex items-center justify-between gap-2 text-ink-muted">
          <span className="flex min-w-0 items-center gap-1.5">
            <Wallet size={12} className="shrink-0 text-ink-faint" />
            <span className="truncate">₱{order.balance.toLocaleString()} balance of ₱{order.total_amount.toLocaleString()}</span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-ink-faint" />
        </div>

        {!!order.pending_payment_amount && order.pending_payment_amount > 0 && (
          <div className="mobile-caption mt-2 rounded-xl bg-amber-50 px-3 py-2 text-amber-800">
            ₱{order.pending_payment_amount.toLocaleString()} payment submitted — pending shop verification
          </div>
        )}
      </div>
    </Link>
  );
}
