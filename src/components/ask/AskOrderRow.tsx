import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getPhaseMeta, type MyOrder } from '@/components/account/orders/ordersTypes';

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;

/** One order in "Where is my order?": what is being made, at which shop, what stage it is in, and what is left to pay. */
export default function AskOrderRow({ order }: { readonly order: MyOrder }) {
  const what = order.catalog_item_name ?? order.service_name ?? 'Your order';
  const stage = getPhaseMeta(order.status, order.progress).label;
  const pending = order.pending_payment_amount ?? 0;
  return (
    <li>
      <Link href={`/account/orders/${order.id}`} className="group flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-[#F7F1EA] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-taupe">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-ink group-hover:text-taupe">{what}</p>
          <p className="truncate text-sm text-ink-muted">#{order.order_number}{order.store ? ` · ${order.store.name}` : ''}</p>
          <p className="mt-1 text-sm text-ink-body">
            <span className="font-semibold text-ink">{stage}</span>
            {' · '}
            {order.balance > 0 ? `${peso(order.balance)} left to pay` : 'Fully paid'}
            {pending > 0 && ` (${peso(pending)} waiting for the shop to confirm)`}
          </p>
        </div>
        <ChevronRight size={18} className="shrink-0 text-ink-faint" aria-hidden="true" />
      </Link>
    </li>
  );
}
