import React, { useState } from 'react';
import Image from 'next/image';
import { Receipt, XCircle, Tag, ShoppingBag, Store, User, ArrowRight, Loader2, Check } from 'lucide-react';
import { CatalogOrder, StatusBadge } from './orderHelpers';
import OrderReceiptModal from './OrderReceiptModal';

interface OrderListItemProps {
  readonly order: CatalogOrder;
  readonly updating: number | null;
  readonly onUpdateStatus: (orderId: number, status: string) => Promise<void>;
  readonly onApplyDiscount: (orderId: number, amount: number, reason: string) => Promise<void>;
  readonly highlighted?: boolean;
}

export default function OrderListItem({
  order,
  updating,
  onUpdateStatus,
  onApplyDiscount,
  highlighted,
}: Readonly<OrderListItemProps>) {
  const isUpdating = updating === order.id;
  const [showReceipt, setShowReceipt] = useState(false);
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const isOpenOrder = order.status !== 'completed' && order.status !== 'cancelled';

  return (
    <div
      id={`order-${order.id}`}
      className={`rounded-2xl border bg-surface transition-all overflow-hidden shadow-2xs hover:shadow-sm ${
        highlighted ? 'border-taupe ring-2 ring-taupe/30 bg-taupe/5' : 'border-line hover:border-taupe/50'
      }`}
    >
      <div className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        
        {/* Left: Product Thumbnail & Title Info */}
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="h-20 w-20 rounded-xl bg-canvas border border-line overflow-hidden shrink-0 relative shadow-2xs">
            {order.catalog_item?.images?.[0]?.image_url ? (
              <Image 
                src={order.catalog_item.images[0].image_url} 
                alt={order.catalog_item.name || 'Catalog Product'} 
                fill 
                className="object-cover" 
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-ink-faint text-[10px]">
                <ShoppingBag size={18} className="opacity-40 mb-1" />
                <span>No photo</span>
              </div>
            )}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono font-bold text-ink-muted bg-canvas px-2 py-0.5 rounded border border-line">
                #ORD-{order.id}
              </span>
              <StatusBadge status={order.status} />
              {order.selected_size && (
                <span className="text-[10px] font-bold bg-canvas text-ink-body px-2 py-0.5 rounded border border-line uppercase tracking-wider">
                  Size: {order.selected_size}
                </span>
              )}
            </div>

            <h4 className="font-bold text-ink text-sm sm:text-base leading-snug line-clamp-1">
              {order.catalog_item?.name || 'Walk-in Catalog Item'}
            </h4>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-black font-mono text-ink text-sm">
                ₱{Number.parseFloat(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              {order.discount_amount && Number(order.discount_amount) > 0 && (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                  −₱{Number(order.discount_amount).toLocaleString()} discount applied
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Customer & Branch Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 text-xs border-t lg:border-t-0 lg:border-l border-line pt-3 lg:pt-0 lg:pl-5 shrink-0 min-w-[200px]">
          <div className="flex items-center gap-2 text-ink-muted">
            <User size={13} className="text-taupe shrink-0" />
            <span className="text-ink-faint">Client:</span>
            <span className="font-bold text-ink truncate">{order.customer?.name || 'Walk-in Guest'}</span>
          </div>

          <div className="flex items-center gap-2 text-ink-muted">
            <Store size={13} className="text-taupe shrink-0" />
            <span className="text-ink-faint">Branch:</span>
            <span className="font-medium text-ink truncate">{order.branch?.name || 'Main Branch'}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-ink-faint pt-1">
            <span className="font-mono">{new Date(order.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            <span className="font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 text-[9px]">
              {order.payment_status}
            </span>
          </div>
        </div>

        {/* Right: Atelier Actions Group */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-end gap-2 border-t lg:border-t-0 lg:border-l border-line pt-3 lg:pt-0 lg:pl-5 shrink-0 w-full lg:w-auto">
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowReceipt(true)}
              className="flex-1 sm:flex-none h-9 px-3 bg-surface hover:bg-canvas border border-line text-ink text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Print Order Receipt"
            >
              <Receipt size={13} className="text-taupe" />
              <span>Receipt</span>
            </button>

            {isOpenOrder && !showDiscountForm && (
              <button
                type="button"
                onClick={() => setShowDiscountForm(true)}
                className="flex-1 sm:flex-none h-9 px-3 bg-rose-50/60 hover:bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                title="Apply Courtesy Discount"
              >
                <Tag size={13} />
                <span>Discount</span>
              </button>
            )}
          </div>

          {/* Status Workflow Primary Action */}
          {order.status === 'pending' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onUpdateStatus(order.id, 'ready')}
                disabled={isUpdating}
                className="flex-1 sm:flex-none h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-2xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <ShoppingBag size={13} />}
                <span>Mark Ready for Pickup</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (globalThis.confirm('Cancel this walk-in order? This voids the record.')) {
                    onUpdateStatus(order.id, 'cancelled');
                  }
                }}
                disabled={isUpdating}
                className="h-9 w-9 bg-surface hover:bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center justify-center transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                title="Cancel Order"
              >
                <XCircle size={14} />
              </button>
            </div>
          )}

          {order.status === 'ready' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onUpdateStatus(order.id, 'completed')}
                disabled={isUpdating}
                className="flex-1 sm:flex-none h-9 px-4 bg-taupe hover:bg-taupe-hover text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-2xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                <span>Confirm Pickup</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (globalThis.confirm('Cancel this walk-in order? This voids the record.')) {
                    onUpdateStatus(order.id, 'cancelled');
                  }
                }}
                disabled={isUpdating}
                className="h-9 w-9 bg-surface hover:bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center justify-center transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                title="Cancel Order"
              >
                <XCircle size={14} />
              </button>
            </div>
          )}

          {order.status === 'completed' && (
            <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <Check size={12} /> Fulfilled & Handed Over
            </span>
          )}

          {order.status === 'cancelled' && (
            <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              <XCircle size={12} /> Order Cancelled
            </span>
          )}
        </div>
      </div>

      {/* Inline Discount Form Drawer */}
      {showDiscountForm && (
        <div className="p-4 bg-rose-50/40 border-t border-rose-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <Tag size={14} className="text-rose-700" />
            <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">Apply Suki / Courtesy Discount</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-muted">₱</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={order.total_amount}
                placeholder="Amount"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className="w-28 pl-6 pr-2.5 py-1.5 bg-white border border-rose-200 rounded-xl text-xs font-bold text-ink focus:outline-none focus:border-rose-400 shadow-2xs"
              />
            </div>

            <input
              type="text"
              placeholder="Reason (e.g. Suki loyal customer)"
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              className="w-full sm:w-48 px-3 py-1.5 bg-white border border-rose-200 rounded-xl text-xs text-ink focus:outline-none focus:border-rose-400 shadow-2xs"
            />

            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={() => { setShowDiscountForm(false); setDiscountAmount(''); setDiscountReason(''); }}
                className="px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink border border-line rounded-xl bg-white hover:bg-canvas cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={applyingDiscount || !discountAmount || Number.parseFloat(discountAmount) <= 0}
                onClick={async () => {
                  setApplyingDiscount(true);
                  try {
                    await onApplyDiscount(order.id, Number.parseFloat(discountAmount), discountReason);
                    setShowDiscountForm(false);
                    setDiscountAmount('');
                    setDiscountReason('');
                  } finally {
                    setApplyingDiscount(false);
                  }
                }}
                className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-rose-700 hover:bg-rose-800 text-white rounded-xl cursor-pointer disabled:opacity-50 shadow-2xs transition-colors"
              >
                {applyingDiscount ? 'Applying...' : 'Apply Discount'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReceipt && <OrderReceiptModal order={order} onClose={() => setShowReceipt(false)} />}
    </div>
  );
}
