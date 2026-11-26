import Link from 'next/link';
import StoreLogoAvatar from '@/components/StoreLogoAvatar';
import OrderStatusPill from '@/components/account/orders/OrderStatusPill';
import { type MyOrder } from './accountTypes';

/** The action-ranked order as a soft inner card: who it is for, what, where it stands, what's owed. */
export default function OrderPreviewItem({ order }: { readonly order: MyOrder }) {
  const balance = order.balance ?? 0;
  const pending = order.pending_payment_amount ?? 0;

  return (
    // The whole box opens the order (a big target, not just the "View order" text).
    <Link href={`/account/orders/${order.id}`} className="mt-3 block rounded-2xl border border-line bg-surface p-3.5 transition-colors hover:bg-sunken active:opacity-80">
      <div className="flex items-center gap-2">
        <StoreLogoAvatar
          src={order.store?.logo_path}
          name={order.store?.name ?? 'Store'}
          className="w-10 h-10 rounded-full border border-line-strong shadow-none"
          textClassName="text-sm font-serif font-bold text-taupe-dark"
        />
        <span className="mobile-body-sm min-w-0 flex-1 truncate font-semibold text-ink">{order.store?.name ?? 'Store'}</span>
        <OrderStatusPill status={order.status} />
      </div>
      <h3 className="mobile-h4 mt-1.5 text-ink">{order.catalog_item_name ?? order.service_name ?? 'Job order'}</h3>
      <p className="mobile-caption text-ink-muted">#{order.order_number}</p>
      {order.progress && <p className="mobile-caption mt-1 text-ink-muted">{order.progress.headline}</p>}
      {(balance > 0 || pending > 0) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {balance > 0 && (
            <span className="mobile-caption rounded-full bg-sunken px-2 py-0.5 font-semibold text-ink">
              ₱{balance.toLocaleString('en-PH')} left
            </span>
          )}
          {pending > 0 && (
            <span className="mobile-caption rounded-full bg-sunken px-2 py-0.5 font-semibold text-ink">
              ₱{pending.toLocaleString('en-PH')} pending approval
            </span>
          )}
        </div>
      )}
      <span className="mobile-caption mt-2 inline-block font-semibold text-taupe">View order →</span>
    </Link>
  );
}
