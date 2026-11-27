'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Package, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { useLiveRefresh } from '@/lib/liveUpdates';
import AccountHeader from '@/components/account/AccountHeader';
import OrderCard from '@/components/account/orders/OrderCard';
import { type MyOrder, TABS } from '@/components/account/orders/ordersTypes';

export default function MyOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-ink-faint" />
        </div>
      }
    >
      <MyOrdersPageContent />
    </Suspense>
  );
}

function OrdersListSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading orders">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-surface border border-line rounded-2xl overflow-hidden animate-pulse">
          <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-sunken" />
              <div className="h-3.5 w-36 rounded bg-sunken" />
            </div>
            <div className="h-5 w-24 rounded-full bg-sunken" />
          </div>
          <div className="px-4 py-3.5 flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-xl bg-sunken shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 max-w-full rounded bg-sunken" />
              <div className="h-3 w-32 rounded bg-sunken" />
            </div>
          </div>
          <div className="px-4 py-3 border-t border-line flex items-center justify-between">
            <div className="h-3.5 w-28 rounded bg-sunken" />
            <div className="h-9 w-24 rounded-full bg-sunken" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MyOrdersPageContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [storeRatings, setStoreRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'all');

  const fetchRatings = () => {
    api.get('/my-store-reviews')
      .then((res) => {
        const list = (res.data.data ?? []) as Array<{ slug?: string; rating?: number }>;
        const next: Record<string, number> = {};
        for (const item of list) {
          if (item.slug && typeof item.rating === 'number') {
            next[item.slug] = item.rating;
          }
        }
        setStoreRatings(next);
      })
      .catch(() => {});
  };

  useEffect(() => {
    setLoading(true);
    api.get('/my-orders', { params: { per_page: 100 } })
      .then((res) => setOrders(res.data.data ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
    fetchRatings();
  }, []);

  // Stage changes and payment checks show up without a refresh.
  useLiveRefresh(['jobs', 'orders', 'payments'], () => {
    api.get('/my-orders', { params: { per_page: 100 } })
      .then((res) => setOrders(res.data.data ?? []))
      .catch(() => {});
    fetchRatings();
  });

  const activeMatch = TABS.find((t) => t.key === activeTab)?.match ?? TABS[0].match;
  const filteredOrders = useMemo(
    () => orders.filter((o) => activeMatch(o.status)),
    [orders, activeMatch],
  );

  return (
    <div className="w-full max-w-4xl">
      <AccountHeader title="My Job Orders" backHref="/account" />
      <h1 className="hidden md:block text-2xl font-bold tracking-tight text-ink mb-4">
        My Job Orders
      </h1>

      {/* Tabs Row */}
      <div className="flex items-center gap-1 mb-4 border-b border-line overflow-x-auto hide-scrollbar">
        {TABS.map((tab) => {
          const count = orders.filter((o) => tab.match(o.status)).length;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`touch-target-44 shrink-0 whitespace-nowrap px-3.5 sm:px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors duration-150 cursor-pointer ${
                isActive
                  ? 'border-ink text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}{' '}
              {!loading && (
                <span className={`font-normal tabular-nums ${isActive ? 'text-ink-muted' : 'text-ink-faint'}`}>
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading && <OrdersListSkeleton />}

      {!loading && filteredOrders.length === 0 && (
        <div className="bg-surface border border-line rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-sunken flex items-center justify-center mx-auto mb-3">
            <Package size={22} className="text-ink-faint" />
          </div>
          <h2 className="mobile-h3 font-semibold text-ink mb-1">
            {orders.length === 0 ? 'No orders yet' : 'Nothing in this tab yet'}
          </h2>
          <p className="mobile-body-sm text-ink-muted mb-6 font-normal max-w-sm mx-auto">
            {orders.length === 0
              ? 'Once you book a fitting or place an order, it’ll show up here.'
              : 'Try switching to a different status tab above.'}
          </p>
          {orders.length === 0 && (
            <Link
              href="/map"
              className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-taupe hover:bg-taupe-hover text-white text-sm font-semibold transition-colors duration-150 active:scale-[0.97]"
            >
              Browse Shops →
            </Link>
          )}
        </div>
      )}

      {!loading && filteredOrders.length > 0 && (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              storeRating={order.store?.slug ? storeRatings[order.store.slug] : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
