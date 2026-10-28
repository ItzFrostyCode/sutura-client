import React from 'react';
import SearchInput from '@/components/shared/SearchInput';
import ScrollNav from '@/components/shared/ScrollNav';

interface CustomerFilterBarProps {
  readonly filterType: 'all' | 'online' | 'walkin';
  readonly setFilterType: (val: 'all' | 'online' | 'walkin') => void;
  readonly search: string;
  readonly setSearch: (val: string) => void;
  readonly totalCount: number;
  readonly onlineCount: number;
  readonly walkinCount: number;
  // Staff can narrow the book to the customers they personally work with.
  readonly showMineToggle?: boolean;
  readonly mineOnly?: boolean;
  readonly setMineOnly?: (val: boolean) => void;
}

const CHIP = 'flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-4 text-[13px] font-medium transition-colors';
const chip = (on: boolean) => `${CHIP} ${on ? 'border-ink bg-ink text-white' : 'border-espresso/[0.12] bg-white text-ink-body hover:bg-espresso/[0.03]'}`;

/** The channel tabs and the search sit on the canvas above the table card — the same place Appointments and Job Orders keep their toolbars, not inside the card. */
export default function CustomerFilterBar({
  filterType,
  setFilterType,
  search,
  setSearch,
  totalCount,
  onlineCount,
  walkinCount,
  showMineToggle = false,
  mineOnly = false,
  setMineOnly,
}: CustomerFilterBarProps) {
  const tabs = [
    { id: 'all' as const, label: 'All Clients', count: totalCount },
    { id: 'online' as const, label: 'Online Clients', count: onlineCount },
    { id: 'walkin' as const, label: 'Walk-in Clients', count: walkinCount },
  ];

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Channel tabs */}
      <ScrollNav role="group" aria-label="Client channel" fade="canvas" className="flex items-center gap-2">
        {tabs.map((tab) => {
          const isActive = filterType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setFilterType(tab.id)}
              className={chip(isActive)}
            >
              {tab.label}
              <span className={`text-xs ${isActive ? 'text-white/60' : 'text-ink-faint'}`}>{tab.count}</span>
            </button>
          );
        })}
        {showMineToggle && setMineOnly && (
          <button
            type="button"
            aria-pressed={mineOnly}
            onClick={() => setMineOnly(!mineOnly)}
            className={chip(mineOnly)}
          >
            My customers
          </button>
        )}
      </ScrollNav>

      {/* Search */}
      <div className="min-w-0 basis-full sm:basis-auto sm:min-w-[240px] sm:max-w-sm sm:flex-1 lg:flex-none lg:w-80">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, or phone…" className="w-full" onCanvasBackground />
      </div>
    </div>
  );
}
