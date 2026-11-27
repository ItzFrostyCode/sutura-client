import Link from 'next/link';
import Image from 'next/image';
import { Store, CalendarDays, ChevronRight, Shirt, Star } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { type MyOrder, getPhaseMeta } from './ordersTypes';

const RATING_LABELS = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'] as const;

export default function OrderCard({
  order,
  storeRating,
}: Readonly<{ order: MyOrder; storeRating?: number | null }>) {
  const meta = getPhaseMeta(order.status);
  const StatusIcon = meta.Icon;
  const itemName = order.catalog_item_name ?? order.service_package?.name ?? order.service_name ?? order.garment_category ?? 'Garment';
  // Something left to pay (not counting a payment the shop is still checking) on an open order.
  const toPay = Math.max(0, Math.round((order.balance - (order.pending_payment_amount ?? 0)) * 100) / 100);
  const canPay = toPay > 0 && !['cancelled', 'rejected', 'completed'].includes(order.status);
  const isPaid = order.balance <= 0 || order.payment_status === 'paid';
  const showRatingRow = order.status === 'completed' && !!order.store?.slug;
  const ratedStars = storeRating && storeRating >= 1 && storeRating <= 5 ? Math.round(storeRating) : 0;
  const ratingLabel = ratedStars > 0 ? RATING_LABELS[ratedStars - 1] : null;

  return (
    <Link
      href={canPay ? `/account/orders/${order.id}#pay` : `/account/orders/${order.id}`}
      className="group block bg-surface border border-line rounded-2xl overflow-hidden transition-[border-color,transform] duration-200 ease-out hover:border-line-strong active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-taupe/40"
    >
      {/* Top bar: store name + status badge */}
      <div className="px-4 py-2.5 border-b border-line flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-full bg-sunken border border-line overflow-hidden relative shrink-0 flex items-center justify-center">
            {order.store?.logo_path ? (
              <Image
                src={getMediaUrl(order.store.logo_path)}
                alt=""
                fill
                className="object-cover"
              />
            ) : (
              <Store size={11} className="text-ink-faint" />
            )}
          </div>
          <span className="text-xs font-semibold text-ink truncate">
            {order.store?.name ?? 'Store'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {order.is_rush && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-danger/10 text-danger border border-danger/20">
              Rush
            </span>
          )}
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${meta.tone}`}>
            <StatusIcon size={11} />
            <span>{meta.label}</span>
          </span>
        </div>
      </div>

      {/* Middle row: thumbnail + item details + chevron */}
      <div className="px-4 py-3.5 flex items-center gap-3.5">
        <div className="w-14 h-14 rounded-xl bg-sunken border border-line overflow-hidden relative shrink-0 flex items-center justify-center">
          {order.store?.logo_path ? (
            <Image
              src={getMediaUrl(order.store.logo_path)}
              alt={itemName}
              fill
              className="object-cover"
            />
          ) : (
            <Shirt size={22} className="text-ink-faint" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-ink truncate leading-snug">
            {itemName}
            {(order.quantity ?? 1) > 1 && (
              <span className="text-ink-muted font-medium tabular-nums"> × {order.quantity}</span>
            )}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-ink-muted tabular-nums">
            <span className="font-medium">{order.order_number}</span>
            {order.due_date && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={12} className="text-ink-faint shrink-0" />
                Due {new Date(order.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>

        <ChevronRight
          size={16}
          className="text-ink-faint shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-ink-muted"
        />
      </div>

      {/* Footer row: balance / pending verification + action pill */}
      <div className="px-4 py-3 border-t border-line flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-ink-muted truncate tabular-nums">
            {isPaid ? (
              <>
                Fully paid · <span className="font-semibold text-ink">₱{order.total_amount.toLocaleString()}</span>
              </>
            ) : (
              <>
                <span className="font-semibold text-ink">₱{order.balance.toLocaleString()}</span> left of ₱{order.total_amount.toLocaleString()}
              </>
            )}
          </p>
          {!!order.pending_payment_amount && order.pending_payment_amount > 0 && (
            <p className="text-[11px] font-medium text-amber-700 mt-0.5 truncate tabular-nums">
              ₱{order.pending_payment_amount.toLocaleString()} sent · the shop is checking it
            </p>
          )}
        </div>

        {canPay ? (
          <span className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-taupe group-hover:bg-taupe-hover text-white text-xs font-semibold shrink-0 transition-colors duration-150 tabular-nums">
            Pay ₱{toPay.toLocaleString()}
          </span>
        ) : (
          <span className="inline-flex items-center justify-center h-9 px-4 rounded-full border border-line-strong bg-surface group-hover:bg-sunken text-ink text-xs font-semibold shrink-0 transition-colors duration-150">
            View order
          </span>
        )}
      </div>

      {showRatingRow && (
        <div className="px-4 py-2.5 border-t border-line bg-canvas/40 flex items-center justify-between gap-3">
          <p className="text-xs text-ink-muted truncate">
            {ratedStars > 0 ? (
              <>
                You rated <span className="font-semibold text-ink">{order.store?.name}</span>
                {ratingLabel && <span> · {ratingLabel}</span>}
              </>
            ) : (
              <>
                Rate <span className="font-semibold text-ink">{order.store?.name}</span>
              </>
            )}
          </p>
          <div className="flex items-center gap-0.5 shrink-0" aria-label={ratedStars > 0 ? `${ratedStars} out of 5 stars` : 'Not rated yet'}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={14}
                className={star <= ratedStars ? 'text-amber-400 fill-amber-400' : 'text-line-strong'}
              />
            ))}
          </div>
        </div>
      )}
    </Link>
  );
}
