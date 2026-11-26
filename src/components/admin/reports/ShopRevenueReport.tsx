'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ExternalLink, MoreHorizontal, Store } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatPeso } from '@/components/store-application/applicationTypes';
import SearchInput from '@/components/shared/SearchInput';
import PlanPill from '@/components/admin/ui/PlanPill';
import { PAGER_BTN } from '@/components/admin/ui/AdminPrimitives';
import { scrollToListTop } from '@/lib/scrollToListTop';
import { AXIS, BAR, BAR_STACK_BASE, CHART, LEGEND, compactPeso, rangeText, ReportCard, ReportStat, SectionHeading, TH, tooltipStyle, type ReportRange } from './reportUi';

interface StoreRow {
  id: number;
  name: string;
  slug?: string;
  city: string | null;
  owner: string | null;
  plan: string | null;
  order_revenue: number;
  catalog_revenue: number;
  revenue: number;
  outstanding: number;
  outstanding_orders: number;
  orders: number;
  completed: number;
  completion_rate: number | null;
}

export interface RevenueReport {
  totals: { revenue: number; order_revenue: number; catalog_revenue: number; outstanding: number; outstanding_orders: number; orders: number; completed: number };
  months: { label: string; order_revenue: number; catalog_revenue: number; revenue: number; orders: number }[];
  stores: StoreRow[];
}

const PER_PAGE = 5;
/** Every row (shop, "no match" or blank slot) is the same height. */
const ROW_H = 'h-[66px]';

/** The row's "⋯" menu: open the public shop page, or find the shop on the admin Shops list. */
function RowMenu({ store }: { readonly store: StoreRow }) {
  // Fixed to the viewport, since the table scrolls sideways and would clip a menu inside it.
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const open = pos !== null;
  const setOpen = (next: boolean | ((v: boolean) => boolean)) => {
    const want = typeof next === 'function' ? next(open) : next;
    if (!want) return setPos(null);
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
  };
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setPos(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setPos(null); };
    const gone = () => setPos(null);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', gone, true);
    window.addEventListener('resize', gone);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
      window.removeEventListener('scroll', gone, true);
      window.removeEventListener('resize', gone);
    };
  }, [open]);

  const item = 'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[#1E1A17] hover:bg-[#FAF8F5]';
  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More for ${store.name}`}
        className="flex h-9 w-9 items-center justify-center admin-field text-[#6E655F] hover:bg-[#FAF8F5] hover:text-[#1E1A17]"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div role="menu" style={{ top: pos.top, right: pos.right }} className="fixed z-50 w-48 admin-card overflow-hidden py-1 text-left shadow-lg">
          {store.slug && (
            <a role="menuitem" href={`/store/${store.slug}`} target="_blank" rel="noopener noreferrer" className={item} onClick={() => setOpen(false)}>
              <ExternalLink size={14} className="text-[#6E655F]" /> Open shop page
            </a>
          )}
          <Link role="menuitem" href={`/admin/stores?search=${encodeURIComponent(store.name)}`} className={item} onClick={() => setOpen(false)}>
            <Store size={14} className="text-[#6E655F]" /> See in Shops
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ShopRevenueReport({ report, range }: { readonly report: RevenueReport; readonly range: ReportRange }) {
  const { totals } = report;
  const completionRate = totals.orders > 0 ? Math.round((totals.completed / totals.orders) * 1000) / 10 : null;
  const shortMonths = report.months.map((m) => ({ ...m, month: m.label.replace(/ \d{4}$/, '') }));

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return report.stores;
    return report.stores.filter((s) => [s.name, s.owner, s.city, s.plan].some((v) => v?.toLowerCase().includes(q)));
  }, [report.stores, search]);
  const lastPage = Math.max(1, Math.ceil(matches.length / PER_PAGE));
  const current = Math.min(page, lastPage);
  const rows = matches.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  // A new report (another period) starts the table over.
  useEffect(() => { setPage(1); }, [report]);

  const pagerBtn = PAGER_BTN;
  const tableRef = useRef<HTMLDivElement>(null);
  const goToPage = (n: number) => { setPage(n); scrollToListTop(tableRef.current); };

  return (
    <section className="space-y-5">
      <SectionHeading title="Shop revenue" description={`Sales the shops collected over ${rangeText(range)}, what customers still owe, and each shop's output.`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportStat label="Sales collected" value={formatPeso(totals.revenue)} hint={`${formatPeso(totals.order_revenue)} orders · ${formatPeso(totals.catalog_revenue)} catalog`} />
        <ReportStat label="Outstanding balances" value={formatPeso(totals.outstanding)} hint={`${totals.outstanding_orders} ${totals.outstanding_orders === 1 ? 'order' : 'orders'} still owing (all time)`} />
        <ReportStat label="Orders received" value={totals.orders} hint={`${totals.completed} completed`} />
        <ReportStat label="Completion rate" value={completionRate === null ? '—' : `${completionRate}%`} hint="Completed ÷ orders received" />
      </div>

      <ReportCard title="Monthly sales revenue" aside="Collected order payments + paid catalog sales">
        <div className="h-80 px-2 py-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shortMonths} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="month" {...AXIS} />
              <YAxis {...AXIS} tickFormatter={compactPeso} />
              <Tooltip {...tooltipStyle} labelFormatter={(_, p) => p?.[0]?.payload?.label ?? ''} formatter={(v, name) => [formatPeso(Number(v)), name]} />
              <Legend {...LEGEND} />
              <Bar dataKey="order_revenue" name="Orders" stackId="rev" fill={CHART.primary} {...BAR_STACK_BASE} />
              <Bar dataKey="catalog_revenue" name="Catalog sales" stackId="rev" fill={CHART.secondary} {...BAR} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ReportCard>

      <ReportCard
        title="Revenue and productivity by shop"
        aside={(
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              bold
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Search shop name..."
              className="w-full sm:w-60"
              onCanvasBackground
            />
            <span className="whitespace-nowrap">{report.stores.length} live {report.stores.length === 1 ? 'shop' : 'shops'}</span>
          </div>
        )}
      >
        <div ref={tableRef} className="scroll-mt-24 overflow-x-auto">
          {/* Fixed column widths and always 5 row slots, so searching never resizes the card. */}
          <table className="w-full min-w-208 table-fixed text-sm">
            <colgroup>
              <col className="w-[26%]" />
              <col className="w-[12%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
              <col className="w-[9%]" />
              <col className="w-[11%]" />
              <col className="w-[10%]" />
              <col className="w-[6%]" />
            </colgroup>
            <thead className="border-b border-[#EDE7DF] bg-[#FAF8F5] text-left">
              <tr>
                <th className={TH}>Shop</th>
                <th className={TH}>Plan</th>
                <th className={`${TH} text-right`}>Sales collected</th>
                <th className={`${TH} text-right`}>Outstanding</th>
                <th className={`${TH} text-right`}>Orders</th>
                <th className={`${TH} text-right`}>Completed</th>
                <th className={`${TH} text-right`}>Completion</th>
                <th className={TH}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE7DF]">
              {rows.length === 0 && (
                <tr className={ROW_H}>
                  <td colSpan={8} className="px-5 text-center text-[#6E655F]">
                    {report.stores.length === 0 ? 'No live shops yet.' : `No shop matches "${search.trim()}".`}
                  </td>
                </tr>
              )}
              {rows.map((s) => (
                <tr key={s.id} className={`${ROW_H} transition-colors hover:bg-[#FAF8F5]`}>
                  <td className="px-5 py-3.5">
                    <p className="truncate font-semibold text-[#1E1A17]" title={s.name}>{s.name}</p>
                    <p className="truncate text-xs text-[#6E655F]">{[s.owner, s.city].filter(Boolean).join(' · ')}</p>
                  </td>
                  <td className="px-5 py-3.5"><PlanPill plan={s.plan} /></td>
                  <td className="px-5 py-3.5 text-right tabular-nums">
                    <span className="font-semibold text-[#1E1A17]">{formatPeso(s.revenue)}</span>
                    {s.catalog_revenue > 0 && <p className="text-xs text-[#6E655F]">{formatPeso(s.catalog_revenue)} catalog</p>}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums">
                    <span className="font-semibold text-[#1E1A17]">{formatPeso(s.outstanding)}</span>
                    {s.outstanding_orders > 0 && <p className="text-xs text-[#6E655F]">{s.outstanding_orders} {s.outstanding_orders === 1 ? 'order' : 'orders'}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-[#4A423C]">{s.orders}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-[#4A423C]">{s.completed}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-[#4A423C]">{s.completion_rate === null ? '—' : `${s.completion_rate}%`}</td>
                  <td className="px-5 py-3.5 text-right"><RowMenu store={s} /></td>
                </tr>
              ))}
              {/* Blank slots up to 5 rows (when there are shops at all), keeping the card's height. */}
              {report.stores.length > 0 && Array.from({ length: PER_PAGE - Math.max(rows.length, 1) }, (_, i) => (
                <tr key={`empty-${i}`} className={`${ROW_H} border-transparent`} aria-hidden="true"><td colSpan={8} /></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[#EDE7DF] px-5 py-3">
          <p className="text-sm text-[#4A423C]">
            Page {current} of {lastPage} <span className="text-[#A8A19A]">· {matches.length} total</span>
          </p>
          <div className="flex gap-2">
            <button type="button" aria-label="Previous page" disabled={current <= 1} onClick={() => goToPage(current - 1)} className={pagerBtn}>
              <ChevronLeft size={17} />
            </button>
            <button type="button" aria-label="Next page" disabled={current >= lastPage} onClick={() => goToPage(current + 1)} className={pagerBtn}>
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </ReportCard>
    </section>
  );
}
