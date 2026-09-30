import React from 'react';
import type { ConnectedOrder } from '../detailTypes';
import { KIND_LABEL, PAYMENT_CLASS, amountNote, dateLabel, kindOf, orderCode, paymentOf, peso, sizeLabel, statusLabel } from './orderHelpers';

// The phone layout: one order per row instead of a wide table. On phones the
// white rows run edge to edge (they cancel the page's side margin) and pad
// their own text by that same amount — one margin, and the text lines up with
// the headings above. From md they sit inside the page like a normal card.
export default function OrderCards({ orders }: Readonly<{ orders: ConnectedOrder[] }>) {
  return (
    <ul className="-mx-4 min-[375px]:-mx-6 md:mx-0 divide-y divide-line border-y border-line bg-white md:border">
      {orders.map(o => {
        const pay = paymentOf(o);
        const note = amountNote(o);
        return (
          <li key={`${o.type}-${o.id}`} className="py-3.5 px-4 min-[375px]:px-6 md:px-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-sm font-semibold text-ink">{orderCode(o)}</span>
              <span className="text-xs text-ink-muted shrink-0">{dateLabel(o.created_at)}</span>
            </div>
            <p className="text-base text-ink mt-0.5 truncate">{o.customer?.name || 'Walk-in client'}</p>
            <p className="text-xs text-ink-muted mt-0.5">
              {KIND_LABEL[kindOf(o)]} · {sizeLabel(o)} · {statusLabel(o)}
            </p>
            <div className="flex items-end justify-between gap-3 mt-2">
              <div>
                <span className="font-mono text-base font-semibold text-ink">{peso(o.total_amount)}</span>
                {note && <span className="block text-[11px] text-ink-muted">{note}</span>}
              </div>
              <span className={`px-2 py-0.5 border text-[11px] font-bold uppercase ${PAYMENT_CLASS[pay.tone]}`}>{pay.label}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
