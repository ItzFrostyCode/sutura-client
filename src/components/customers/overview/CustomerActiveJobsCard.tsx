import React from 'react';
import Link from 'next/link';
import { Scissors, ArrowUpRight, Package, ChevronRight } from 'lucide-react';
import { JobOrder } from '../customerTypes';
import { useShopRole } from '@/hooks/useShopRole';
import { peso, amountOf } from '../customerMoney';

interface CustomerActiveJobsCardProps {
  readonly jobs: JobOrder[];
  readonly customerId?: number;
  readonly onViewAll: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  on_hold: 'bg-sunken text-ink-muted border-line',
  cancelled: 'bg-red-50 text-danger border-red-200',
  rejected: 'bg-red-50 text-danger border-red-200',
  ready_for_pickup: 'bg-sage/10 text-sage border-sage/20',
  completed: 'bg-sage/10 text-sage border-sage/20',
};

const statusLabel = (status: string) => status.replace(/_/g, ' ');

/** The client's live production orders as a structured table; "View All" jumps to the Job Orders tab. */
export default function CustomerActiveJobsCard({ jobs, customerId, onViewAll }: CustomerActiveJobsCardProps) {
  const { isOwnerOrManager } = useShopRole();
  const activeJobs = jobs
    .filter((j) => !['completed', 'cancelled', 'rejected'].includes(j.status))
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
  const shown = activeJobs.slice(0, 5);

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sunken flex items-center justify-center text-ink-muted shrink-0">
            <Scissors size={15} />
          </div>
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink">Ongoing Garments Production</h3>
            <p className="text-xs text-ink-muted">
              {activeJobs.length > 0 ? `${activeJobs.length} job order${activeJobs.length === 1 ? '' : 's'} currently in the production workflow` : 'No job orders in the production workflow'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="flex items-center gap-1 text-xs font-bold text-taupe hover:text-ink transition-colors cursor-pointer group"
        >
          View All ({jobs.length})
          <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {shown.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[560px]">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-ink-faint border-b border-line">
                <th className="py-2.5 px-3">Order ID</th>
                <th className="py-2.5 px-3">Garment &amp; Service</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {shown.map((job) => (
                <tr key={job.id} className="hover:bg-canvas/60 transition-colors group">
                  <td className="py-3.5 px-3 font-bold text-ink whitespace-nowrap">{job.order_number}</td>
                  <td className="py-3.5 px-3 text-ink min-w-[180px]">
                    <div className="font-medium">{job.service?.name || 'Custom Tailoring Service'}</div>
                    <span className="text-[11px] text-ink-faint">{job.intake_channel === 'walk_in' ? 'Walk-in order' : 'Online order'}</span>
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border rounded ${STATUS_STYLES[job.status] ?? 'bg-sunken text-ink-muted border-line'}`}>
                      {statusLabel(job.status)}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-ink-muted whitespace-nowrap">
                    {job.due_date ? `Due ${new Date(job.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}` : 'No deadline'}
                  </td>
                  <td className="py-3.5 px-3 text-right font-bold text-ink whitespace-nowrap tabular-nums">{peso(amountOf(job.total_amount))}</td>
                  <td className="py-3.5 px-2 text-right">
                    <Link
                      href={`/dashboard/jobs/${job.id}`}
                      className="inline-flex w-7 h-7 rounded-md items-center justify-center text-ink-faint hover:bg-sunken hover:text-ink transition-colors"
                      title={`View ${job.order_number}`}
                    >
                      <ArrowUpRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-ink-faint border border-dashed border-line rounded-xl bg-canvas/40 space-y-2">
          <Package size={24} className="mx-auto opacity-40" />
          <p className="text-xs font-medium">No active production runs right now</p>
          {isOwnerOrManager && (
            <Link
              href={`/dashboard/jobs/new?customer_id=${customerId}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-espresso text-white text-xs font-bold uppercase tracking-wider shadow-2xs hover:bg-espresso/90 transition-colors"
            >
              <Scissors size={12} /> New Job Order
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
