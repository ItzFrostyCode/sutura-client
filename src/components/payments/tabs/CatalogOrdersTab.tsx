'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { CatalogOrderItem } from '../usePayments';
import { getMethodBadge, getPaymentStatusBadge } from '../paymentHelpers';

interface CatalogOrdersTabProps {
  catalogLoading: boolean;
  catalogOrders: CatalogOrderItem[];
}

export default function CatalogOrdersTab({
  catalogLoading,
  catalogOrders,
}: CatalogOrdersTabProps) {
  return (
    <div>
      {catalogLoading ? (
        <div className="p-4">
          <TableSkeleton rows={6} cols={6} />
        </div>
      ) : catalogOrders.length === 0 ? (
        <div className="text-center py-16 px-4">
          <h3 className="font-bold text-sm text-ink">No Catalog Orders</h3>
          <p className="text-xs text-ink-muted mt-0.5">Ready-to-wear direct purchases will appear here.</p>
        </div>
      ) : (
        <div>
          {/* Mobile Catalog View */}
          <div className="block md:hidden divide-y divide-line">
            {catalogOrders.map(ord => (
              <div key={`mob-ord-${ord.id}`} className="p-3.5 space-y-2 hover:bg-canvas/30 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm text-ink">{ord.catalog_item?.name || 'Catalog Item'}</p>
                    <p className="text-xs text-ink-muted">{ord.customer?.name || 'Guest'}</p>
                  </div>
                  <p className="text-base font-bold text-ink tabular-nums">₱{Number(ord.total_amount).toFixed(2)}</p>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {getMethodBadge(ord.payment_method)}
                    {getPaymentStatusBadge(ord.payment_status)}
                  </div>
                  <Link
                    href={`/dashboard/jobs?tab=showroom_sales&order=${ord.id}`}
                    className="font-bold text-taupe hover:underline flex items-center gap-0.5"
                  >
                    <span>Order #{ord.id}</span> <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Catalog View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-ink-body">
              <thead className="bg-canvas/50 text-[10px] font-bold uppercase tracking-wider text-ink-faint border-b border-line">
                <tr>
                  <th className="px-4 py-2.5">Item</th>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                  <th className="px-4 py-2.5">Method</th>
                  <th className="px-4 py-2.5 text-center">Payment</th>
                  <th className="px-4 py-2.5 text-right">Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {catalogOrders.map(ord => (
                  <tr key={ord.id} className="hover:bg-canvas/40 transition-colors">
                    <td className="px-4 py-3 align-middle font-bold text-xs text-ink">
                      {ord.catalog_item?.name || 'Catalog Item'}
                    </td>
                    <td className="px-4 py-3 align-middle text-xs font-medium text-ink">
                      {ord.customer?.name || <span className="text-ink-faint italic">Guest</span>}
                    </td>
                    <td className="px-4 py-3 align-middle text-right font-bold text-xs text-ink tabular-nums">
                      ₱{Number(ord.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      {getMethodBadge(ord.payment_method)}
                    </td>
                    <td className="px-4 py-3 align-middle text-center">
                      {getPaymentStatusBadge(ord.payment_status)}
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      <Link
                        href={`/dashboard/jobs?tab=showroom_sales&order=${ord.id}`}
                        className="text-xs font-bold text-taupe hover:underline inline-flex items-center gap-1"
                      >
                        <span>#{ord.id}</span> <ArrowUpRight size={11} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
