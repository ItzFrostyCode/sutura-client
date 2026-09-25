'use client';

import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { ConnectedOrder } from './detailTypes';

interface CatalogOrdersTabProps {
  allOrders: ConnectedOrder[];
}

export default function CatalogOrdersTab({ allOrders }: CatalogOrdersTabProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-line space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-ink">Order History & Sales Breakdown</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Every walk-in sale and custom order booked against this design.
          </p>
        </div>
        <span className="text-xs font-bold bg-sunken px-3 py-1 rounded-xl text-ink-body border border-line">
          {allOrders.length} {allOrders.length === 1 ? 'Order' : 'Orders'} Total
        </span>
      </div>

      {allOrders.length === 0 ? (
        <div className="py-16 text-center text-ink-muted">
          <ShoppingBag size={38} className="mx-auto mb-2 text-ink-faint" />
          <p className="text-sm font-semibold">No orders recorded yet for this design.</p>
          <p className="text-xs text-ink-faint mt-1">
            When customers order this item from your storefront or via walk-in, orders will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-sunken border-b border-line text-ink font-bold">
                <th className="py-3 px-4">Order Code</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Size Selected</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Production Status</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {allOrders.map((ord) => (
                <tr key={`${ord.type}-${ord.id}`} className="hover:bg-canvas/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-ink">
                    {ord.order_number || `#${ord.id}`}
                  </td>
                  <td className="py-3 px-4 font-semibold text-ink">
                    {ord.customer?.name || 'Walk-in Client'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-sunken border border-line text-[10px] font-semibold text-ink-muted">
                      {ord.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-ink-body">
                    {ord.selected_size || 'Standard'}
                  </td>
                  <td className="py-3 px-4 font-bold text-ink font-mono">
                    ₱{Number(ord.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        ord.payment_status === 'paid'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {ord.payment_status || 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] font-medium text-ink-body capitalize">
                      {(ord.status || 'Pending').replaceAll('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-ink-muted text-[11px]">
                    {new Date(ord.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
