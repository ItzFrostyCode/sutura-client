'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import PlanStoresModal from './PlanStoresModal';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatPeso } from '@/components/store-application/applicationTypes';
import PlanPill from '@/components/admin/ui/PlanPill';
import { AXIS, BAR, CHART, LEGEND, compactPeso, rangeText, ReportCard, ReportStat, SectionHeading, TH, tooltipStyle, type ReportRange } from './reportUi';

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

export default function SubscriptionActivityReport({ report, range }: { readonly report: SubscriptionReport; readonly range: ReportRange }) {
  const status = report.subscription_status;
  const live = status.paid + status.trial;
  const shortMonths = report.months.map((m) => ({ ...m, month: m.label.replace(/ \d{4}$/, '') }));
  const [openPlan, setOpenPlan] = useState<{ id: number; plan: string } | null>(null);
  // Each plan's bar is its share of the total monthly list value.
  const topMrr = Math.max(1, ...report.by_plan.map((p) => p.estimated_mrr));

  return (
    <section className="space-y-5">
      <SectionHeading title="Subscription activity" description={`Plans, new subscriptions and plan payments over ${rangeText(range)}.`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportStat label="Live subscriptions" value={live} hintPill hint={`${status.paid} paid · ${status.trial} on trial${status.lapsed ? ` · ${status.lapsed} lapsed` : ''}`} />
        <ReportStat label="Monthly list value" value={formatPeso(report.estimated_mrr)} hint="Plan price × live shops (estimate)" />
        <ReportStat label="Plan income" value={formatPeso(report.plan_income)} hint={`${report.plan_payments} approved ${report.plan_payments === 1 ? 'payment' : 'payments'} in this period`} />
        <Link href="/admin/payments" className="block rounded-xl transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe">
          <ReportStat label="Plan payments to review" value={report.pending_plan_payments} hint={report.pending_plan_payments ? `${formatPeso(report.pending_plan_income)} waiting for approval` : 'All caught up'} />
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ReportCard title="New subscriptions and decisions" aside={<>Approval rate <strong className="font-semibold text-[#1E1A17]">{report.approval_rate ?? '—'}{report.approval_rate !== null && '%'}</strong></>}>
          <div className="h-72 px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shortMonths} margin={{ top: 4, right: 12, left: -16, bottom: 0 }} barGap={3}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="month" {...AXIS} />
                <YAxis {...AXIS} allowDecimals={false} />
                <Tooltip {...tooltipStyle} labelFormatter={(_, p) => p?.[0]?.payload?.label ?? ''} />
                <Legend {...LEGEND} />
                <Bar dataKey="new_subscriptions" name="New subscriptions" fill={CHART.primary} {...BAR} />
                <Bar dataKey="approved" name="Shops approved" fill={CHART.secondary} {...BAR} />
                <Bar dataKey="rejected" name="Shops rejected" fill="#C9A9A0" {...BAR} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ReportCard>

        <ReportCard title="Plan income by month" aside="Approved plan payments">
          <div className="h-72 px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shortMonths} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="month" {...AXIS} />
                <YAxis {...AXIS} tickFormatter={compactPeso} />
                <Tooltip {...tooltipStyle} labelFormatter={(_, p) => p?.[0]?.payload?.label ?? ''} formatter={(v) => [formatPeso(Number(v)), 'Plan income']} />
                <Bar dataKey="plan_income" name="Plan income" fill={CHART.primary} {...BAR} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ReportCard>
      </div>

      <ReportCard title="Live shops by plan" aside={<>≈ <strong className="font-semibold text-[#1E1A17]">{formatPeso(report.estimated_mrr)}</strong>/mo list price</>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-136 text-sm">
            <thead className="border-b border-[#EDE7DF] text-left">
              <tr>
                <th className={TH}>Plan</th>
                <th className={TH}>Shops</th>
                <th className={`${TH} w-2/5`}><span className="sr-only">Share of list value</span></th>
                <th className={`${TH} text-right`}>Monthly list value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE7DF]">
              {report.by_plan.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-6 text-[#6E655F]">No live subscriptions yet.</td></tr>
              )}
              {report.by_plan.map((row) => (
                <tr key={row.plan} className="cursor-pointer transition-colors hover:bg-[#FAF8F5]" onClick={() => setOpenPlan(row)}>
                  <td className="px-5 py-3.5">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setOpenPlan(row); }}
                      aria-label={`See ${row.plan} shops`}
                      className="inline-flex min-h-11 items-center gap-1.5">
                      <PlanPill plan={row.plan} /> <ChevronRight size={15} className="text-[#A8A19A]" aria-hidden="true" />
                    </button>
                  </td>
                  <td className="px-5 py-3.5 font-semibold tabular-nums text-[#1E1A17]">{row.stores}</td>
                  <td className="px-5 py-3.5">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#EDE7DF]" role="presentation">
                      <div className="h-full rounded-full bg-[#8C735B]" style={{ width: `${Math.max(4, (row.estimated_mrr / topMrr) * 100)}%` }} />
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-[#1E1A17]">{formatPeso(row.estimated_mrr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {report.by_plan.length > 0 && <p className="border-t border-[#EDE7DF] bg-[#FAF8F5] px-5 py-3 text-xs text-[#6E655F]">Click a plan to see its shops, by monthly or yearly billing.</p>}
      </ReportCard>

      <PlanStoresModal plan={openPlan} onClose={() => setOpenPlan(null)} />
    </section>
  );
}
