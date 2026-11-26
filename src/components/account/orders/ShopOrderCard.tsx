import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import ShopCardShell from './ShopCardShell';
import OrderStatusPill from './OrderStatusPill';
import type { MyOrder } from './ordersTypes';

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;

function orderName(order: MyOrder): string {
  return order.catalog_item_name ?? order.service_name ?? order.garment_category ?? 'Garment';
}

/**
 * One line of the card: where the order stands, when it is due, and what it still owes. On a card with several orders
 * each line is its own link to that order's page; on a single-order card the whole card is the link (`linked` false).
 */
function OrderRow({ order, linked = true }: Readonly<{ order: MyOrder; linked?: boolean }>) {
  const due = order.due_date
    ? new Date(order.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const body = (
    <>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <p className="mobile-h4 min-w-0 truncate text-ink">
          {orderName(order)}
          {(order.quantity ?? 1) > 1 && <span className="font-normal text-ink-muted"> × {order.quantity}</span>}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          {order.is_rush && (
            <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-semibold text-danger">Rush</span>
          )}
          <OrderStatusPill status={order.status} />
        </div>
      </div>
      <div className="mobile-caption flex min-w-0 items-center justify-between gap-2 text-ink-muted">
        <span className="flex min-w-0 items-center gap-3">
          {due && (
            <span className="flex shrink-0 items-center gap-1">
              <CalendarDays size={12} className="text-ink-faint" />
              Due {due}
            </span>
          )}
          <span className="truncate">Placed {new Date(order.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </span>
        {order.status === 'pending' && Number(order.total_amount || 0) <= 0 ? (
          <span className="mobile-caption shrink-0 text-ink-muted">Waiting for price</span>
        ) : (
          <span className="mobile-body-sm shrink-0 font-semibold text-ink">{peso(order.balance)}</span>
        )}
      </div>
    </>
  );

  if (!linked) return <div className="flex min-h-[56px] flex-col justify-center gap-1 py-2">{body}</div>;

  return (
    <Link
      href={`/account/orders/${order.id}`}
      className="-mx-2 flex min-h-[56px] flex-col justify-center gap-1 rounded-lg px-2 py-2 transition-colors hover:bg-sunken active:opacity-80"
    >
      {body}
    </Link>
  );
}

/**
 * The one card in the order list: one shop's visit. A solo order is just a one-line card; a split or a set of
 * services is several lines with one money line for all of them. Nothing else in this list has a different shape.
 */
export default function ShopOrderCard({ orders }: Readonly<{ orders: MyOrder[] }>) {
  const many = orders.length > 1;
  const set = orders[0]?.group_kind === 'set';
  const open = orders.filter((o) => !['cancelled', 'rejected'].includes(o.status));
  const balance = open.reduce((s, o) => s + (o.balance || 0), 0);
  const total = open.reduce((s, o) => s + (o.total_amount || 0), 0);
  const pending = open.reduce((s, o) => s + (o.pending_payment_amount ?? 0), 0);

  return (
    <ShopCardShell
      order={orders[0]}
      caption={many ? (set ? `${orders.length} orders from one visit` : `One order in ${orders.length} batches`) : undefined}
      href={many ? undefined : `/account/orders/${orders[0].id}`}
    >
      <div className="divide-y divide-line">
        {orders.map((o) => <OrderRow key={o.id} order={o} linked={many} />)}
        {many && (
          <div className="flex items-center justify-between gap-2 py-2">
            <span className="mobile-body-sm text-ink">
              In all {peso(total)} · still to pay <span className="font-semibold">{peso(balance)}</span>
            </span>
            {pending > 0 && (
              <span
                className="shrink-0 rounded-full bg-sunken px-2 py-0.5 text-[11px] font-semibold text-ink-muted"
                title="Payment submitted — pending shop verification, not yet reflected in the balance"
              >
                {peso(pending)} pending
              </span>
            )}
          </div>
        )}
      </div>
    </ShopCardShell>
  );
}
