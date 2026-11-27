'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Package, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
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
  // The customer's shop ratings (by shop slug), for the stars on completed orders.
  const [ratings, setRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    setLoading(true);
    api.get('/my-orders', { params: { per_page: 100 } })
      .then((res) => setOrders(res.data.data ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
    api.get('/my-store-reviews')
      .then((res) => setRatings(Object.fromEntries((res.data.data ?? []).map((r: { slug: string; rating: number }) => [r.slug, r.rating]))))
      .catch(() => setRatings({}));
  }, []);

  // Phones only fit about three tabs: show an arrow (and a fade) on the side that still has tabs, tap to scroll.
  const tabsRef = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ left: false, right: false });
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const update = () => setEdge({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { el.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [loading]);
  const scrollTabs = (dir: 1 | -1) => tabsRef.current?.scrollBy({ left: dir * 160, behavior: 'smooth' });

  const activeMatch = TABS.find((t) => t.key === activeTab)?.match ?? TABS[0].match;
  const filteredOrders = useMemo(
    () => orders.filter((o) => activeMatch(o.status)),
    [orders, activeMatch],
  );

  return (
    <div className="w-full">
      <AccountHeader title="My Job Orders" backHref="/account" />

      {/* Tabs Row */}
      <div className="relative mb-4">
      <div ref={tabsRef} className="flex items-center gap-1 border-b border-line overflow-x-auto hide-scrollbar">
        {TABS.map((tab) => {
          const count = orders.filter((o) => tab.match(o.status)).length;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={(e) => { setActiveTab(tab.key); e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); }}
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
      {edge.left && (
        <button type="button" onClick={() => scrollTabs(-1)} aria-label="Show earlier tabs" className="absolute bottom-px left-0 top-0 flex w-12 items-center justify-start bg-gradient-to-r from-canvas from-40% to-transparent text-ink">
          <ChevronLeft size={20} />
        </button>
      )}
      {edge.right && (
        <button type="button" onClick={() => scrollTabs(1)} aria-label="Show more tabs" className="absolute bottom-px right-0 top-0 flex w-12 items-center justify-end bg-gradient-to-l from-canvas from-40% to-transparent text-ink">
          <ChevronRight size={20} />
        </button>
      )}
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
              href="/map"
              className="btn-primary-mobile bg-taupe hover:bg-taupe-hover text-white max-w-[180px] mx-auto"
            >
              Browse Shops →
            </Link>
          )}
        </div>
      )}

      {!loading && filteredOrders.length > 0 && (
        // One order per row (like a shop app's order list), so the garment name and the money are never cut off.
        <div className="flex flex-col gap-3">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              shopRating={order.store?.slug ? ratings[order.store.slug] ?? 0 : 0}
              onRated={(slug, r) => setRatings((prev) => ({ ...prev, [slug]: r }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
