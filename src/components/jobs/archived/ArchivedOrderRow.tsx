import { Loader2, RotateCcw } from 'lucide-react';
import { BTN_SM } from '@/components/shared/plainForm';
import { stageNote } from '../jobStage';
import type { ArchivedJob } from './useArchivedOrders';

/** Column layout shared by the row and the list's heading row (desktop). */
export const ARCHIVED_COLS = 'lg:grid-cols-[7rem_minmax(0,1.2fr)_minmax(0,1.4fr)_6rem_minmax(0,1fr)_7rem_16rem]';

const archivedOn = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

interface Props {
  readonly job: ArchivedJob;
  readonly busy: boolean;
  readonly onRestore: (job: ArchivedJob) => void;
  readonly onDelete: (job: ArchivedJob) => void;
}

/** One archived order: a table-like row on desktop, stacked on a phone. */
export default function ArchivedOrderRow({ job, busy, onRestore, onDelete }: Props) {
  const item = [job.service?.name, job.catalog_item?.name].filter(Boolean).join(' · ') || '—';
  return (
    <li className={`grid gap-1 px-4 py-4 sm:px-6 lg:items-center lg:gap-4 lg:py-3 ${ARCHIVED_COLS}`}>
      <span className="text-sm font-semibold text-ink">{job.order_number}</span>
      <span className="truncate text-sm text-ink">{job.customer?.name ?? 'Walk-in'}</span>
      <span className="truncate text-sm text-ink-body">{item}</span>
      <span className="text-sm text-ink lg:text-right">₱{Number(job.total_amount ?? 0).toLocaleString()}</span>
      <span className="truncate text-[13px] text-ink-muted">{stageNote(job)}</span>
      <span className="text-[13px] text-ink-muted">Archived {archivedOn(job.deleted_at)}</span>
      <div className="mt-2 flex flex-wrap items-center gap-3 lg:mt-0 lg:justify-end">
        <button type="button" onClick={() => onRestore(job)} disabled={busy} className={`${BTN_SM} disabled:opacity-50`}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} Restore
        </button>
        {job.has_payments ? (
          <span className="text-[13px] text-ink-muted">Has payments — stays archived</span>
        ) : (
          <button type="button" onClick={() => onDelete(job)} disabled={busy}
            className="h-9 cursor-pointer text-sm font-medium text-rose-700 hover:underline disabled:opacity-50">
            Delete permanently
          </button>
        )}
      </div>
    </li>
  );
}
