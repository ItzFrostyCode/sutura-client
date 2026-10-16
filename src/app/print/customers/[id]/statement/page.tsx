'use client';

import { use, useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { usePrintAuthGuard } from '@/hooks/usePrintAuthGuard';
import type { CustomerData, JobOrder } from '@/components/customers/customerTypes';
import { amountOf, moneySummary, peso, receivedOn, stateOf } from '@/components/customers/customerMoney';

const day = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '');
const TH = 'py-1 pr-2 font-bold';

// A customer's statement: every order with what was billed, paid and still owed, then each payment. Black and white,
// hairline rules, no boxes (house print style). Use the browser's "Save as PDF" in the print dialog for a PDF.
export default function CustomerStatementPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  usePrintAuthGuard();
  const { store } = useAuthStore();
  const [data, setData] = useState<{ customer: CustomerData; jobs: JobOrder[] } | null | 'error'>(null);

  useEffect(() => {
    if (!store?.id) return;
    api.get(`/stores/${store.id}/customers/${id}`)
      .then((res) => setData({ customer: res.data.data.customer, jobs: res.data.data.jobs ?? [] }))
      .catch(() => setData('error'));
  }, [store?.id, id]);

  useEffect(() => { if (data && data !== 'error') setTimeout(() => window.print(), 400); }, [data]);

  if (data === 'error') return <p className="p-8 text-sm">This customer could not be found.</p>;
  if (!data) return <p className="p-8 text-sm">Preparing statement…</p>;

  const { customer, jobs } = data;
  const { billed, paid, balance } = moneySummary(jobs);
  const payments = jobs.flatMap((j) => (j.payments ?? []).map((p) => ({ p, order: j }))).sort((a, b) => a.p.created_at.localeCompare(b.p.created_at));

  return (
    <main className="mx-auto max-w-[900px] bg-white p-8 text-[12px] leading-snug text-black">
      <header className="mb-4 border-b border-black pb-3">
        <h1 className="text-xl font-bold">Customer statement</h1>
        <p>{store?.name}</p>
        <p className="mt-2 font-bold">{customer.name}{customer.shop_number ? ` · Customer No. ${customer.shop_number}` : ''}</p>
        <p>{customer.phone}{customer.email && !customer.email.startsWith('walkin_') ? ` · ${customer.email}` : ''}</p>
        <p>Printed {new Date().toLocaleString('en-PH')}</p>
      </header>

      <p className="mb-4">Billed PHP {peso(billed).slice(1)} · Paid PHP {peso(paid).slice(1)} · <strong>Balance due PHP {peso(balance).slice(1)}</strong></p>

      <h2 className="mb-1 font-bold">Orders</h2>
      <table className="mb-6 w-full border-collapse">
        <thead><tr className="border-b border-black text-left">
          {['Order', 'Date', 'Service', 'Status', 'Total', 'Discount', 'Paid', 'Balance'].map((h, i) => <th key={h} className={`${TH} ${i > 3 ? 'text-right' : ''}`}>{h}</th>)}
        </tr></thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id} className="border-b border-gray-300">
              <td className="py-1 pr-2">{j.order_number}</td>
              <td className="py-1 pr-2">{day(j.created_at)}</td>
              <td className="py-1 pr-2">{j.service?.name ?? ''}</td>
              <td className="py-1 pr-2 capitalize">{j.status.replaceAll('_', ' ')}</td>
              <td className="py-1 pr-2 text-right">{peso(amountOf(j.total_amount)).slice(1)}</td>
              <td className="py-1 pr-2 text-right">{amountOf(j.discount_amount) ? peso(amountOf(j.discount_amount)).slice(1) : ''}</td>
              <td className="py-1 pr-2 text-right">{peso(receivedOn(j)).slice(1)}</td>
              <td className="py-1 text-right">{peso(amountOf(j.balance)).slice(1)}</td>
            </tr>
          ))}
          {jobs.length === 0 && <tr><td colSpan={8} className="py-2">No orders.</td></tr>}
        </tbody>
      </table>

      <h2 className="mb-1 font-bold">Payments</h2>
      <table className="w-full border-collapse">
        <thead><tr className="border-b border-black text-left">
          {['Date', 'Order', 'Method', 'Status', 'Amount'].map((h, i) => <th key={h} className={`${TH} ${i === 4 ? 'text-right' : ''}`}>{h}</th>)}
        </tr></thead>
        <tbody>
          {payments.map(({ p, order }) => (
            <tr key={p.id} className="border-b border-gray-300">
              <td className="py-1 pr-2">{day(p.created_at)}</td>
              <td className="py-1 pr-2">{order.order_number}</td>
              <td className="py-1 pr-2 capitalize">{(p.payment_method ?? 'cash').replace('_', ' ')}</td>
              <td className="py-1 pr-2 capitalize">{stateOf(p)}</td>
              <td className="py-1 text-right">{peso(amountOf(p.amount)).slice(1)}</td>
            </tr>
          ))}
          {payments.length === 0 && <tr><td colSpan={5} className="py-2">No payments recorded.</td></tr>}
        </tbody>
      </table>
    </main>
  );
}
