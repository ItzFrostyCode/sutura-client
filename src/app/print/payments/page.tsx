'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { usePrintAuthGuard } from '@/hooks/usePrintAuthGuard';
import type { StatementEntry } from '@/components/payments/statements/useStatements';
import { prettyDate } from '@/components/payments/statements/periods';

const peso = (n: number | null) => (n == null ? '' : n.toLocaleString('en-PH', { minimumFractionDigits: 2 }));
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '');

// Printable payment statement — black and white, hairline rules, no boxes (house print style). Use the browser's
// "Save as PDF" in the print dialog to get a PDF.
function Statement() {
  usePrintAuthGuard();
  const params = useSearchParams();
  const { store } = useAuthStore();
  const [rows, setRows] = useState<StatementEntry[] | null>(null);
  const [totals, setTotals] = useState({ records: 0, amount: 0 });
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';

  useEffect(() => {
    if (!store?.id) return;
    const kinds = (params.get('kinds') ?? '').split(',').filter(Boolean);
    api.get(`/stores/${store.id}/receipts`, { params: { from, to, kinds, ...(params.get('branch_id') ? { branch_id: params.get('branch_id') } : {}) } })
      .then((res) => { setRows(res.data.data.entries); setTotals(res.data.data.totals); })
      .catch(() => setRows([]));
  }, [store?.id, params, from, to]);

  useEffect(() => { if (rows) setTimeout(() => window.print(), 400); }, [rows]);

  if (!rows) return <p className="p-8 text-sm">Preparing statement…</p>;

  return (
    <main className="max-w-[1000px] mx-auto p-8 text-black bg-white text-[12px] leading-snug">
      <header className="border-b border-black pb-3 mb-4">
        <h1 className="text-xl font-bold">Payment statement</h1>
        <p>{store?.name}</p>
        <p>{from && to ? `${prettyDate(from)} to ${prettyDate(to)}` : 'All records'} · printed {new Date().toLocaleString('en-PH')}</p>
        <p className="mt-1">{totals.records} records · total (excluding rejected) PHP {peso(totals.amount)}</p>
      </header>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-black text-left">
            {['Date', 'Type', 'No.', 'Customer', 'Method', 'Reference', 'Status', 'Amount (PHP)'].map((h, i) => <th key={h} className={`py-1 pr-2 font-bold ${i === 7 ? 'text-right' : ''}`}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.key} className="border-b border-neutral-300 align-top">
              <td className="py-1 pr-2 whitespace-nowrap">{day(e.date)}</td><td className="pr-2">{e.kind_label}</td><td className="pr-2">{e.doc_no}</td>
              <td className="pr-2">{e.customer}</td><td className="pr-2">{e.method}</td><td className="pr-2 break-all">{e.reference}</td>
              <td className="pr-2 capitalize">{e.status}</td><td className="text-right">{peso(e.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-6 print:hidden"><button type="button" onClick={() => window.print()} className="border border-black px-4 h-11">Print / Save as PDF</button></p>
    </main>
  );
}

export default function PrintPaymentsPage() {
  return <Suspense fallback={<p className="p-8 text-sm">Preparing statement…</p>}><Statement /></Suspense>;
}
