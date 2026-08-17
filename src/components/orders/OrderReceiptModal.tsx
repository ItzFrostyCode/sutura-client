'use client';

import { X } from 'lucide-react';
import { CatalogOrder } from './orderHelpers';
import { useAuthStore } from '@/store/useAuthStore';

const peso = (v: string | number | null | undefined) =>
  `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

/**
 * Printable receipt for a walk-in Design Catalog sale. Only #receipt-print-area
 * is sent to the printer (see globals.css @media print).
 */
export default function OrderReceiptModal({
  order,
  onClose,
}: {
  readonly order: CatalogOrder;
  readonly onClose: () => void;
}) {
  const { shop } = useAuthStore();
  const total = Number(order.total_amount ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-surface rounded-2xl border border-line w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div id="receipt-print-area" className="p-6 text-black">
          <div className="text-center border-b border-dashed border-gray-400 pb-4 mb-4">
            <h2 className="text-xl font-bold tracking-tight">{shop?.name ?? 'Sutura Shop'}</h2>
            {shop?.address && (
              <p className="text-xs text-gray-600 mt-0.5">
                {shop.address}{shop.city ? `, ${shop.city}` : ''}
              </p>
            )}
            <p className="mt-2 text-sm font-semibold uppercase tracking-widest">Official Receipt</p>
          </div>

          <div className="text-sm space-y-1.5">
            <div className="flex justify-between"><span className="text-gray-600">Receipt No.</span><span className="font-semibold">RCPT-{String(order.id).padStart(5, '0')}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Date</span><span>{fmtDate(order.created_at)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Customer</span><span className="font-medium">{order.customer?.name ?? 'Walk-in Guest'}</span></div>
          </div>

          <div className="border-t border-dashed border-gray-400 my-4" />

          <div className="text-sm">
            <div className="flex justify-between font-medium">
              <span>{order.catalog_item?.name ?? 'Item'}</span>
              <span>{peso(total)}</span>
            </div>
            {order.discount_amount && Number(order.discount_amount) > 0 && (
              <p className="text-xs font-bold mt-1">Discount applied: −{peso(order.discount_amount)}</p>
            )}
          </div>

          <div className="border-t border-dashed border-gray-400 my-4" />

          <div className="text-sm space-y-1.5">
            <div className="flex justify-between"><span className="text-gray-600">Total</span><span className="font-bold">{peso(total)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Payment Status</span><span className="capitalize font-medium">{order.payment_status}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Fulfillment</span><span>Store Pickup</span></div>
          </div>

          <p className="text-center text-xs text-gray-600 mt-6 border-t border-dashed border-gray-400 pt-4">
            Thank you for your purchase!
          </p>
        </div>

        <div className="flex gap-2 p-4 border-t border-line no-print">
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-line text-sm font-semibold text-ink-body hover:bg-canvas transition-colors"
          >
            <X size={16} /> Close
          </button>
          <button
            onClick={() => globalThis.print()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-taupe hover:bg-taupe/90 text-white text-sm font-semibold transition-colors"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
