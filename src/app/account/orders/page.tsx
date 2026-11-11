'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Package, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import AccountHeader from '@/components/account/AccountHeader';
import FilterChips from '@/components/account/FilterChips';
import EmptyState from '@/components/account/EmptyState';
import OrderCard from '@/components/account/orders/OrderCard';
import OrderGroup from '@/components/account/orders/OrderGroup';
import { type MyOrder, TABS } from '@/components/account/orders/ordersTypes';

export default function MyOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center bg-white">
          <Loader2 size={28} className="animate-spin text-ink-faint" />
        </div>
      }
    >
      <MyOrdersPageContent />
    </Suspense>
  );
}

function MyOrdersPageContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'all');

  useEffect(() => {
    setLoading(true);
    api.get('/my-orders', { params: { per_page: 100 } })
      .then((res) => setOrders(res.data.data ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const activeMatch = TABS.find((t) => t.key === activeTab)?.match ?? TABS[0].match;
  const filteredOrders = useMemo(
    () => orders.filter((o) => activeMatch(o)),
    [orders, activeMatch],
  );

  // Linked orders (batches or a set of services) are shown together, in the order of the first one.
  const entries = useMemo(() => {
    const seen = new Set<number>();
    const list: { key: string; orders: MyOrder[] }[] = [];
    for (const o of filteredOrders) {
      const root = o.parent_order_id ?? o.id;
      if (seen.has(root)) continue;
      seen.add(root);
      const family = filteredOrders.filter((x) => (x.parent_order_id ?? x.id) === root).sort((a, b) => (a.batch_no ?? 1) - (b.batch_no ?? 1));
      list.push({ key: String(root), orders: family });
    }
    return list;
  }, [filteredOrders]);

  return (
    <div className="w-full">
      <AccountHeader title="My Job Orders" backHref="/account" />

      <FilterChips
        label="Order status"
        active={activeTab}
        onChange={setActiveTab}
        options={TABS.map((tab) => ({ key: tab.key, label: tab.label, count: loading ? undefined : orders.filter((o) => tab.match(o)).length }))}
      />

      {loading && <div className="py-16 text-center mobile-body-sm text-ink-muted">Loading your orders…</div>}

      {!loading && filteredOrders.length === 0 && (
        <div className="mt-3">
          <EmptyState
            Icon={Package}
            title={orders.length === 0 ? 'No orders yet' : 'Nothing in this tab yet'}
            message={orders.length === 0 ? 'Once you book a fitting or place an order, it’ll show up here.' : 'Try a different tab.'}
            action={orders.length === 0 ? { href: '/search', label: 'Find a Shop' } : undefined}
          />
        </div>
      )}

      {!loading && filteredOrders.length > 0 && (
        // One column on a phone; two from 640px (tablet, and the 672px content beside the desktop menu). Never three:
        // beside the menu each card would be too narrow for the shop, order number and badge.
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {entries.map((e) => (e.orders.length > 1
            ? <div key={e.key} className="sm:col-span-2"><OrderGroup orders={e.orders} /></div>
            : <OrderCard key={e.key} order={e.orders[0]} />))}
        </div>
      )}
    </div>
  );
}
