'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { usePrintAuthGuard } from '@/hooks/usePrintAuthGuard';
import type { AnalyticsData } from '@/components/reports/reportHelpers';
import { periodLabel, reportDateRange, reportSummary, reportTables } from '@/components/reports/reportExport';
import { toNumber } from '@/lib/brandedExport';
import PrintDocument, { PrintSummary } from '@/components/print/PrintDocument';
import SubscriptionGate from '@/components/SubscriptionGate';

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Printable Sales & Analytics report (and its "Save as PDF"). A page of its own, like the
// statement: the dashboard's scrolling layout can't be printed in full.
function Report() {
  usePrintAuthGuard();
  const params = useSearchParams();
  const { store } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [failed, setFailed] = useState(false);
  const period = params.get('period') ?? 'all_time';
  const branchId = params.get('branch_id');
  const branchName = params.get('branch');

  useEffect(() => {
    if (!store?.id) return;
    const { startDate, endDate } = reportDateRange(period);
    api.get(`/stores/${store.id}/analytics`, {
      params: { ...(startDate && endDate ? { start_date: startDate, end_date: endDate } : {}), ...(branchId ? { branch_id: branchId } : {}) },
    })
      .then((res) => setData(res.data.data))
      .catch(() => setFailed(true));
  }, [store?.id, period, branchId]);

  useEffect(() => { if (data) setTimeout(() => window.print(), 900); }, [data]);

  if (failed) return <p className="p-8 text-sm">This report could not be loaded. Close this tab and try again from Reports.</p>;
  if (!data) return <p className="p-8 text-sm">Preparing report…</p>;

  const headline = reportSummary(data).slice(0, 4).map(([k, v]) => [k, typeof v === 'number' ? peso(v) : String(v)] as [string, string]);
  const tables = reportTables(data).filter((t) => t.heading !== 'Summary');
  const rest = reportSummary(data).slice(4);

  return (
    <PrintDocument
      org={store?.name ?? 'SUTURA'}
      logoPath={store?.logo_path}
      title="Sales & analytics report"
      subtitle={`${periodLabel(period)}${branchName ? ` · ${branchName}` : ''} · printed ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}`}
    >
      <PrintSummary items={headline} />

      <table className="pd-table mb-6">
        <thead><tr><th>Metric</th><th className="num">Value</th></tr></thead>
        <tbody>
          {rest.map(([k, v, money]) => (
            <tr key={k}><td>{k}</td><td className="num">{money && typeof v === 'number' ? peso(v) : String(v ?? '—')}</td></tr>
          ))}
        </tbody>
      </table>

      {tables.map((t) => {
        const money = new Set(t.money ?? []);
        const cell = (v: unknown, i: number) => {
          const n = money.has(i) ? toNumber(v as string | number | null) : null;
          return n !== null ? peso(n) : String(v ?? '');
        };
        return (
          <section key={t.heading} className="mb-6 break-inside-avoid">
            <h2 className="mb-2 text-sm font-bold text-[#6B4E3E]">{t.heading}</h2>
            <table className="pd-table">
              <thead>
                <tr>{t.columns.map((c, i) => <th key={c} className={i > 0 ? 'num' : ''}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {t.rows.map((r, ri) => (
                  <tr key={ri}>{r.map((v, i) => <td key={i} className={i > 0 ? 'num' : ''}>{cell(v, i)}</td>)}</tr>
                ))}
              </tbody>
              {t.total && (
                <tfoot><tr>{t.total.map((v, i) => <td key={i} className={i > 0 ? 'num' : ''}>{cell(v, i)}</td>)}</tr></tfoot>
              )}
            </table>
          </section>
        );
      })}
    </PrintDocument>
  );
}

export default function PrintReportsPage() {
  return (
    <SubscriptionGate feature="reports">
      <Suspense fallback={<p className="p-8 text-sm">Preparing report…</p>}><Report /></Suspense>
    </SubscriptionGate>
  );
}
