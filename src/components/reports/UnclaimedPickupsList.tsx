import React from 'react';
import Link from 'next/link';
import { PackageOpen } from 'lucide-react';
import { UnclaimedPickupRow } from './reportHelpers';

interface UnclaimedPickupsListProps {
  readonly rows: UnclaimedPickupRow[];
}

export default function UnclaimedPickupsList({ rows }: UnclaimedPickupsListProps) {
  if (rows.length === 0) return null;

  return (
    <div className="bg-surface border border-line rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <PackageOpen size={18} className="text-danger" />
        <h2 className="text-base font-semibold text-ink">Unclaimed Pickups</h2>
      </div>
      <p className="text-sm text-ink-faint mb-4">Ready for pickup 14+ days — follow up before it turns into a forfeited deposit.</p>

      {/* Mobile cards — no sideways scroll needed */}
      <div className="md:hidden -mx-6 -mb-6 divide-y divide-[#F0EAE3] border-t border-line">
        {rows.map(row => (
          <div key={row.id} className="px-6 py-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium text-ink truncate">{row.customer?.name || 'Walk-in'}</div>
                {row.customer?.phone && <div className="text-xs text-ink-faint">{row.customer.phone}</div>}
              </div>
              <p className="font-semibold text-danger shrink-0">{row.days_waiting}d waiting</p>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <Link href={`/dashboard/jobs/${row.id}`} className="text-taupe hover:underline font-medium">
                {row.order_number || `#${row.id}`}
              </Link>
              <span className="text-ink-muted">
                {row.balance > 0
                  ? `₱${row.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })} due`
                  : 'Fully paid'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto -mx-6 -mb-6">
        <table className="w-full text-left text-sm text-ink-body min-w-[560px]">
          <thead className="bg-canvas/50 text-xs uppercase text-ink-faint border-y border-line">
            <tr>
              <th className="px-6 py-3 font-medium">Customer</th>
              <th className="px-6 py-3 font-medium">Order</th>
              <th className="px-6 py-3 font-medium">Total</th>
              <th className="px-6 py-3 font-medium">Balance</th>
              <th className="px-6 py-3 font-medium">Days Waiting</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EAE3]">
            {rows.map(row => (
              <tr key={row.id} className="hover:bg-sunken/20 transition-colors">
                <td className="px-6 py-3">
                  <div className="font-medium text-ink">{row.customer?.name || 'Walk-in'}</div>
                  {row.customer?.phone && <div className="text-xs text-ink-faint">{row.customer.phone}</div>}
                </td>
                <td className="px-6 py-3">
                  <Link href={`/dashboard/jobs/${row.id}`} className="text-taupe hover:underline font-medium">
                    {row.order_number || `#${row.id}`}
                  </Link>
                </td>
                <td className="px-6 py-3">₱{row.total_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                <td className="px-6 py-3">
                  {row.balance > 0 ? (
                    <span className="font-semibold text-amber-700">₱{row.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  ) : (
                    <span className="text-[#4A7C59]">Fully paid</span>
                  )}
                </td>
                <td className="px-6 py-3 font-semibold text-danger">{row.days_waiting} days</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
