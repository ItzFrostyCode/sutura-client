import Link from 'next/link';
import { Plus, Trash2, Zap } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';

interface JobsPageHeaderProps {
  jobsCount: number;
  onOpenTrash: () => void;
  onOpenQuickJob: () => void;
}

export default function JobsPageHeader({
  jobsCount,
  onOpenTrash,
  onOpenQuickJob,
}: JobsPageHeaderProps) {
  return (
    <PageHeader
      eyebrow={`${jobsCount} Tailored Job Orders`}
      title="Production Orders"
      description="Unified artisan pipeline tracking all bespoke, lookbook-inspired, and alteration jobs."
      actions={
        <>
          <button
            type="button"
            onClick={onOpenTrash}
            title="View deleted job orders"
            aria-label="View deleted job orders"
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-surface border border-line text-ink-muted hover:text-ink hover:bg-sunken transition-colors cursor-pointer"
          >
            <Trash2 size={15} />
          </button>
          <button
            type="button"
            onClick={onOpenQuickJob}
            className="flex items-center gap-1.5 bg-surface border border-line hover:border-taupe text-ink-body hover:text-taupe px-3.5 py-2 rounded-lg font-semibold text-xs transition-colors h-10 cursor-pointer"
          >
            <Zap size={14} className="text-taupe" />
            <span>Quick Walk-in</span>
          </button>
          <Link
            href="/dashboard/jobs/new"
            className="flex items-center gap-1.5 bg-taupe hover:bg-taupe-hover text-white px-4 py-2 rounded-lg font-bold text-xs transition-colors h-10 shadow-2xs cursor-pointer"
          >
            <Plus size={15} />
            <span>Create Job Order</span>
          </Link>
        </>
      }
    />
  );
}
