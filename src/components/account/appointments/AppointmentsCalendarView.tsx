import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type DayCell, WEEKDAYS } from './appointmentTypes';

interface AppointmentsCalendarViewProps {
  monthLabel: string;
  calMonth: Date;
  setCalMonth: (date: Date) => void;
  selectedDay: string | null;
  setSelectedDay: (day: string | null) => void;
  cells: DayCell[];
}

const arrow = 'relative flex h-8 w-11 items-center justify-center text-ink-muted transition-opacity before:absolute before:inset-x-0 before:-inset-y-1.5 active:opacity-60';

export default function AppointmentsCalendarView({
  monthLabel,
  calMonth,
  setCalMonth,
  selectedDay,
  setSelectedDay,
  cells,
}: Readonly<AppointmentsCalendarViewProps>) {
  const goToMonth = (offset: number) => {
    const d = new Date(calMonth);
    d.setMonth(d.getMonth() + offset);
    setCalMonth(d);
    setSelectedDay(null);
  };

  return (
    <div className="mt-3 mb-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="mobile-h4 text-ink">{monthLabel}</p>
        <div className="flex rounded-full bg-sunken">
          <button type="button" onClick={() => goToMonth(-1)} className={arrow} aria-label="Previous month"><ChevronLeft size={18} /></button>
          <button type="button" onClick={() => goToMonth(1)} className={arrow} aria-label="Next month"><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="card-soft p-2">
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((w, i) => (
            <div key={`${w}-${i}`} className="py-2 text-center text-[10px] font-semibold tracking-wide text-ink-faint">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((c) => (
            <button
              key={c.key}
              type="button"
              disabled={!c.num}
              onClick={() => c.num && setSelectedDay(c.key === selectedDay ? null : c.key)}
              className={`flex h-12 flex-col items-center justify-center rounded-xl transition-colors ${selectedDay === c.key ? 'bg-sunken' : ''}`}
            >
              {c.num && (
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] ${c.isToday ? 'bg-taupe font-semibold text-white' : c.isPast ? 'text-ink-faint' : 'text-ink'}`}>
                  {c.num}
                </span>
              )}
              {c.count > 0 && <span className="mt-0.5 h-1 w-1 rounded-full bg-taupe" />}
            </button>
          ))}
        </div>
      </div>

      {!selectedDay && <p className="mobile-caption mt-3 text-center text-ink-faint">Tap a day to see your appointments.</p>}
    </div>
  );
}
