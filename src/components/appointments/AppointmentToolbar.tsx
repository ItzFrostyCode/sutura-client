import React from 'react';
import { ChevronDown, RotateCcw, Search, X } from 'lucide-react';
import { APPOINTMENT_TYPES, TYPE_CONFIG, type AppointmentType } from './appointmentHelpers';

export type StatusChoice = 'all' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'closed';
export type WhenChoice = 'any' | 'today' | 'upcoming' | 'past';

interface AppointmentToolbarProps {
  readonly search: string;
  readonly onSearch: (v: string) => void;
  readonly status: string;
  readonly onStatus: (v: StatusChoice) => void;
  readonly type: AppointmentType | 'all';
  readonly onType: (v: AppointmentType | 'all') => void;
  readonly when: WhenChoice;
  readonly onWhen: (v: WhenChoice) => void;
  readonly mine: boolean;
  readonly onMine: (v: boolean) => void;
  readonly counts: Record<StatusChoice, number>;
  readonly viewSwitcher: React.ReactNode;
  readonly onReset: () => void;
  readonly hasFilters: boolean;
}

const CHIPS: { id: StatusChoice; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Waiting for approval' },
  { id: 'confirmed', label: 'Approved' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'completed', label: 'Done' },
  { id: 'closed', label: 'Cancelled / No-show' },
];

const STATUS_SHORT: Record<StatusChoice, string> = { all: 'All', pending: 'Waiting', confirmed: 'Approved', in_progress: 'Active', completed: 'Done', closed: 'Closed' };
const WHEN_SHORT: Record<WhenChoice, string> = { any: 'Any date', today: 'Today', upcoming: 'Upcoming', past: 'Past' };

/**
 * A filter shown as a capsule: the text on it is ours (so it always fits: the short wording while the row is narrow,
 * the full wording from 640px), and the real <select> lies invisibly on top so a tap still opens the native picker.
 */
function FilterCapsule({ label, short, full, value, onChange, children }: Readonly<{ label: string; short: string; full: string; value: string; onChange: (v: string) => void; children: React.ReactNode }>) {
  return (
    <label className="relative flex h-11 min-w-0 cursor-pointer items-center justify-between gap-1.5 rounded-full border border-line-strong bg-white px-3.5 text-ink shadow-2xs focus-within:border-espresso lg:min-w-[10rem] lg:rounded-xl">
      <span className="truncate text-[13px] font-medium sm:text-sm sm:font-normal"><span className="sm:hidden">{short}</span><span className="hidden sm:inline">{full}</span></span>
      <ChevronDown size={15} className="shrink-0 text-ink-faint" />
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer text-base opacity-0">
        {children}
      </select>
    </label>
  );
}

/** Search on the left; the three filters and the view switcher on the right. No box around them: they sit on the canvas above the table card. */
export default function AppointmentToolbar(p: AppointmentToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-2 lg:min-w-0 lg:flex-1 lg:max-w-[560px]">
      <div className="relative min-w-0 flex-1">
        <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          type="search"
          value={p.search}
          onChange={(e) => p.onSearch(e.target.value)}
          placeholder="Search name or ID…"
          aria-label="Search appointments"
          className="h-11 w-full rounded-xl border border-line-strong bg-white pl-10 pr-10 text-base text-ink shadow-2xs placeholder:text-ink-faint focus:border-espresso focus:outline-none sm:text-sm [&::-webkit-search-cancel-button]:hidden"
        />
        {p.search && (
          <button type="button" onClick={() => p.onSearch('')} aria-label="Clear search" className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-ink-faint hover:text-ink">
            <X size={16} />
          </button>
        )}
      </div>
      {/* Below lg the switcher sits beside the search, so it never drops onto a line of its own. */}
      <div className="shrink-0 lg:hidden">{p.viewSwitcher}</div>
      </div>

      <div className="grid grid-cols-3 items-center gap-2 lg:flex">
        <FilterCapsule
          label="Status" value={p.status} onChange={(v) => p.onStatus(v as StatusChoice)}
          short={`${STATUS_SHORT[p.status as StatusChoice] ?? 'All'} (${p.counts[p.status as StatusChoice] ?? p.counts.all})`}
          full={p.status === 'all' ? `All statuses (${p.counts.all})` : `${CHIPS.find((c) => c.id === p.status)?.label ?? ''} (${p.counts[p.status as StatusChoice]})`}
        >
          {CHIPS.map((c) => <option key={c.id} value={c.id}>{c.id === 'all' ? `All statuses (${p.counts.all})` : `${c.label} (${p.counts[c.id]})`}</option>)}
        </FilterCapsule>

        <FilterCapsule
          label="Visit type" value={p.type} onChange={(v) => p.onType(v as AppointmentType | 'all')}
          short={p.type === 'all' ? 'All types' : TYPE_CONFIG[p.type].label}
          full={p.type === 'all' ? 'All visit types' : TYPE_CONFIG[p.type].label}
        >
          <option value="all">All visit types</option>
          {APPOINTMENT_TYPES.map((t) => <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>)}
        </FilterCapsule>

        <FilterCapsule
          label="Date" value={p.when} onChange={(v) => p.onWhen(v as WhenChoice)}
          short={WHEN_SHORT[p.when]}
          full={{ any: 'Any date', today: 'Today', upcoming: 'Today and coming up', past: 'Past' }[p.when]}
        >
          <option value="any">Any date</option>
          <option value="today">Today</option>
          <option value="upcoming">Today and coming up</option>
          <option value="past">Past</option>
        </FilterCapsule>

        {p.hasFilters && (
          <button type="button" onClick={p.onReset} className="col-span-3 flex h-9 cursor-pointer items-center justify-end gap-1.5 text-sm font-medium text-ink-muted hover:text-ink lg:col-auto lg:h-11 lg:px-2">
            <RotateCcw size={14} /> Clear
          </button>
        )}

        <div className="col-span-3 hidden shrink-0 lg:col-auto lg:ml-2 lg:block">{p.viewSwitcher}</div>
      </div>
    </div>
  );
}
