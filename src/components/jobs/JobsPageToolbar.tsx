'use client';

import React, { useState } from 'react';
import {
  Store,
  ShoppingBag,
  SlidersHorizontal,
  Search,
  LayoutGrid,
  List,
  Columns2,
  ChevronDown,
  Sparkles,
  Scissors,
  Shirt,
  UserCheck,
  Bell,
  RefreshCw,
  X,
} from 'lucide-react';

interface JobsPageToolbarProps {
  tab: 'all' | 'walk_in' | 'online';
  setTab: (tab: 'all' | 'walk_in' | 'online') => void;
  totalJobsCount: number;
  walkInCount: number;
  onlineCount: number;
  search: string;
  setSearch: (val: string) => void;
  viewMode: 'kanban' | 'list' | 'columns';
  setViewMode: (mode: 'kanban' | 'list' | 'columns') => void;
  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
  designOriginFilter: 'all' | 'catalog' | 'custom' | 'alteration';
  setDesignOriginFilter: (val: 'all' | 'catalog' | 'custom' | 'alteration') => void;
  catalogJobsCount: number;
  customBespokeCount: number;
  alterationJobsCount: number;
  showMyJobsToggle?: boolean;
  myJobsOnly?: boolean;
  setMyJobsOnly?: (val: boolean) => void;
  onOpenSettings?: () => void;
  onRefresh?: () => void;
}

export default function JobsPageToolbar({
  tab,
  setTab,
  totalJobsCount,
  walkInCount,
  onlineCount,
  search,
  setSearch,
  viewMode,
  setViewMode,
  showFilters,
  setShowFilters,
  designOriginFilter,
  setDesignOriginFilter,
  catalogJobsCount,
  customBespokeCount,
  alterationJobsCount,
  showMyJobsToggle = false,
  myJobsOnly = false,
  setMyJobsOnly,
  onOpenSettings,
  onRefresh,
}: JobsPageToolbarProps) {
  const [toolsOpen, setToolsOpen] = useState(false);

  const hasActiveFilters = designOriginFilter !== 'all' || myJobsOnly;

  return (
    <div className="p-4 sm:p-5 border-b border-line/60 bg-surface/50 space-y-3.5">
      {/* Row 1: Intake Channels (Left) & Filters Button (Right) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Channel Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#f4efe9] border border-line/60 rounded-xl">
          <button
            type="button"
            onClick={() => setTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              tab === 'all'
                ? 'bg-surface text-ink shadow-2xs font-bold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <span>All Orders</span>
            <span className="text-[11px] font-normal text-ink-muted/80 tabular-nums">
              {totalJobsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab('walk_in')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              tab === 'walk_in'
                ? 'bg-surface text-ink shadow-2xs font-bold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Store size={13} className="text-ink-muted" />
            <span>Walk-in</span>
            <span className="text-[11px] font-normal text-ink-muted/80 tabular-nums">
              {walkInCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab('online')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              tab === 'online'
                ? 'bg-surface text-ink shadow-2xs font-bold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <ShoppingBag size={13} className="text-ink-muted" />
            <span>Online</span>
            <span className="text-[11px] font-normal text-ink-muted/80 tabular-nums">
              {onlineCount}
            </span>
          </button>
        </div>

        {/* Filters Button */}
        <button
          type="button"
          onClick={() => setShowFilters((prev) => !prev)}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border-2 transition-all cursor-pointer shadow-2xs ${
            showFilters || hasActiveFilters
              ? 'border-ink bg-ink text-white'
              : 'border-ink bg-[#f4efe9] text-ink hover:bg-canvas'
          }`}
        >
          <SlidersHorizontal size={14} className="stroke-[2.5]" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>
      </div>

      {/* Row 2: Tools (Left) & Search + View Switcher (Right) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Tools Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setToolsOpen((prev) => !prev)}
            className="px-3.5 py-2 bg-[#f4efe9] hover:bg-canvas border border-line rounded-xl text-xs font-semibold text-ink flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <span>Tools</span>
            <ChevronDown size={14} className="text-ink-muted" />
          </button>

          {toolsOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setToolsOpen(false)}
              />
              <div className="absolute left-0 mt-1.5 w-52 bg-surface border border-line rounded-xl shadow-lg p-1.5 z-30 space-y-0.5">
                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenSettings();
                      setToolsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-ink hover:bg-canvas flex items-center gap-2 cursor-pointer"
                  >
                    <Bell size={14} className="text-taupe" />
                    <span>Notification Settings</span>
                  </button>
                )}
                {onRefresh && (
                  <button
                    type="button"
                    onClick={() => {
                      onRefresh();
                      setToolsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-ink hover:bg-canvas flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw size={14} className="text-taupe" />
                    <span>Refresh Orders</span>
                  </button>
                )}
                {showMyJobsToggle && setMyJobsOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      setMyJobsOnly(!myJobsOnly);
                      setToolsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-ink hover:bg-canvas flex items-center gap-2 cursor-pointer"
                  >
                    <UserCheck size={14} className="text-taupe" />
                    <span>{myJobsOnly ? 'Show All Jobs' : 'Only My Jobs'}</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right side: Search Input + View Mode Switcher */}
        <div className="flex items-center gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted/70 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order or customer..."
              className="h-9.5 pl-9 pr-3.5 bg-canvas/40 border border-line rounded-xl text-xs text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe w-60 sm:w-72 shadow-2xs transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* View Switcher: Kanban | List | Split */}
          <div className="flex items-center p-0.5 bg-[#f4efe9] border border-line rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              title="Kanban Board View"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-surface text-ink shadow-2xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title="Table List View"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-surface text-ink shadow-2xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <List size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('columns')}
              title="Columns View"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'columns'
                  ? 'bg-surface text-ink shadow-2xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Columns2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Filter Drawer */}
      {showFilters && (
        <div className="pt-2 border-t border-line/60 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mr-1">
              Order Type:
            </span>
            <button
              type="button"
              onClick={() => setDesignOriginFilter('all')}
              className={`h-7 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                designOriginFilter === 'all'
                  ? 'bg-ink text-white'
                  : 'bg-surface border border-line text-ink-muted hover:text-ink'
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => setDesignOriginFilter('catalog')}
              className={`h-7 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                designOriginFilter === 'catalog'
                  ? 'bg-taupe text-white'
                  : 'bg-surface border border-line text-ink-muted hover:text-ink'
              }`}
            >
              <Sparkles size={12} />
              <span>Catalog ({catalogJobsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setDesignOriginFilter('custom')}
              className={`h-7 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                designOriginFilter === 'custom'
                  ? 'bg-taupe text-white'
                  : 'bg-surface border border-line text-ink-muted hover:text-ink'
              }`}
            >
              <Scissors size={12} />
              <span>Custom ({customBespokeCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setDesignOriginFilter('alteration')}
              className={`h-7 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                designOriginFilter === 'alteration'
                  ? 'bg-taupe text-white'
                  : 'bg-surface border border-line text-ink-muted hover:text-ink'
              }`}
            >
              <Shirt size={12} />
              <span>Alterations ({alterationJobsCount})</span>
            </button>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setDesignOriginFilter('all');
                if (setMyJobsOnly) setMyJobsOnly(false);
              }}
              className="text-xs font-semibold text-taupe hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X size={12} />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
