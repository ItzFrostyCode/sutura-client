import Link from 'next/link';
import StoreLogoAvatar from '@/components/StoreLogoAvatar';
import OrderStatusPill from '@/components/account/orders/OrderStatusPill';
import { type MyOrder } from './accountTypes';

/** The action-ranked order as a soft inner card: who it is for, what, where it stands, what's owed. */
export default function OrderPreviewItem({ order }: { readonly order: MyOrder }) {
  const balance = order.balance ?? 0;
  const pending = order.pending_payment_amount ?? 0;

  return (
    <div className="mt-3 rounded-2xl bg-sunken p-3.5">
      <div className="flex items-center gap-2">
        <StoreLogoAvatar
          src={order.store?.logo_path}
          name={order.store?.name ?? 'Store'}
          className="w-7 h-7 rounded-full border border-line-strong shadow-none"
          textClassName="text-xs font-serif font-bold text-taupe-dark"
        />
        {order.store?.slug ? (
          <Link href={`/store/${order.store.slug}`} className="mobile-caption min-w-0 flex-1 truncate text-ink-muted">
            {order.store?.name ?? 'Store'}
          </Link>
        ) : (
          <span className="mobile-caption min-w-0 flex-1 truncate text-ink-muted">{order.store?.name ?? 'Store'}</span>
        )}
        <OrderStatusPill status={order.status} />
      </div>
      <h3 className="mobile-h4 mt-1.5 text-ink">{order.catalog_item_name ?? order.service_name ?? 'Job order'}</h3>
      <p className="mobile-caption text-ink-muted">Order {order.order_number}</p>
      {order.progress && <p className="mobile-caption mt-1 text-ink-muted">{order.progress.headline}</p>}
      {(balance > 0 || pending > 0) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {balance > 0 && (
            <span className="mobile-caption rounded-full bg-surface px-2 py-0.5 font-semibold text-ink">
              ₱{balance.toLocaleString('en-PH')} left
            </span>
          )}
          {pending > 0 && (
            <span className="mobile-caption rounded-full bg-surface px-2 py-0.5 font-semibold text-ink">
              ₱{pending.toLocaleString('en-PH')} pending approval
            </span>
          )}
        </div>
      )}
      <Link href={`/account/orders/${order.id}`} className="mobile-caption mt-2 inline-block font-semibold text-taupe">
        View order →
      </Link>
    </div>
  );
}
