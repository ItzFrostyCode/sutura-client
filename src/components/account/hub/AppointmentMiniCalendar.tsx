import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WEEKDAYS, type HubCalendar } from './accountTypes';

/** One month at a glance (‹ › to move between months): today in a filled circle, a dot under every day with an appointment. */
export default function AppointmentMiniCalendar({ calendar }: { readonly calendar: HubCalendar }) {
  const { cells, monthLabel, isCurrentMonth, onPrev, onNext, onToday } = calendar;
  const arrow = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-sunken hover:text-ink';
  return (
    <div className="mt-3 rounded-2xl border border-line bg-surface p-2">
      <div className="flex items-center justify-between gap-1 pb-1">
        <button type="button" onClick={onPrev} aria-label="Previous month" className={arrow}><ChevronLeft size={18} /></button>
        <div className="flex min-w-0 items-center gap-2">
          <span className="mobile-h4 truncate text-ink" aria-live="polite">{monthLabel}</span>
          {!isCurrentMonth && (
            <button type="button" onClick={onToday} className="shrink-0 rounded-full bg-sunken px-2.5 py-1 text-[11px] font-semibold text-taupe-dark transition-opacity active:opacity-70">
              Today
            </button>
          )}
        </div>
        <button type="button" onClick={onNext} aria-label="Next month" className={arrow}><ChevronRight size={18} /></button>
      </div>
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((w, i) => (
          <div key={`${w}-${i}`} className="py-1.5 text-center text-[10px] font-semibold text-ink-faint">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((c) => (
          <div key={c.key} className="flex h-9 flex-col items-center justify-center">
            {c.num && (
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] ${c.isToday ? 'bg-taupe font-semibold text-white' : c.isPast ? 'text-ink-faint' : 'text-ink'}`}>
                {c.num}
              </span>
            )}
            {c.hasAppt && <span className="mt-0.5 h-1 w-1 rounded-full bg-taupe" />}
          </div>
        ))}
      </div>
    </div>
  );
}
