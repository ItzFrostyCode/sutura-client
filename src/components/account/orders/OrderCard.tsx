import Link from 'next/link';
import Image from 'next/image';
import { Store, CalendarDays, ChevronRight, Shirt } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { type MyOrder, getPhaseMeta } from './ordersTypes';
import RateShopStars from './RateShopStars';

interface OrderCardProps {
  readonly order: MyOrder;
  /** The customer's rating of this order's shop (0 = not rated); only used on completed orders. */
  readonly shopRating?: number;
  readonly onRated?: (slug: string, rating: number) => void;
}

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;

/**
 * One order on My Orders, like a shop app's order list: the shop and where the order is, then what is being made
 * (never cut off), then the money and the one next step — Pay, or, once completed, rate the shop (stars only).
 */
export default function OrderCard({ order, shopRating = 0, onRated }: OrderCardProps) {
  const meta = getPhaseMeta(order.status);
  const StatusIcon = meta.Icon;
  const itemName = order.catalog_item_name ?? order.service_package?.name ?? order.service_name ?? order.garment_category ?? 'Garment';
  const pending = order.pending_payment_amount ?? 0;
  // Something left to pay (not counting a payment the shop is still checking) on an open order.
  const toPay = Math.max(0, Math.round((order.balance - pending) * 100) / 100);
  const closed = ['cancelled', 'rejected', 'completed'].includes(order.status);
  const canPay = toPay > 0 && !closed;
  const href = `/account/orders/${order.id}`;
  const paid = order.balance <= 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-line-strong">
      {/* Shop + where the order is */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <span className="flex min-w-0 items-center gap-2">
          <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-line bg-sunken">
            {order.store?.logo_path
              ? <Image src={getMediaUrl(order.store.logo_path)} alt="" fill sizes="28px" className="object-cover" />
              : <Store size={14} className="m-auto mt-1.5 text-ink-faint" />}
          </span>
          <span className="truncate text-sm font-semibold text-ink">{order.store?.name ?? 'Shop'}</span>
        </span>
        <span className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${meta.tone}`}>
          <StatusIcon size={12} aria-hidden /> {meta.label}
        </span>
      </div>

      {/* What is being made — the whole card body opens the order */}
      <Link href={href} className="group flex items-center gap-3 px-4 py-3">
        {/* Like a shop app's order row: a picture of what is being made. */}
        <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-sunken">
          {order.image
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={getMediaUrl(order.image)} alt="" loading="lazy" className="h-full w-full object-cover" />
            : <Shirt size={22} className="text-ink-faint" aria-hidden />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-base font-semibold leading-snug text-ink group-hover:underline">
              {itemName}
              {(order.quantity ?? 1) > 1 && <span className="font-normal text-ink-muted"> × {order.quantity}</span>}
            </span>
            {order.is_rush && <span className="rounded-full border border-danger/20 bg-danger/10 px-2 py-0.5 text-[10px] font-semibold text-danger">Rush</span>}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-muted">
            <span className="font-mono">{order.order_number}</span>
            {order.due_date && !closed && (
              <span className="flex items-center gap-1">
                <CalendarDays size={12} className="text-ink-faint" aria-hidden />
                Due {new Date(order.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </span>
        </span>
        <ChevronRight size={18} className="shrink-0 text-ink-faint" aria-hidden />
      </Link>

      {/* Money and the next step */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line bg-canvas/60 px-4 py-2.5">
        <p className="text-sm text-ink-body">
          {paid
            ? <>Fully paid · <span className="font-semibold text-ink">{peso(order.total_amount)}</span></>
            : <><span className="font-semibold text-ink">{peso(order.balance)}</span> left of {peso(order.total_amount)}</>}
          {pending > 0 && !paid && <span className="block text-xs text-amber-700">{peso(pending)} sent · the shop is checking it</span>}
        </p>
        {canPay ? (
          <Link href={`${href}#pay`} className="flex h-10 shrink-0 items-center rounded-full bg-taupe px-4 text-sm font-semibold text-white hover:bg-taupe-hover">
            Pay {peso(toPay)}
          </Link>
        ) : (
          <Link href={href} className="flex h-10 shrink-0 items-center rounded-full border border-line-strong px-4 text-sm font-semibold text-ink hover:bg-sunken">
            View order
          </Link>
        )}
      </div>

      {/* Completed: rate the shop, stars only */}
      {order.status === 'completed' && order.store?.slug && onRated && (
        <div className="border-t border-line px-4 py-2">
          <RateShopStars storeSlug={order.store.slug} storeName={order.store.name} rating={shopRating} onRated={(r) => onRated(order.store!.slug, r)} />
        </div>
      )}
    </article>
  );
}
