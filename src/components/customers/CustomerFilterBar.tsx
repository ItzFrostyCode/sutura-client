import React from 'react';
import { Search, X } from 'lucide-react';

interface CustomerFilterBarProps {
  readonly filterType: 'all' | 'online' | 'walkin';
  readonly setFilterType: (val: 'all' | 'online' | 'walkin') => void;
  readonly search: string;
  readonly setSearch: (val: string) => void;
  readonly totalCount: number;
  readonly onlineCount: number;
  readonly walkinCount: number;
}

export default function CustomerFilterBar({
  filterType,
  setFilterType,
  search,
  setSearch,
  totalCount,
  onlineCount,
  walkinCount,
}: CustomerFilterBarProps) {
  const tabs = [
    { id: 'all' as const, label: 'All Clients', count: totalCount },
    { id: 'online' as const, label: 'Online Clients', count: onlineCount },
    { id: 'walkin' as const, label: 'Walk-in Clients', count: walkinCount },
  ];

  return (
    <div className="p-4 sm:p-5 border-b border-line flex flex-col md:flex-row md:items-center justify-between gap-4 bg-canvas/30">
      {/* Channel Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 md:pb-0">
        {tabs.map((tab) => {
          const isActive = filterType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-taupe text-white shadow-2xs'
                  : 'bg-surface border border-line text-ink-muted hover:text-ink hover:bg-canvas'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-canvas text-ink-faint'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Box */}
      <div className="relative w-full md:w-80 shrink-0">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" size={16} />
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-8 py-2 bg-surface border border-line rounded-xl text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe shadow-2xs"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink p-0.5 cursor-pointer"
          >
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
