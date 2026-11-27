import React from 'react';
import Link from 'next/link';
import { PauseCircle } from 'lucide-react';
import { JobOnHoldRow } from './reportHelpers';

interface JobsOnHoldListProps {
  readonly rows: JobOnHoldRow[];
}

export default function JobsOnHoldList({ rows }: JobsOnHoldListProps) {
  if (rows.length === 0) return null;

  return (
    <div className="bg-surface border border-line rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <PauseCircle size={18} className="text-amber-600" />
        <h2 className="text-base font-semibold text-ink">Jobs On Hold</h2>
      </div>
      <p className="text-sm text-ink-faint mb-4">Paused 7+ days — worth a check-in before it&apos;s genuinely forgotten.</p>

      {/* Mobile cards — no sideways scroll needed */}
      <div className="md:hidden -mx-6 -mb-6 divide-y divide-[#F0EAE3] border-t border-line">
        {rows.map(row => (
          <div key={row.id} className="px-6 py-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium text-ink truncate">{row.customer?.name || 'Walk-in'}</div>
                {row.customer?.phone && <div className="text-xs text-ink-faint">{row.customer.phone}</div>}
              </div>
              <p className="font-semibold text-amber-700 shrink-0">{row.days_held}d held</p>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <Link href={`/dashboard/jobs/${row.id}`} className="text-taupe hover:underline font-medium">
                {row.order_number || `#${row.id}`}
              </Link>
              <span className="text-ink-muted truncate max-w-[60%]">{row.hold_reason || 'No reason given'}</span>
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
              <th className="px-6 py-3 font-medium">Hold Reason</th>
              <th className="px-6 py-3 font-medium">Days Held</th>
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
                <td className="px-6 py-3 text-ink-muted max-w-xs truncate">{row.hold_reason || 'No reason given'}</td>
                <td className="px-6 py-3 font-semibold text-amber-700">{row.days_held} days</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
