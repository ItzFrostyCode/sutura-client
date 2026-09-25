'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Package, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import AccountHeader from '@/components/account/AccountHeader';
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

      {/* Tabs Row */}
      <div className="flex items-center gap-1 mb-4 border-b border-line overflow-x-auto hide-scrollbar">
        {TABS.map((tab) => {
          const count = orders.filter((o) => tab.match(o.status)).length;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`touch-target-44 shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                activeTab === tab.key
                  ? 'border-taupe text-taupe'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label} {!loading && <span className="text-ink-faint font-normal">({count})</span>}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="text-center py-16 mobile-body-sm text-ink-muted">Loading your orders…</div>
      )}

      {!loading && filteredOrders.length === 0 && (
        <div className="bg-surface border border-line p-8 text-center">
          <Package size={28} className="text-ink-faint mx-auto mb-3" />
          <h2 className="mobile-h3 font-semibold text-ink mb-1">
            {orders.length === 0 ? 'No orders yet' : 'Nothing in this tab yet'}
          </h2>
          <p className="mobile-body-sm text-ink-muted mb-6 font-normal space-headline-para">
            {orders.length === 0
              ? 'Once you book a fitting or place an order, it’ll show up here.'
              : 'Try a different tab.'}
          </p>
          {orders.length === 0 && (
            <Link
              href="/stores"
              className="btn-primary-mobile bg-taupe hover:bg-taupe-hover text-white max-w-[180px] mx-auto"
            >
              Browse Stores →
            </Link>
          )}
        </div>
      )}

      {!loading && filteredOrders.length > 0 && (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
