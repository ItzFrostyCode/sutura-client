import OrderCard from './OrderCard';
import type { MyOrder } from './ordersTypes';

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;

/** The orders of one split or one visit, together: what they are and what is still to pay for all of them, then each order. */
export default function OrderGroup({ orders }: Readonly<{ orders: MyOrder[] }>) {
  const set = orders[0]?.group_kind === 'set';
  const open = orders.filter((o) => !['cancelled', 'rejected'].includes(o.status));
  const balance = open.reduce((s, o) => s + (o.balance || 0), 0);
  const total = open.reduce((s, o) => s + (o.total_amount || 0), 0);
  return (
    <section className="rounded-2xl border border-line bg-surface p-3" aria-label={set ? 'Orders from one visit' : 'Orders split in batches'}>
      <header className="mb-3 px-1">
        <h3 className="mobile-h4 text-ink">{set ? `${orders.length} orders from one visit` : `One order in ${orders.length} batches`}</h3>
        <p className="mobile-caption text-ink-muted">Each is made and paid on its own. In all: {peso(total)}, still to pay {peso(balance)}.</p>
      </header>
      <div className="space-y-3">
        {orders.map((o) => <OrderCard key={o.id} order={o} />)}
      </div>
    </section>
  );
}
