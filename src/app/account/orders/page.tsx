'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Package, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import AccountHeader from '@/components/account/AccountHeader';
import FilterChips from '@/components/account/FilterChips';
import EmptyState from '@/components/account/EmptyState';
import OrderCard from '@/components/account/orders/OrderCard';
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
    () => orders.filter((o) => activeMatch(o.status)),
    [orders, activeMatch],
  );

  return (
    <div className="w-full">
      <AccountHeader title="My Job Orders" backHref="/account" />

      <FilterChips
        label="Order status"
        active={activeTab}
        onChange={setActiveTab}
        options={TABS.map((tab) => ({ key: tab.key, label: tab.label, count: loading ? undefined : orders.filter((o) => tab.match(o.status)).length }))}
      />

      {loading && <div className="py-16 text-center mobile-body-sm text-ink-muted">Loading your orders…</div>}

      {!loading && filteredOrders.length === 0 && (
        <div className="mt-3">
          <EmptyState
            Icon={Package}
            title={orders.length === 0 ? 'No orders yet' : 'Nothing in this tab yet'}
            message={orders.length === 0 ? 'Once you book a fitting or place an order, it’ll show up here.' : 'Try a different tab.'}
            action={orders.length === 0 ? { href: '/stores', label: 'Browse Stores' } : undefined}
          />
        </div>
      )}

      {!loading && filteredOrders.length > 0 && (
        // Single column on mobile; a 2-3 col grid from md: up so a wide
        // AccountLayout content area doesn't stretch each card into a thin,
        // mostly-empty full-width row — OrderCard's own layout (avatar left,
        // info right) already works fine inside a grid cell as-is.
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
