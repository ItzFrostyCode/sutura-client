'use client';

import React, { useState } from 'react';
import { 
  X, 
  Package, 
  CheckCircle, 
  Clock, 
  User, 
  Store, 
  Receipt, 
  ShieldAlert, 
  CreditCard, 
  Calendar, 
  ArrowRight,
  Loader2,
  Check,
  Tag
} from 'lucide-react';
import Modal from '@/components/Modal';
import { CatalogOrder, StatusBadge } from './orderHelpers';
import { getMediaUrl } from '@/lib/media';

interface OrderDetailsModalProps {
  readonly order: CatalogOrder;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onUpdateStatus: (orderId: number, nextStatus: string, nextPaymentStatus?: string) => Promise<void>;
  readonly onOpenReceipt: (order: CatalogOrder) => void;
  readonly onOpenDiscount?: (order: CatalogOrder) => void;
  readonly isUpdating?: boolean;
}

const peso = (v: string | number | null | undefined) =>
  `₱${Number(v ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

const fmtDateTime = (d?: string | null) => {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export default function OrderDetailsModal({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
  onOpenReceipt,
  onOpenDiscount,
  isUpdating = false,
}: OrderDetailsModalProps) {
  const [markPaidOnPickup, setMarkPaidOnPickup] = useState(true);
  const [showConfirmPickup, setShowConfirmPickup] = useState(false);

  const rawImage = order.catalog_item?.images?.[0]?.image_url;
  const imageUrl = rawImage ? getMediaUrl(rawImage) : null;

  const isPending = order.status === 'pending';
  const isReady = order.status === 'ready';
  const isCompleted = order.status === 'completed';
  const isCancelled = order.status === 'cancelled';
  const isUnpaid = order.payment_status !== 'paid';

  const handleConfirmPickup = async () => {
    const nextPayment = (isUnpaid && markPaidOnPickup) ? 'paid' : undefined;
    await onUpdateStatus(order.id, 'completed', nextPayment);
    setShowConfirmPickup(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-ink">#ORD-{order.id}</span>
          <StatusBadge status={order.status} />
        </div>
      }
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* ── STEP-BY-STEP TRACKING TIMELINE ───────────────────────── */}
        <div className="bg-canvas/50 border border-line rounded-2xl p-4 sm:p-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4 flex items-center gap-1.5">
            <span>Order Lifecycle & Tracking</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative">
            {/* Step 1: Placed */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              isCancelled 
                ? 'bg-canvas border-line text-ink-muted opacity-60'
                : 'bg-surface border-emerald-200 ring-1 ring-emerald-100'
            }`}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                  ✓
                </div>
                <span className="text-xs font-bold text-ink">1. Order Intake</span>
              </div>
              <p className="text-[11px] text-ink-muted">Recorded at counter</p>
              <p className="text-[10px] font-mono text-ink-faint mt-1">
                {fmtDateTime(order.created_at)}
              </p>
            </div>

            {/* Step 2: Ready for Pickup */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              isReady || isCompleted
                ? 'bg-surface border-blue-200 ring-1 ring-blue-100'
                : isPending
                ? 'bg-amber-50/50 border-amber-200'
                : 'bg-canvas border-line text-ink-muted opacity-50'
            }`}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isReady || isCompleted 
                    ? 'bg-blue-100 text-blue-700' 
                    : isPending
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {isReady || isCompleted ? '✓' : '2'}
                </div>
                <span className="text-xs font-bold text-ink">2. Counter Ready</span>
              </div>
              <p className="text-[11px] text-ink-muted">
                {isReady || isCompleted ? 'Packaged & ready on rack' : 'Preparing garment...'}
              </p>
              <p className="text-[10px] font-mono text-ink-faint mt-1">
                {isReady ? 'Awaiting pickup' : isCompleted ? 'Prepared' : 'In Progress'}
              </p>
            </div>

            {/* Step 3: Fulfilled */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              isCompleted
                ? 'bg-surface border-emerald-300 ring-1 ring-emerald-200 bg-emerald-50/30'
                : isCancelled
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-canvas border-line text-ink-muted opacity-50'
            }`}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isCompleted 
                    ? 'bg-emerald-600 text-white' 
                    : isCancelled
                    ? 'bg-rose-200 text-rose-700'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {isCompleted ? '✓' : isCancelled ? '✕' : '3'}
                </div>
                <span className="text-xs font-bold text-ink">
                  {isCancelled ? 'Cancelled' : '3. Customer Handover'}
                </span>
              </div>
              <p className="text-[11px] text-ink-muted">
                {isCompleted ? 'Garment claimed by customer' : isCancelled ? 'Order was voided' : 'Pending handover'}
              </p>
              <p className="text-[10px] font-mono text-ink-faint mt-1">
                {isCompleted ? 'Fulfilled' : isCancelled ? 'Voided' : 'Step pending'}
              </p>
            </div>
          </div>
        </div>

        {/* ── GARMENT & SIZING INFO ──────────────────────────────────── */}
        <div className="p-4 bg-surface border border-line rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-20 rounded-xl bg-canvas border border-line overflow-hidden shrink-0 flex items-center justify-center">
              {imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={imageUrl} alt={order.catalog_item?.name || 'Garment'} className="w-full h-full object-cover" />
              ) : (
                <Package className="text-ink-faint opacity-40" size={24} />
              )}
            </div>
            <div>
              <h3 className="font-bold text-ink text-sm sm:text-base">{order.catalog_item?.name || 'Showroom Garment'}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-black text-white text-xs font-bold">
                  Size: {order.selected_size || 'Standard'}
                </span>
                <span className="text-xs text-ink-muted">
                  Off-the-rack Showroom Order
                </span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-line">
            <span className="text-[11px] text-ink-muted block">Total Amount</span>
            <span className="text-lg font-bold font-mono text-ink">
              {peso(order.total_amount)}
            </span>
            {order.discount_amount && Number(order.discount_amount) > 0 && (
              <span className="block text-[11px] font-semibold text-rose-600">
                Discount: -{peso(order.discount_amount)}
              </span>
            )}
          </div>
        </div>

        {/* ── CUSTOMER & PAYMENT PROOF GRID ─────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Customer Details */}
          <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-ink-faint flex items-center gap-1.5">
              <User size={13} />
              <span>Customer Details</span>
            </h5>
            <div className="text-sm font-semibold text-ink">
              {order.customer?.name || 'Walk-in Guest'}
            </div>
            {order.customer?.email && (
              <div className="text-xs text-ink-muted">
                {order.customer.email}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-ink-faint pt-1">
              <Store size={12} />
              <span>{order.branch?.name || 'Main Showroom Branch'}</span>
            </div>
          </div>

          {/* Payment Details & Proof */}
          <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-ink-faint flex items-center gap-1.5">
              <CreditCard size={13} />
              <span>Payment & Settlement</span>
            </h5>
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted">Payment Method:</span>
              <span className="text-xs font-bold uppercase text-ink">
                {order.payment_method || 'Cash'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted">Payment Status:</span>
              <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${
                order.payment_status === 'paid' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                {order.payment_status}
              </span>
            </div>
            {order.payment_reference && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-line/60">
                <span className="text-ink-muted">Reference:</span>
                <span className="font-mono font-semibold text-ink">{order.payment_reference}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── CONFIRM PICKUP MODAL POPUP IF TRIGGERED ───────────────── */}
        {showConfirmPickup && (
          <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/80 space-y-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="text-amber-700 shrink-0 mt-0.5" size={18} />
              <div className="space-y-1">
                <h5 className="text-xs font-bold text-amber-900">
                  Confirm Customer Handover (Fulfillment)
                </h5>
                <p className="text-xs text-amber-800">
                  Are you sure you want to release <strong>{order.catalog_item?.name}</strong> (Size: {order.selected_size || 'Standard'}) to <strong>{order.customer?.name || 'Customer'}</strong>?
                </p>
                {isUnpaid && (
                  <div className="mt-2 pt-2 border-t border-amber-200">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-950">
                      <input 
                        type="checkbox"
                        checked={markPaidOnPickup}
                        onChange={(e) => setMarkPaidOnPickup(e.target.checked)}
                        className="rounded border-amber-400 text-taupe focus:ring-taupe h-4 w-4"
                      />
                      <span>Collect payment ({peso(order.total_amount)}) and mark as PAID now</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/60">
              <button
                type="button"
                onClick={() => setShowConfirmPickup(false)}
                className="px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink bg-surface border border-line rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPickup}
                disabled={isUpdating}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                <span>Confirm Handover & Fulfill</span>
              </button>
            </div>
          </div>
        )}

        {/* ── ACTION FOOTER ────────────────────────────────────────── */}
        <div className="pt-4 border-t border-line flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenReceipt(order)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-line bg-surface hover:bg-canvas text-ink text-xs font-semibold transition-colors cursor-pointer"
            >
              <Receipt size={14} className="text-ink-muted" />
              <span>Official Receipt (Proof)</span>
            </button>

            {order.status !== 'completed' && order.status !== 'cancelled' && onOpenDiscount && (
              <button
                type="button"
                onClick={() => onOpenDiscount(order)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-800 text-xs font-semibold transition-colors cursor-pointer"
                title="Apply Courtesy Discount"
              >
                <Tag size={14} className="text-rose-600" />
                <span>Apply Discount</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isPending && (
              <button
                type="button"
                onClick={() => onUpdateStatus(order.id, 'ready')}
                disabled={isUpdating}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <Package size={14} />}
                <span>Mark Ready for Pickup</span>
              </button>
            )}

            {isReady && !showConfirmPickup && (
              <button
                type="button"
                onClick={() => setShowConfirmPickup(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-taupe hover:bg-taupe-hover text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Check size={14} />
                <span>Confirm Customer Pickup</span>
              </button>
            )}

            {isCompleted && (
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <CheckCircle size={14} className="text-emerald-600" />
                <span>Order Completed & Handed Over</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
