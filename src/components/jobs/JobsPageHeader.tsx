import Link from 'next/link';
import { Plus, Trash2 } from 'lucide-react';

interface JobsPageHeaderProps {
  jobsCount: number;
  onOpenTrash: () => void;
  isOwnerOrManager: boolean;
}

export default function JobsPageHeader({
  jobsCount,
  onOpenTrash,
  isOwnerOrManager,
}: JobsPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <p className="text-[11px] font-bold tracking-widest uppercase text-taupe/90 mb-1">
          {jobsCount} TAILORED JOB ORDERS
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-ink tracking-tight">
          Production Orders
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl">
          Unified artisan pipeline tracking all bespoke, lookbook-inspired, and alteration jobs.
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
        {isOwnerOrManager && (
          <button
            type="button"
            onClick={onOpenTrash}
            title="View deleted job orders"
            aria-label="View deleted job orders"
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface border border-line text-ink-muted hover:text-ink hover:bg-canvas transition-colors shadow-2xs cursor-pointer"
          >
            <Trash2 size={16} />
          </button>
        )}

        <Link
          href="/dashboard/jobs/new"
          className="flex items-center gap-1.5 bg-[#8c6b53] hover:bg-[#7b5c45] text-white px-5 py-2 rounded-xl font-bold text-xs transition-colors h-10 shadow-2xs cursor-pointer"
        >
          <Plus size={15} />
          <span>Create Job Order</span>
        </Link>
      </div>
    </div>
  );
}
