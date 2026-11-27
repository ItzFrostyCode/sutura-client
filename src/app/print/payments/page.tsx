'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { usePrintAuthGuard } from '@/hooks/usePrintAuthGuard';
import type { StatementEntry } from '@/components/payments/statements/useStatements';
import { prettyDate } from '@/components/payments/statements/periods';
import PrintDocument, { PrintSummary } from '@/components/print/PrintDocument';

const peso = (n: number | null) => (n == null ? '' : n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Manila' }) : '');

// Printable payment statement (and its "Save as PDF"), on the shared themed frame.
function Statement() {
  usePrintAuthGuard();
  const params = useSearchParams();
  const { store } = useAuthStore();
  const [rows, setRows] = useState<StatementEntry[] | null>(null);
  const [totals, setTotals] = useState({ records: 0, amount: 0, verified_amount: 0 });
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';

  useEffect(() => {
    if (!store?.id) return;
    const kinds = (params.get('kinds') ?? '').split(',').filter(Boolean);
    api.get(`/stores/${store.id}/receipts`, { params: { from, to, kinds, ...(params.get('branch_id') ? { branch_id: params.get('branch_id') } : {}) } })
      .then((res) => { setRows(res.data.data.entries); setTotals(res.data.data.totals); })
      .catch(() => setRows([]));
  }, [store?.id, params, from, to]);

  // Opens the print dialog once the logo has had a moment to load.
  useEffect(() => { if (rows) setTimeout(() => window.print(), 700); }, [rows]);

  if (!rows) return <p className="p-8 text-sm">Preparing statement…</p>;

  return (
    <PrintDocument
      org={store?.name ?? 'SUTURA'}
      logoPath={store?.logo_path}
      title="Payment statement"
      subtitle={`${from && to ? `${prettyDate(from)} to ${prettyDate(to)}` : 'All records'} · printed ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}`}
    >
      <PrintSummary items={[
        ['Records', String(totals.records)],
        ['Total (excl. rejected)', `₱${peso(totals.amount)}`],
        ['Verified', `₱${peso(totals.verified_amount ?? 0)}`],
      ]} />
      <table className="pd-table">
        <thead>
          <tr>
            {['Date', 'Type', 'No.', 'Customer', 'Method', 'Reference', 'Status'].map((h) => <th key={h}>{h}</th>)}
            <th className="num">Amount (₱)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.key}>
              <td className="whitespace-nowrap">{day(e.date)}</td>
              <td>{e.kind_label}</td>
              <td className="whitespace-nowrap">{e.doc_no}</td>
              <td>{e.customer}</td>
              <td>{e.method}</td>
              <td className="break-all">{e.reference}</td>
              <td className="capitalize">{e.status.replaceAll('_', ' ')}</td>
              <td className="num">{peso(e.amount)}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-[#827A73]">No payment records in this period.</td></tr>}
        </tbody>
        {rows.length > 0 && (
          <tfoot>
            <tr><td colSpan={7}>TOTAL (excluding rejected)</td><td className="num">₱{peso(totals.amount)}</td></tr>
          </tfoot>
        )}
      </table>
    </PrintDocument>
  );
}

export default function PrintPaymentsPage() {
  return <Suspense fallback={<p className="p-8 text-sm">Preparing statement…</p>}><Statement /></Suspense>;
}
