'use client';

import { useEffect, useState } from 'react';
import adminApi from '@/lib/adminApi';
import { formatPeso } from '@/components/store-application/applicationTypes';

interface Report {
  by_plan: { plan: string; stores: number; estimated_mrr: number }[];
  estimated_mrr: number;
  months: { label: string; new_subscriptions: number; approved: number; rejected: number }[];
  approval_rate: number | null;
}

// sutura2's Subscription Report, condensed: active stores per plan and the
// last six months of new subscriptions and application decisions.
export default function SubscriptionReportPanel() {
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    adminApi.get('/admin/reports/subscriptions').then((res) => setReport(res.data.data)).catch(() => undefined);
  }, []);

  if (!report) return null;
  const peak = Math.max(1, ...report.months.map((m) => m.new_subscriptions));

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="border border-line bg-surface">
        <div className="flex items-baseline justify-between border-b border-line px-5 py-4">
          <h2 className="tablet-h3 text-ink">Active plans</h2>
          <p className="text-sm text-ink-muted">≈ {formatPeso(report.estimated_mrr)}/mo list price</p>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-line">
            {report.by_plan.length === 0 && (
              <tr><td className="px-5 py-6 text-ink-muted">No active subscriptions yet.</td></tr>
            )}
            {report.by_plan.map((row) => (
              <tr key={row.plan}>
                <td className="px-5 py-3 font-semibold text-ink">{row.plan}</td>
                <td className="px-5 py-3 text-ink-body">{row.stores} {row.stores === 1 ? 'store' : 'stores'}</td>
                <td className="px-5 py-3 text-right text-ink-body">{formatPeso(row.estimated_mrr)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border border-line bg-surface">
        <div className="flex items-baseline justify-between border-b border-line px-5 py-4">
          <h2 className="tablet-h3 text-ink">Last 6 months</h2>
          <p className="text-sm text-ink-muted">Approval rate {report.approval_rate ?? '—'}{report.approval_rate !== null && '%'}</p>
        </div>
        <ul className="divide-y divide-line">
          {report.months.map((m) => (
            <li key={m.label} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 px-5 py-2.5 text-sm">
              <span className="text-ink-muted">{m.label}</span>
              <span className="h-2 bg-sunken" aria-hidden="true">
                <span className="block h-2 bg-taupe" style={{ width: `${(m.new_subscriptions / peak) * 100}%` }} />
              </span>
              <span className="whitespace-nowrap text-ink-body">
                {m.new_subscriptions} new · {m.approved}✓ {m.rejected}✕
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
