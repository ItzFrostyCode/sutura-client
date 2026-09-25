import React from 'react';
import Link from 'next/link';
import { Scissors, ChevronRight, ArrowUpRight, Package } from 'lucide-react';
import { JobOrder } from '../customerTypes';

interface CustomerActiveJobsCardProps {
  readonly jobs: JobOrder[];
  readonly customerId?: number;
  readonly onViewAll: () => void;
}

export default function CustomerActiveJobsCard({
  jobs,
  customerId,
  onViewAll,
}: CustomerActiveJobsCardProps) {
  const activeJobs = jobs.filter((j) => !['completed', 'cancelled'].includes(j.status));

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
      <div className="flex justify-between items-center border-b border-line pb-4 min-h-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sage/10 text-sage border border-sage/20 flex items-center justify-center font-bold shrink-0 shadow-2xs">
            <Scissors size={14} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-ink uppercase tracking-wider">Ongoing Garments Production</h3>
            <p className="text-[11px] text-ink-muted">{activeJobs.length} custom orders in progress</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="text-xs text-taupe font-bold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>View All ({jobs.length})</span>
          <ChevronRight size={13} />
        </button>
      </div>

      {activeJobs.length > 0 ? (
        <div className="space-y-2.5">
          {activeJobs.map((job) => (
            <Link
              key={job.id}
              href={`/dashboard/jobs/${job.id}`}
              className="flex items-center justify-between p-3.5 bg-canvas hover:bg-surface border border-line hover:border-taupe rounded-xl transition-all group shadow-2xs"
            >
              <div className="space-y-0.5 min-w-0 flex-1 pr-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink group-hover:text-taupe transition-colors text-xs">
                    {job.order_number}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full border uppercase tracking-wider bg-sage/10 text-sage border-sage/20">
                    {job.status}
                  </span>
                </div>
                <p className="text-xs text-ink-muted truncate">{job.service?.name || 'Custom Tailoring Service'}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="font-black font-mono text-ink text-xs">
                    ₱{Number.parseFloat(String(job.total_amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-ink-faint">
                    {job.due_date ? `Due ${new Date(job.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}` : 'No deadline'}
                  </div>
                </div>
                <ArrowUpRight size={15} className="text-ink-faint group-hover:text-taupe transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-ink-faint border border-dashed border-line rounded-xl bg-canvas/40 space-y-2">
          <Package size={24} className="mx-auto opacity-40" />
          <p className="text-xs font-medium">No active production runs right now</p>
          <Link
            href={`/dashboard/jobs/new?customer_id=${customerId}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-taupe text-white text-xs font-bold uppercase tracking-wider shadow-2xs hover:bg-taupe-hover transition-colors"
          >
            <Scissors size={12} /> Create Job Order
          </Link>
        </div>
      )}
    </div>
  );
}
