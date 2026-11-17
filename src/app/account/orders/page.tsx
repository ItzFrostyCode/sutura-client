'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Package, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import AccountHeader from '@/components/account/AccountHeader';
import FilterChips from '@/components/account/FilterChips';
import EmptyState from '@/components/account/EmptyState';
import ShopOrderCard from '@/components/account/orders/ShopOrderCard';
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
  // Uncapped counts from the server, preferred over deriving from the capped
  // list; an older server sends neither, so the chips fall back to the
  // per_page=100 derivation.
  const [total, setTotal] = useState<number | null>(null);
  const [statusCounts, setStatusCounts] = useState<{ inProduction?: number; readyForPickup?: number; completed?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'all');

  useEffect(() => {
    setLoading(true);
    api.get('/my-orders', { params: { per_page: 100 } })
      .then((res) => {
        setOrders(res.data.data ?? []);
        setTotal(typeof res.data.total === 'number' ? res.data.total : null);
        setStatusCounts(res.data.status_counts && typeof res.data.status_counts === 'object' ? res.data.status_counts : null);
      })
      .catch(() => { setOrders([]); setTotal(null); setStatusCounts(null); })
      .finally(() => setLoading(false));
  }, []);

  const activeMatch = TABS.find((t) => t.key === activeTab)?.match ?? TABS[0].match;
  const filteredOrders = useMemo(
    () => orders.filter((o) => activeMatch(o)),
    [orders, activeMatch],
  );

  // Tab badge: server number when the server knows it, capped-list derivation otherwise.
  // (Cancelled has no server bucket yet, so it always derives.)
  const tabCount = (tab: (typeof TABS)[number]): number | undefined => {
    if (loading) return undefined;
    const serverCount =
      tab.key === 'all' ? total
      : tab.key === 'production' ? statusCounts?.inProduction
      : tab.key === 'pickup' ? statusCounts?.readyForPickup
      : tab.key === 'completed' ? statusCounts?.completed
      : undefined;
    return serverCount ?? orders.filter((o) => tab.match(o)).length;
  };

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
        options={TABS.map((tab) => ({ key: tab.key, label: tab.label, count: tabCount(tab) }))}
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
        // One column at every width, one card shape: a solo order is a one-line card, a group is the same card
        // with more lines — the list never mixes two layouts.
        <div className="mt-3 space-y-3">
          {entries.map((e) => <ShopOrderCard key={e.key} orders={e.orders} />)}
        </div>
      )}
    </div>
  );
}
