import React from 'react';
import { ChevronDown, Layers, Scissors, Shirt, Sparkles, type LucideIcon } from 'lucide-react';
import type { Job } from '../jobHelpers';
import { DEPT_LANE_TITLES, departmentOf, type DeptKey } from './kanbanConfig';

const LANES: { id: DeptKey; icon: LucideIcon }[] = [
  { id: 'men', icon: Shirt },
  { id: 'women', icon: Sparkles },
  { id: 'children', icon: Layers },
  { id: 'service', icon: Scissors },
  { id: 'other', icon: Layers },
];

interface KanbanSwimlanesProps {
  readonly columns: { id: string; title: string }[];
  /** Every order currently on the board, any stage. */
  readonly jobs: Job[];
  readonly collapsedLanes: string[];
  readonly onToggleLane: (laneId: string) => void;
  readonly renderColumn: (col: { id: string; title: string }, laneId: string, laneJobs: Job[]) => React.ReactNode;
}

/** One board, one lane per department — same stages in every lane, not a second copy of the data. */
export default function KanbanSwimlanes({ columns, jobs, collapsedLanes, onToggleLane, renderColumn }: KanbanSwimlanesProps) {
  const lanes = LANES.map((lane) => ({ ...lane, jobs: jobs.filter((j) => departmentOf(j) === lane.id) })).filter((l) => l.jobs.length > 0);

  if (lanes.length === 0) {
    return <p className="py-10 text-center text-sm italic text-ink-faint">No orders match these filters.</p>;
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {lanes.map(({ id, icon: Icon, jobs: laneJobs }) => {
        const collapsed = collapsedLanes.includes(id);
        return (
          <section key={id} className="overflow-hidden rounded-xl border border-line bg-canvas/80 shadow-2xs">
            <button
              type="button"
              onClick={() => onToggleLane(id)}
              aria-expanded={!collapsed}
              className="flex w-full select-none items-center justify-between bg-sunken/70 px-3.5 py-2 text-left transition-colors hover:bg-sunken"
            >
              <span className="flex items-center gap-2 text-[13px] font-bold text-ink">
                <Icon size={14} />
                {DEPT_LANE_TITLES[id]}
                <span className="rounded-full border border-line bg-surface px-1.5 text-[10px] font-bold text-taupe-dark">{laneJobs.length} Orders</span>
              </span>
              <ChevronDown size={14} className={`text-ink-muted transition-transform ${collapsed ? '-rotate-90' : ''}`} />
            </button>
            {!collapsed && (
              <div className="flex gap-2.5 overflow-x-auto px-3 py-2.5">
                {columns.map((col) => renderColumn(col, id, laneJobs.filter((j) => (col.id === 'on_hold' ? j.status === 'on_hold' : j.status === col.id))))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
