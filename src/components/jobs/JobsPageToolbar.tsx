import {
  Store, ShoppingBag, SlidersHorizontal, Sparkles, Scissors, Shirt, Truck,
} from 'lucide-react';
import SearchInput from '@/components/shared/SearchInput';
import type { StageIconFilter } from './stageIconFilters';

interface JobsPageToolbarProps {
  tab: 'all' | 'walk_in' | 'online';
  setTab: (tab: 'all' | 'walk_in' | 'online') => void;
  totalJobsCount: number;
  walkInCount: number;
  onlineCount: number;
  onOpenSettings: () => void;
  designOriginFilter: 'all' | 'catalog' | 'custom' | 'alteration';
  setDesignOriginFilter: (val: 'all' | 'catalog' | 'custom' | 'alteration') => void;
  catalogJobsCount: number;
  customBespokeCount: number;
  alterationJobsCount: number;
  stageFilter: string;
  setStageFilter: (val: string) => void;
  stageIconFilters: StageIconFilter[];
  search: string;
  setSearch: (val: string) => void;
  activeColumns: { id: string; title: string }[];
}

export default function JobsPageToolbar({
  tab,
  setTab,
  totalJobsCount,
  walkInCount,
  onlineCount,
  onOpenSettings,
  designOriginFilter,
  setDesignOriginFilter,
  catalogJobsCount,
  customBespokeCount,
  alterationJobsCount,
  stageFilter,
  setStageFilter,
  stageIconFilters,
  search,
  setSearch,
  activeColumns,
}: JobsPageToolbarProps) {
  return (
    <>
      <div className="p-3 sm:p-3.5 border-b border-line bg-canvas/20 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          {/* Channel Tabs + Settings Button Group */}
          <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
            <div className="h-9.5 flex items-center gap-1 p-1 bg-canvas border border-line rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => setTab('all')}
                className={`h-7 px-3 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  tab === 'all'
                    ? 'bg-surface text-ink shadow-xs border border-line/80'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <span>All Orders</span>
                <span className="bg-sunken text-ink-muted text-[10px] px-1.5 py-0.2 rounded-full font-black tabular-nums">{totalJobsCount}</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('walk_in')}
                className={`h-7 px-3 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  tab === 'walk_in'
                    ? 'bg-surface text-ink shadow-xs border border-line/80'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Store size={12} />
                <span>Walk-in</span>
                <span className="bg-sunken text-ink-muted text-[10px] px-1.5 py-0.2 rounded-full font-black tabular-nums">{walkInCount}</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('online')}
                className={`h-7 px-3 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  tab === 'online'
                    ? 'bg-surface text-ink shadow-xs border border-line/80'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <ShoppingBag size={12} />
                <span>Online</span>
                <span className="bg-sunken text-ink-muted text-[10px] px-1.5 py-0.2 rounded-full font-black tabular-nums">{onlineCount}</span>
              </button>
            </div>

            {/* Settings Button */}
            <button
              type="button"
              onClick={onOpenSettings}
              title="Stage Notification Dot Settings"
              className="h-9.5 w-9.5 rounded-lg bg-canvas border border-line text-ink-muted hover:text-ink hover:bg-surface flex items-center justify-center transition-all shadow-2xs shrink-0 active:scale-95 cursor-pointer"
            >
              <SlidersHorizontal size={15} />
            </button>
          </div>

          {/* Design Origin Filters */}
          <div className="h-9.5 flex items-center gap-1 p-1 bg-canvas border border-line rounded-lg shrink-0 overflow-x-auto hide-scrollbar">
            <button
              type="button"
              onClick={() => setDesignOriginFilter('all')}
              className={`h-7 px-2.5 rounded-md text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                designOriginFilter === 'all'
                  ? 'bg-surface text-ink shadow-xs border border-line/80'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <span>All</span>
              <span className="bg-sunken text-ink-muted text-[9px] px-1 py-0.2 rounded-full font-black tabular-nums">{totalJobsCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setDesignOriginFilter('catalog')}
              className={`h-7 px-2.5 rounded-md text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                designOriginFilter === 'catalog'
                  ? 'bg-surface text-ink shadow-xs border border-line/80'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Sparkles size={11} className="text-taupe" />
              <span>Catalog</span>
              <span className="bg-sunken text-ink-muted text-[9px] px-1 py-0.2 rounded-full font-black tabular-nums">{catalogJobsCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setDesignOriginFilter('custom')}
              className={`h-7 px-2.5 rounded-md text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                designOriginFilter === 'custom'
                  ? 'bg-surface text-ink shadow-xs border border-line/80'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Scissors size={11} />
              <span>Custom</span>
              <span className="bg-sunken text-ink-muted text-[9px] px-1 py-0.2 rounded-full font-black tabular-nums">{customBespokeCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setDesignOriginFilter('alteration')}
              className={`h-7 px-2.5 rounded-md text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                designOriginFilter === 'alteration'
                  ? 'bg-surface text-ink shadow-xs border border-line/80'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Shirt size={11} />
              <span>Alterations</span>
              <span className="bg-sunken text-ink-muted text-[9px] px-1 py-0.2 rounded-full font-black tabular-nums">{alterationJobsCount}</span>
            </button>
          </div>

          {/* Icon-Only Stage Filters */}
          <div className="h-11 sm:h-9.5 flex items-center gap-1.5 sm:gap-1 p-1 bg-canvas border border-line rounded-xl sm:rounded-lg overflow-x-auto hide-scrollbar w-full sm:w-auto touch-pan-x">
            {stageIconFilters.map((stage) => {
              const Icon = stage.icon;
              const isSelected = stageFilter === stage.id;

              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => {
                    setStageFilter(stage.id);
                    if (stage.id !== 'all') {
                      const el = document.getElementById(`kanban-col-${stage.id}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }
                  }}
                  title={stage.title}
                  className={`relative min-w-[38px] h-9 sm:min-w-8 sm:h-7 rounded-lg sm:rounded-md flex items-center justify-center transition-all shrink-0 active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'bg-surface text-ink shadow-xs border border-line/90 font-bold'
                      : 'text-ink-muted hover:text-ink hover:bg-surface/50'
                  }`}
                >
                  <Icon size={16} className={`transition-colors ${stage.iconColor ?? ''}`} />
                  {stage.dotColor && (
                    <span className={`absolute top-1 right-1 w-2 h-2 sm:w-1.5 sm:h-1.5 rounded-full ${stage.dotColor} ring-1.5 ring-white`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Input */}
        <div className="w-full lg:w-60 shrink-0">
          <SearchInput value={search} onChange={setSearch} placeholder="Search order or customer..." className="w-full" />
        </div>
      </div>

      {tab === 'online' && (
        <div className="px-4 py-2 bg-canvas/40 border-b border-line flex items-center gap-2 text-xs text-ink-muted">
          <Truck size={13} />
          <span>Online production flow: <strong>{activeColumns.map((c) => c.title).join(' → ')}</strong>.</span>
        </div>
      )}

      {tab === 'walk_in' && (
        <div className="px-4 py-2 bg-canvas/40 border-b border-line flex items-center gap-2 text-xs text-ink-muted">
          <Scissors size={13} />
          <span>Walk-in production flow: <strong>{activeColumns.map((c) => c.title).join(' → ')}</strong>.</span>
        </div>
      )}
    </>
  );
}
