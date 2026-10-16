import React from 'react';
import { RotateCcw } from 'lucide-react';
import SearchInput from '@/components/shared/SearchInput';
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

const select = 'h-11 w-full sm:w-auto rounded-lg border border-line-strong bg-white px-2.5 sm:px-3 text-base sm:text-sm text-ink focus:border-taupe focus:outline-none truncate';

/** Responsive toolbar: Search + Switcher on top, compact filters below (2x2 grid on mobile, inline on tablet/desktop) */
export default function AppointmentToolbar(p: AppointmentToolbarProps) {
  return (
    <div className="border-b border-line bg-canvas/30 p-3 sm:p-4">
      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center">
        {/* Row 1 on mobile/tablet: Search input + View switcher */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <SearchInput
            value={p.search}
            onChange={p.onSearch}
            onCanvasBackground
            placeholder="Search name, phone, number (A-0042) or service"
            className="min-w-0 flex-1 [&_input]:h-11 [&_input]:border-line-strong [&_input]:shadow-2xs [&_input]:text-base sm:[&_input]:text-sm"
          />
          <div className="shrink-0 xl:hidden">{p.viewSwitcher}</div>
        </div>

        {/* Filter controls: 2x2 grid on mobile (<640px), flex row on tablet & desktop */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <select aria-label="Status" value={p.status} onChange={(e) => p.onStatus(e.target.value as StatusChoice)} className={`${select} sm:w-auto`}>
            {CHIPS.map((c) => <option key={c.id} value={c.id}>{c.id === 'all' ? `All statuses (${p.counts.all})` : `${c.label} (${p.counts[c.id]})`}</option>)}
          </select>

          <select aria-label="Visit type" value={p.type} onChange={(e) => p.onType(e.target.value as AppointmentType | 'all')} className={`${select} sm:w-auto`}>
            <option value="all">All visit types</option>
            {APPOINTMENT_TYPES.map((t) => <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>)}
          </select>

          <select aria-label="Date" value={p.when} onChange={(e) => p.onWhen(e.target.value as WhenChoice)} className={`${select} sm:w-auto`}>
            <option value="any">Any date</option>
            <option value="today">Today</option>
            <option value="upcoming">Today and coming up</option>
            <option value="past">Past</option>
          </select>

          <button
            type="button"
            aria-pressed={p.mine}
            onClick={() => p.onMine(!p.mine)}
            className={`h-11 shrink-0 whitespace-nowrap rounded-lg border px-3 sm:px-4 text-xs sm:text-sm font-semibold transition-colors ${
              p.mine ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white text-ink-body hover:bg-canvas'
            }`}
          >
            Assigned to me
          </button>

          {p.hasFilters && (
            <button
              type="button"
              onClick={p.onReset}
              className="col-span-2 sm:col-span-1 flex h-11 shrink-0 items-center justify-center gap-1.5 px-3 text-xs sm:text-sm font-semibold text-taupe hover:underline"
            >
              <RotateCcw size={14} /> Clear
            </button>
          )}
        </div>

        {/* View switcher on large screens (xl+) */}
        <div className="hidden xl:block shrink-0 ml-auto">{p.viewSwitcher}</div>
      </div>
    </div>
  );
}
