import { Scissors, SlidersHorizontal, Truck, UserCheck } from 'lucide-react';
import SearchInput from '@/components/shared/SearchInput';
import type { StageIconFilter } from './stageIconFilters';
import ChannelTabs from './kanban/ChannelTabs';
import DeptTabs from './kanban/DeptTabs';
import BoardControls from './kanban/BoardControls';
import OriginFilter from './kanban/OriginFilter';
import StageIconStrip from './kanban/StageIconStrip';
import type { DeptKey } from './kanban/kanbanConfig';
import type { KanbanPrefs } from './kanban/useKanbanPrefs';

type Origin = 'all' | 'catalog' | 'custom' | 'alteration';

interface JobsPageToolbarProps {
  tab: 'all' | 'walk_in' | 'online';
  setTab: (tab: 'all' | 'walk_in' | 'online') => void;
  totalJobsCount: number;
  walkInCount: number;
  onlineCount: number;
  onOpenSettings: () => void;
  // "My Assigned Jobs" — shown only for staff, who aren't looking at the whole
  // store's production board, just what they personally need to work.
  showMyJobsToggle?: boolean;
  myJobsOnly?: boolean;
  setMyJobsOnly?: (val: boolean) => void;
  designOriginFilter: Origin;
  setDesignOriginFilter: (val: Origin) => void;
  catalogJobsCount: number;
  customBespokeCount: number;
  alterationJobsCount: number;
  stageFilter: string;
  setStageFilter: (val: string) => void;
  stageIconFilters: StageIconFilter[];
  search: string;
  setSearch: (val: string) => void;
  activeColumns: { id: string; title: string }[];
  deptFilter: 'all' | DeptKey;
  setDeptFilter: (val: 'all' | DeptKey) => void;
  deptCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  prefs: KanbanPrefs;
}

export default function JobsPageToolbar(p: JobsPageToolbarProps) {
  const flowHint = p.tab === 'online' ? 'Online' : p.tab === 'walk_in' ? 'Walk-in' : null;

  return (
    <>
      <div className="flex flex-col gap-2.5 border-b border-line bg-canvas/20 p-3 sm:p-3.5">
        {/* Row 1: departments + intake channel */}
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <DeptTabs value={p.deptFilter} onChange={p.setDeptFilter} counts={p.deptCounts} total={p.totalJobsCount} />
          <div className="flex items-center gap-2">
            <ChannelTabs tab={p.tab} setTab={p.setTab} total={p.totalJobsCount} walkIn={p.walkInCount} online={p.onlineCount} />
            {p.showMyJobsToggle && p.setMyJobsOnly && (
              <button
                type="button"
                onClick={() => p.setMyJobsOnly?.(!p.myJobsOnly)}
                title="Show only jobs assigned to me"
                aria-pressed={p.myJobsOnly}
                className={`flex h-9.5 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 text-xs font-bold transition-all ${
                  p.myJobsOnly ? 'border-taupe bg-taupe text-white' : 'border-line bg-canvas text-ink-muted hover:bg-surface hover:text-ink'
                }`}
              >
                <UserCheck size={14} />
                <span>My Jobs</span>
              </button>
            )}
            <button
              type="button"
              onClick={p.onOpenSettings}
              title="Stage Notification Dot Settings"
              className="flex h-9.5 w-9.5 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line bg-canvas text-ink-muted shadow-2xs transition-all hover:bg-surface hover:text-ink active:scale-95"
            >
              <SlidersHorizontal size={15} />
            </button>
          </div>
        </div>

        {/* Row 2: board controls, origin + stage filters, search */}
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <BoardControls prefs={p.prefs} columns={p.activeColumns} counts={p.statusCounts} />
            <OriginFilter
              value={p.designOriginFilter}
              onChange={p.setDesignOriginFilter}
              counts={{ all: p.totalJobsCount, catalog: p.catalogJobsCount, custom: p.customBespokeCount, alteration: p.alterationJobsCount }}
            />
            <StageIconStrip filters={p.stageIconFilters} value={p.stageFilter} onChange={p.setStageFilter} />
          </div>
          <div className="w-full shrink-0 lg:w-60">
            <SearchInput value={p.search} onChange={p.setSearch} placeholder="Search order or customer..." className="w-full" />
          </div>
        </div>
      </div>

      {flowHint && (
        <div className="flex items-center gap-2 border-b border-line bg-canvas/40 px-4 py-2 text-xs text-ink-muted">
          {p.tab === 'online' ? <Truck size={13} /> : <Scissors size={13} />}
          <span>{flowHint} production flow: <strong>{p.activeColumns.map((c) => c.title).join(' → ')}</strong>.</span>
        </div>
      )}
    </>
  );
}
