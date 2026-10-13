'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import PlanStoresModal from './PlanStoresModal';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { StatCard } from '@/components/admin/ui/AdminPrimitives';
import { formatPeso } from '@/components/store-application/applicationTypes';
import { CHART, compactPeso, ReportCard, SectionHeading, tooltipStyle } from './reportUi';

export interface SubscriptionReport {
  by_plan: { id: number; plan: string; stores: number; estimated_mrr: number }[];
  estimated_mrr: number;
  months: { label: string; new_subscriptions: number; approved: number; rejected: number; plan_payments: number; plan_income: number }[];
  approval_rate: number | null;
  subscription_status: { paid: number; trial: number; lapsed: number; none: number };
  plan_income: number;
  plan_payments: number;
  pending_plan_payments: number;
  pending_plan_income: number;
}

export default function SubscriptionActivityReport({ report, period }: { readonly report: SubscriptionReport; readonly period: number }) {
  const status = report.subscription_status;
  const live = status.paid + status.trial;
  const shortMonths = report.months.map((m) => ({ ...m, month: m.label.replace(/ \d{4}$/, '') }));
  const [openPlan, setOpenPlan] = useState<{ id: number; plan: string } | null>(null);

  return (
    <section className="space-y-5">
      <SectionHeading title="Subscription activity" description={`Plans, new subscriptions and plan payments over the last ${period} months.`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Live subscriptions" value={live} hint={`${status.paid} paid · ${status.trial} on trial${status.lapsed ? ` · ${status.lapsed} lapsed` : ''}`} />
        <StatCard label="Monthly list value" value={formatPeso(report.estimated_mrr)} hint="Plan price × live stores (estimate)" />
        <StatCard label="Plan income" value={formatPeso(report.plan_income)} hint={`${report.plan_payments} approved ${report.plan_payments === 1 ? 'payment' : 'payments'} in this period`} />
        <Link href="/admin/upgrades" className="block hover:bg-canvas">
          <StatCard label="Plan payments to review" value={report.pending_plan_payments} hint={report.pending_plan_payments ? `${formatPeso(report.pending_plan_income)} waiting for approval` : 'All caught up'} />
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ReportCard title="New subscriptions and decisions" aside={<>Approval rate {report.approval_rate ?? '—'}{report.approval_rate !== null && '%'}</>}>
          <div className="h-64 px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shortMonths} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="month" stroke={CHART.axis} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={CHART.axis} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} labelFormatter={(_, p) => p?.[0]?.payload?.label ?? ''} />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="new_subscriptions" name="New subscriptions" fill={CHART.primary} />
                <Bar dataKey="approved" name="Shops approved" fill={CHART.secondary} />
                <Bar dataKey="rejected" name="Shops rejected" fill="#C9A9A0" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ReportCard>

        <ReportCard title="Plan income by month" aside="Approved plan payments">
          <div className="h-64 px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shortMonths} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="month" stroke={CHART.axis} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={CHART.axis} fontSize={11} tickLine={false} axisLine={false} tickFormatter={compactPeso} />
                <Tooltip {...tooltipStyle} labelFormatter={(_, p) => p?.[0]?.payload?.label ?? ''} formatter={(v) => [formatPeso(Number(v)), 'Plan income']} />
                <Bar dataKey="plan_income" name="Plan income" fill={CHART.primary} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ReportCard>
      </div>

      <ReportCard title="Live stores by plan" aside={<>≈ {formatPeso(report.estimated_mrr)}/mo list price</>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-line text-left text-eyebrow">
              <tr>
                <th className="px-5 py-3 font-normal">Plan</th>
                <th className="px-5 py-3 font-normal">Stores</th>
                <th className="px-5 py-3 text-right font-normal">Monthly list value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {report.by_plan.length === 0 && (
                <tr><td colSpan={3} className="px-5 py-6 text-ink-muted">No live subscriptions yet.</td></tr>
              )}
              {report.by_plan.map((row) => (
                <tr key={row.plan} className="cursor-pointer hover:bg-canvas" onClick={() => setOpenPlan(row)}>
                  <td className="px-5 py-3">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setOpenPlan(row); }}
                      className="inline-flex min-h-11 items-center gap-1 font-semibold text-ink underline-offset-2 hover:underline">
                      {row.plan} <ChevronRight size={15} className="text-ink-faint" aria-hidden="true" />
                    </button>
                  </td>
                  <td className="px-5 py-3 text-ink-body">{row.stores}</td>
                  <td className="px-5 py-3 text-right text-ink-body">{formatPeso(row.estimated_mrr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {report.by_plan.length > 0 && <p className="border-t border-line px-5 py-3 text-xs text-ink-muted">Click a plan to see its stores, by monthly or yearly billing.</p>}
      </ReportCard>

      <PlanStoresModal plan={openPlan} onClose={() => setOpenPlan(null)} />
    </section>
  );
}
