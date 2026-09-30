import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { ConnectedOrder } from '../detailTypes';
import { type PaySort, KIND_LABEL, PAYMENT_CLASS, amountNote, dateLabel, kindOf, orderCode, paymentOf, peso, sizeLabel, statusLabel } from './orderHelpers';

// Square-cornered table for tablet and desktop. Five columns, with the small
// facts (date, type · size) stacked under the main one, so it fits a 600px
// screen without sideways scrolling.
interface OrdersTableProps {
  readonly orders: ConnectedOrder[];
  readonly paySort: PaySort;
  readonly onTogglePaySort: () => void;
}

export default function OrdersTable({ orders, paySort, onTogglePaySort }: Readonly<OrdersTableProps>) {
  const SortIcon = paySort === 'asc' ? ChevronUp : paySort === 'desc' ? ChevronDown : ChevronsUpDown;
  return (
    <div className="border border-line bg-white">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-sunken border-b border-line text-[11px] uppercase tracking-wider text-ink-muted">
            <th className="py-3 px-4 font-bold">Order</th>
            <th className="py-3 px-4 font-bold">Customer</th>
            <th className="py-3 px-4 font-bold text-right">Amount</th>
            <th className="py-3 px-4 font-bold" aria-sort={paySort === 'asc' ? 'ascending' : paySort === 'desc' ? 'descending' : 'none'}>
              <button
                type="button"
                onClick={onTogglePaySort}
                title={paySort === 'asc' ? 'Paid first — click for Unpaid first' : paySort === 'desc' ? 'Unpaid first — click to clear' : 'Sort by payment status'}
                className={`inline-flex items-center gap-1 uppercase tracking-wider font-bold cursor-pointer hover:text-ink ${paySort ? 'text-ink' : ''}`}
              >
                Payment <SortIcon size={14} />
              </button>
            </th>
            <th className="py-3 px-4 font-bold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {orders.map(o => {
            const pay = paymentOf(o);
            const note = amountNote(o);
            return (
              <tr key={`${o.type}-${o.id}`} className="hover:bg-canvas/60 transition-colors align-top">
                <td className="py-3 px-4">
                  <span className="block font-mono font-semibold text-ink whitespace-nowrap">{orderCode(o)}</span>
                  <span className="block text-xs text-ink-muted mt-0.5 whitespace-nowrap">{dateLabel(o.created_at)}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="block text-ink">{o.customer?.name || 'Walk-in client'}</span>
                  <span className="block text-xs text-ink-muted mt-0.5">{KIND_LABEL[kindOf(o)]} · {sizeLabel(o)}</span>
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <span className="block font-mono font-semibold text-ink">{peso(o.total_amount)}</span>
                  {note && <span className="block text-xs text-ink-muted mt-0.5">{note}</span>}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-block px-2 py-0.5 border text-[11px] font-bold uppercase ${PAYMENT_CLASS[pay.tone]}`}>{pay.label}</span>
                </td>
                <td className="py-3 px-4 text-ink-body">{statusLabel(o)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
