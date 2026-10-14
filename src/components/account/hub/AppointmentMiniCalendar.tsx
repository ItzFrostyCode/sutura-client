import { WEEKDAYS, type CalendarCell } from './accountTypes';

/** This month at a glance: today in a filled circle, a dot under every day with an appointment. */
export default function AppointmentMiniCalendar({ cells }: { readonly cells: CalendarCell[] }) {
  return (
    <div className="mt-3 rounded-2xl bg-sunken p-2">
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
