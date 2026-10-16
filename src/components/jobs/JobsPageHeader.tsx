import Link from 'next/link';
import { Plus, Trash2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';

interface JobsPageHeaderProps {
  jobsCount: number;
  onOpenTrash: () => void;
  // POST /jobs (create), POST /jobs/{id}/restore, and DELETE /jobs/{id} are
  // all role:store_owner,branch_manager-only in routes/api.php (grouped with
  // pay/discount/reject as supervisory actions) — these three actions used
  // to render for every role, so plain staff got a 403 on submit despite the
  // buttons looking fully usable.
  isOwnerOrManager: boolean;
}

export default function JobsPageHeader({
  jobsCount,
  onOpenTrash,
  isOwnerOrManager,
}: JobsPageHeaderProps) {
  return (
    <PageHeader
      eyebrow={`${jobsCount} orders`}
      title="Orders"
      description="Every order from request to pick-up. The one who came first is on top."
      actions={
        isOwnerOrManager ? (
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
            <Link
              href="/dashboard/jobs/new"
              className="flex items-center gap-1.5 bg-taupe hover:bg-taupe-hover text-white px-4 py-2 rounded-lg font-bold text-xs transition-colors h-10 shadow-2xs cursor-pointer"
            >
              <Plus size={15} />
              <span>New order</span>
            </Link>
          </>
        ) : undefined
      }
    />
  );
}
