'use client';

import React, { useState } from 'react';
import { ShoppingBag, LayoutList, Rows3 } from 'lucide-react';
import { ConnectedOrder } from './detailTypes';
import OrdersTable from './orders/OrdersTable';
import OrderCards from './orders/OrderCards';
import OrdersPager from './orders/OrdersPager';
import { KIND_LABEL, PAYMENT_RANK, kindOf, paymentOf, type OrderKind, type PaymentTone, type PaySort } from './orders/orderHelpers';

type Filter = 'all' | OrderKind;
type View = 'table' | 'cards';
type PayFilter = 'all' | PaymentTone;

const PAGE_SIZE = 10;
const PAY_FILTERS: { value: PayFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'partial', label: 'Partial' },
  { value: 'unpaid', label: 'Unpaid' },
];

const PILL = 'h-9 px-4 border text-xs font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer transition-colors';

// Phones always get the card list (eight columns don't fit); tablet and
// desktop can pick the table or the same cards.
export default function CatalogOrdersTab({ allOrders }: Readonly<{ allOrders: ConnectedOrder[] }>) {
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<View>('table');
  const [payFilter, setPayFilter] = useState<PayFilter>('all');
  const [page, setPage] = useState(1);
  const [paySort, setPaySort] = useState<PaySort>(null);

  const counts = {
    all: allOrders.length,
    walkin: allOrders.filter(o => kindOf(o) === 'walkin').length,
    online: allOrders.filter(o => kindOf(o) === 'online').length,
  };
  const payCounts: Record<PayFilter, number> = {
    all: allOrders.length,
    paid: allOrders.filter(o => paymentOf(o).tone === 'paid').length,
    partial: allOrders.filter(o => paymentOf(o).tone === 'partial').length,
    unpaid: allOrders.filter(o => paymentOf(o).tone === 'unpaid').length,
  };
  const matching = allOrders.filter(o => (filter === 'all' || kindOf(o) === filter) && (payFilter === 'all' || paymentOf(o).tone === payFilter));
  // Sort before paging so the order holds across every page (stable: ties keep newest-first).
  const filtered = paySort
    ? [...matching].sort((a, b) => (PAYMENT_RANK[paymentOf(a).tone] - PAYMENT_RANK[paymentOf(b).tone]) * (paySort === 'asc' ? 1 : -1))
    : matching;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">Order History &amp; Sales</h2>
        <p className="text-sm text-ink-muted mt-0.5">
          {counts.all} {counts.all === 1 ? 'order' : 'orders'} booked against this design — {counts.walkin} walk-in, {counts.online} online.
        </p>
      </div>

      {allOrders.length === 0 ? (
        <div className="py-16 text-center text-ink-muted border border-line bg-white">
          <ShoppingBag size={38} className="mx-auto mb-2 text-ink-faint" />
          <p className="text-sm font-semibold">No orders recorded yet for this design.</p>
          <p className="text-xs text-ink-faint mt-1 px-4">
            When customers order this design from your store profile or via walk-in, orders will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar" role="group" aria-label="Filter orders">
              {(['all', 'walkin', 'online'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filter === f}
                  onClick={() => { setFilter(f); setPage(1); }}
                  className={`${PILL} rounded-full ${filter === f ? 'bg-ink text-white border-ink' : 'bg-white text-ink-body border-line hover:border-ink'}`}
                >
                  {f === 'all' ? 'All' : KIND_LABEL[f]} ({counts[f]})
                </button>
              ))}
            </div>

            <div className="hidden md:flex shrink-0" role="group" aria-label="Layout">
              {([['table', 'Table', LayoutList], ['cards', 'Cards', Rows3]] as const).map(([v, label, Icon]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={`${PILL} ${view === v ? 'bg-ink text-white border-ink' : 'bg-white text-ink-body border-line hover:border-ink'} ${v === 'cards' ? '-ml-px' : ''}`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar" role="group" aria-label="Filter by payment">
            {PAY_FILTERS.map(f => (
              <button
                key={f.value}
                type="button"
                aria-pressed={payFilter === f.value}
                onClick={() => { setPayFilter(f.value); setPage(1); }}
                className={`${PILL} rounded-full ${payFilter === f.value ? 'bg-ink text-white border-ink' : 'bg-white text-ink-body border-line hover:border-ink'}`}
              >
                {f.label} ({payCounts[f.value]})
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-muted border border-line bg-white">No orders match these filters.</p>
          ) : (
            <>
              <div className={view === 'table' ? 'hidden md:block' : 'hidden'}><OrdersTable
                  orders={shown}
                  paySort={paySort}
                  onTogglePaySort={() => { setPaySort(s => (s === null ? 'asc' : s === 'asc' ? 'desc' : null)); setPage(1); }}
                /></div>
              <div className={view === 'cards' ? 'md:block' : 'md:hidden'}><OrderCards orders={shown} /></div>
              {filtered.length > PAGE_SIZE && (
                <OrdersPager page={current} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
