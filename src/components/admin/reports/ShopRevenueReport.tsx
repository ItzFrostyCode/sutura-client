'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { StatCard } from '@/components/admin/ui/AdminPrimitives';
import { formatPeso } from '@/components/store-application/applicationTypes';
import { CHART, compactPeso, ReportCard, SectionHeading, tooltipStyle } from './reportUi';

interface StoreRow {
  id: number;
  name: string;
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

export default function ShopRevenueReport({ report, period }: { readonly report: RevenueReport; readonly period: number }) {
  const { totals } = report;
  const completionRate = totals.orders > 0 ? Math.round((totals.completed / totals.orders) * 1000) / 10 : null;
  const shortMonths = report.months.map((m) => ({ ...m, month: m.label.replace(/ \d{4}$/, '') }));

  return (
    <section className="space-y-5">
      <SectionHeading title="Shop revenue" description={`Sales the shops collected over the last ${period} months, what customers still owe, and each shop's output.`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sales collected" value={formatPeso(totals.revenue)} hint={`${formatPeso(totals.order_revenue)} orders · ${formatPeso(totals.catalog_revenue)} catalog`} />
        <StatCard label="Outstanding balances" value={formatPeso(totals.outstanding)} hint={`${totals.outstanding_orders} ${totals.outstanding_orders === 1 ? 'order' : 'orders'} still owing (all time)`} />
        <StatCard label="Orders received" value={totals.orders} hint={`${totals.completed} completed`} />
        <StatCard label="Completion rate" value={completionRate === null ? '—' : `${completionRate}%`} hint="Completed ÷ orders received" />
      </div>

      <ReportCard title="Monthly sales revenue" aside="Collected order payments + paid catalog sales">
        <div className="h-72 px-2 py-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shortMonths} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="month" stroke={CHART.axis} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={CHART.axis} fontSize={11} tickLine={false} axisLine={false} tickFormatter={compactPeso} />
              <Tooltip {...tooltipStyle} labelFormatter={(_, p) => p?.[0]?.payload?.label ?? ''} formatter={(v, name) => [formatPeso(Number(v)), name]} />
              <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="order_revenue" name="Orders" stackId="rev" fill={CHART.primary} />
              <Bar dataKey="catalog_revenue" name="Catalog sales" stackId="rev" fill={CHART.secondary} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ReportCard>

      <ReportCard title="Revenue and productivity by shop" aside={`${report.stores.length} live ${report.stores.length === 1 ? 'shop' : 'shops'}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="border-b border-line text-left text-eyebrow">
              <tr>
                <th className="px-5 py-3 font-normal">Shop</th>
                <th className="px-5 py-3 font-normal">Plan</th>
                <th className="px-5 py-3 text-right font-normal">Sales collected</th>
                <th className="px-5 py-3 text-right font-normal">Outstanding</th>
                <th className="px-5 py-3 text-right font-normal">Orders</th>
                <th className="px-5 py-3 text-right font-normal">Completed</th>
                <th className="px-5 py-3 text-right font-normal">Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {report.stores.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-6 text-ink-muted">No live shops yet.</td></tr>
              )}
              {report.stores.map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-ink">{s.name}</p>
                    <p className="text-xs text-ink-muted">{[s.owner, s.city].filter(Boolean).join(' · ')}</p>
                  </td>
                  <td className="px-5 py-3 text-ink-body">{s.plan ?? '—'}</td>
                  <td className="px-5 py-3 text-right text-ink-body">
                    {formatPeso(s.revenue)}
                    {s.catalog_revenue > 0 && <p className="text-xs text-ink-muted">{formatPeso(s.catalog_revenue)} catalog</p>}
                  </td>
                  <td className="px-5 py-3 text-right text-ink-body">
                    {formatPeso(s.outstanding)}
                    {s.outstanding_orders > 0 && <p className="text-xs text-ink-muted">{s.outstanding_orders} {s.outstanding_orders === 1 ? 'order' : 'orders'}</p>}
                  </td>
                  <td className="px-5 py-3 text-right text-ink-body">{s.orders}</td>
                  <td className="px-5 py-3 text-right text-ink-body">{s.completed}</td>
                  <td className="px-5 py-3 text-right text-ink-body">{s.completion_rate === null ? '—' : `${s.completion_rate}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportCard>
    </section>
  );
}
