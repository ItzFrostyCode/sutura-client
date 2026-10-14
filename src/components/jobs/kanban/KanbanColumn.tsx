import React from 'react';
import { AlertTriangle, ChevronsLeftRight, ChevronsRightLeft } from 'lucide-react';
import { ColumnIcon, type Job } from '../jobHelpers';
import { WIP_UNLIMITED, wipState } from './kanbanConfig';
import type { HoverState } from './useKanbanDrag';

interface KanbanColumnProps {
  readonly col: { id: string; title: string };
  /** 'unified' for the single board, or the swimlane id — the same stage appears once per lane. */
  readonly laneId: string;
  readonly jobs: Job[];
  /** Orders in this stage across the whole shop (what the WIP limit counts). */
  readonly totalCount: number;
  readonly limit: number;
  readonly collapsed: boolean;
  readonly onToggle: () => void;
  readonly hover: HoverState | null;
  readonly dragJobId: number | null;
  readonly dragHeight: number;
  readonly shaking: boolean;
  /** Show only the newest N (Completed piles up forever); the rest sit behind "Show all". */
  readonly capAt?: number;
  readonly renderCard: (job: Job) => React.ReactNode;
}

const BADGE: Record<string, string> = {
  ok: 'bg-sunken text-ink-body border-line',
  near: 'bg-amber-100 text-amber-800 border-amber-300',
  full: 'bg-red-50 text-red-700 border-red-200 font-extrabold',
};

export default function KanbanColumn({
  col, laneId, jobs, totalCount, limit, collapsed, onToggle, hover, dragJobId, dragHeight, shaking, capAt, renderCard,
}: KanbanColumnProps) {
  const [showAll, setShowAll] = React.useState(false);
  const state = wipState(totalCount, limit);
  const limitText = limit >= WIP_UNLIMITED ? '∞' : String(limit);
  const here = hover?.colId === col.id && hover.laneId === laneId ? hover : null;
  const visible = capAt && !showAll ? jobs.slice(0, capAt) : jobs;

  const items: React.ReactNode[] = [];
  let slot = 0;
  const dropSlot = (
    <div key="drop-slot" aria-hidden>
      <div className="relative my-1 h-[3px] rounded bg-taupe shadow-[0_0_8px_rgba(154,128,115,0.6)]" />
      <div
        className="flex items-center justify-center rounded-lg border-2 border-dashed border-taupe/45 bg-taupe/5 text-[10px] font-bold uppercase tracking-wider text-taupe"
        style={{ height: dragHeight }}
      >
        Drop here
      </div>
    </div>
  );
  visible.forEach((job) => {
    if (job.id !== dragJobId) {
      if (here && here.index >= 0 && slot === here.index) items.push(dropSlot);
      slot += 1;
    }
    items.push(<React.Fragment key={job.id}>{renderCard(job)}</React.Fragment>);
  });
  if (here && here.index >= 0 && here.index >= slot) items.push(dropSlot);

  return (
    <section
      id={`kanban-col-${col.id}-${laneId}`}
      data-kanban-col
      data-col-id={col.id}
      data-lane-id={laneId}
      data-collapsed={collapsed}
      aria-label={`${col.title}, ${totalCount} orders`}
      className={`relative flex shrink-0 snap-start flex-col overflow-hidden rounded-xl border transition-[width,border-color,background-color] duration-200 ${
        collapsed ? 'w-[38px] border-line bg-sunken/60 max-sm:hidden' : 'w-[264px] max-sm:w-[78vw]'
      } ${here?.refused ? 'border-2 border-amber-500 bg-amber-100/30' : collapsed ? '' : 'border-line bg-canvas/80'} ${shaking ? 'animate-kanban-shake' : ''}`}
      style={{ maxHeight: 'calc(100vh - 290px)' }}
    >
      {collapsed ? (
        <div className="flex h-full min-h-[160px] select-none flex-col items-center gap-2 px-0.5 py-2" title={`Collapsed: ${col.title}`}>
          <button type="button" onClick={onToggle} aria-label={`Expand ${col.title}`} title={`Expand ${col.title}`} className="flex h-6 w-6 items-center justify-center rounded border border-line bg-sunken text-taupe transition-colors hover:border-taupe hover:bg-taupe hover:text-white">
            <ChevronsLeftRight size={13} />
          </button>
          <span className={`rounded-full border px-1.5 text-[10px] font-bold tabular-nums ${BADGE[state]}`}>{totalCount}</span>
          <span className="rotate-180 whitespace-nowrap text-[11px] font-bold tracking-wide text-ink [writing-mode:vertical-rl]">{col.title}</span>
        </div>
      ) : (
        <>
          <header className="flex items-center justify-between gap-1.5 border-b border-line bg-surface px-2.5 py-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <ColumnIcon id={col.id} />
              <h3 className="truncate text-xs font-bold text-ink" title={col.title}>{col.title}</h3>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span title={`Capacity: ${totalCount} of ${limitText} orders`} className={`rounded-full border px-1.5 text-[10px] font-bold tabular-nums ${BADGE[state]}`}>
                {totalCount} / {limitText}
              </span>
              <button type="button" onClick={onToggle} aria-label={`Collapse ${col.title}`} title={`Collapse ${col.title}`} className="flex h-[22px] w-6 items-center justify-center rounded border border-line bg-sunken text-ink-muted transition-colors hover:bg-line-hover hover:text-ink">
                <ChevronsRightLeft size={13} />
              </button>
            </div>
          </header>

          {here?.refused && (
            <p className="mx-2 mt-1.5 flex items-center gap-1 rounded border border-red-200 bg-red-50 px-1.5 py-1 text-[10px] font-bold text-red-700">
              <AlertTriangle size={11} />WIP limit reached • finish one first
            </p>
          )}

          <div className="hide-scrollbar flex min-h-[100px] flex-1 flex-col gap-1.5 overflow-y-auto p-2">
            {items}
            {capAt && jobs.length > capAt && (
              <button type="button" onClick={() => setShowAll((s) => !s)} className="py-1.5 text-center text-xs font-semibold text-taupe hover:underline">
                {showAll ? 'Show less' : `Show all ${jobs.length}`}
              </button>
            )}
            {jobs.length === 0 && !here && <p className="px-2.5 py-4 text-center text-[11px] italic text-ink-faint">No orders in this stage</p>}
          </div>
        </>
      )}
    </section>
  );
}
