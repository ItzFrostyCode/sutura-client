import React, { useState } from 'react';
import Image from 'next/image';
import { Receipt, XCircle, Tag } from 'lucide-react';
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
      className={`rounded-xl border bg-[#FAFAFA] hover:bg-white transition-colors text-[#2D2A26] overflow-hidden ${
        highlighted ? 'border-taupe ring-2 ring-taupe/40' : 'border-[#EBE6E0]'
      }`}
    >
      <div className="flex flex-col md:flex-row gap-6 p-4">
      {/* Image & Product Info */}
      <div className="flex gap-4 md:w-1/3">
        <div className="h-20 w-20 rounded-lg bg-[#EBE6E0] overflow-hidden shrink-0 relative">
          {order.catalog_item?.images?.[0]?.image_url ? (
            <Image src={order.catalog_item.images[0].image_url} alt="Product" fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-[#9A8073]">No Image</div>
          )}
        </div>
        <div>
          <h4 className="font-medium text-[#2D2A26]">{order.catalog_item?.name || 'Unknown Product'}</h4>
          {order.selected_size && (
            <p className="text-xs font-semibold text-[#524A44] mt-0.5">Size: {order.selected_size}</p>
          )}
          <p className="text-sm font-semibold text-[#9A8073] mt-1">₱{Number.parseFloat(order.total_amount).toLocaleString()}</p>
          {order.discount_amount && Number(order.discount_amount) > 0 && (
            <p className="text-[11px] font-semibold text-rose-600 mt-0.5">
              −₱{Number(order.discount_amount).toLocaleString()} discount applied
            </p>
          )}
          <div className="mt-2">
            <StatusBadge status={order.status} />
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="md:w-1/3 space-y-2">
        <p className="text-sm">
          <span className="text-[#9A8073]">Customer: </span>
          <span className="font-medium text-[#2D2A26]">{order.customer?.name || 'Guest User'}</span>
        </p>
        <p className="text-sm">
          <span className="text-[#9A8073]">Payment: </span>
          <span className="font-medium text-[#2D2A26] capitalize">{order.payment_status}</span>
        </p>
      </div>

      {/* Actions */}
      <div className="md:w-1/3 flex flex-col justify-center gap-2 items-end">
        <p className="text-xs text-[#9A8073] mb-2">{new Date(order.created_at).toLocaleString()}</p>

        <button
          onClick={() => setShowReceipt(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 border border-[#D1C7BD] text-[#524A44] text-sm font-medium rounded-lg hover:bg-[#FAF6F3] transition-colors cursor-pointer"
        >
          <Receipt className="w-4 h-4" /> Print Receipt
        </button>

        {isOpenOrder && (
          showDiscountForm ? (
            <div className="bg-white border border-rose-200 p-3 rounded-lg flex flex-col gap-2 w-64 shadow-xs">
              <p className="text-[10px] font-bold text-rose-700 uppercase">Apply Discount</p>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#A8A19A] text-xs">₱</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={order.total_amount}
                  placeholder="0.00"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-full border border-[#EBE6E0] pl-5 pr-2 py-1 rounded text-xs focus:outline-none focus:border-rose-400"
                />
              </div>
              <input
                type="text"
                placeholder="Reason (optional) — e.g. repeat customer"
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                className="w-full border border-[#EBE6E0] px-2 py-1 rounded text-xs focus:outline-none focus:border-rose-400"
              />
              <div className="flex gap-1 justify-end">
                <button
                  onClick={() => { setShowDiscountForm(false); setDiscountAmount(''); setDiscountReason(''); }}
                  className="px-2 py-1 text-xs border border-[#EBE6E0] rounded hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
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
                  className="px-2 py-1 text-xs bg-rose-600 text-white rounded hover:bg-rose-700 cursor-pointer disabled:opacity-50"
                >
                  {applyingDiscount ? 'Applying...' : 'Apply'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDiscountForm(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 border border-rose-200 text-rose-700 text-sm font-medium rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <Tag className="w-4 h-4" /> Apply Discount
            </button>
          )
        )}

        {order.status === 'pending' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'ready')}
            disabled={isUpdating}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer text-center"
          >
            {isUpdating ? 'Updating...' : 'Mark Ready for Pickup'}
          </button>
        )}

        {order.status === 'pending' && (
          <button
            onClick={() => {
              if (window.confirm('Cancel this order? This voids a mistaken or duplicate entry — use it only before any prep has started.')) {
                onUpdateStatus(order.id, 'cancelled');
              }
            }}
            disabled={isUpdating}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 border border-[#B26959]/30 text-[#B26959] text-sm font-medium rounded-lg hover:bg-[#B26959]/10 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <XCircle className="w-4 h-4" /> Cancel Order
          </button>
        )}

        {order.status === 'ready' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'completed')}
            disabled={isUpdating}
            className="w-full sm:w-auto px-4 py-2 bg-[#2D2A26] text-white text-sm font-medium rounded-lg hover:bg-[#1a1816] transition-colors disabled:opacity-50 cursor-pointer text-center"
          >
            {isUpdating ? 'Updating...' : 'Confirm Pickup'}
          </button>
        )}

        {order.status === 'completed' && (
          <p className="text-sm font-medium text-green-600">Order Fulfilled</p>
        )}

        {order.status === 'cancelled' && (
          <p className="text-sm font-medium text-[#B26959]">Order Cancelled</p>
        )}
      </div>
      </div>

      {showReceipt && <OrderReceiptModal order={order} onClose={() => setShowReceipt(false)} />}
    </div>
  );
}
