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

export default function AppointmentsCalendarView({
  monthLabel,
  calMonth,
  setCalMonth,
  selectedDay,
  setSelectedDay,
  cells,
}: Readonly<AppointmentsCalendarViewProps>) {
  const handlePrevMonth = () => {
    const d = new Date(calMonth);
    d.setMonth(d.getMonth() - 1);
    setCalMonth(d);
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    const d = new Date(calMonth);
    d.setMonth(d.getMonth() + 1);
    setCalMonth(d);
    setSelectedDay(null);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="mobile-h3 font-semibold text-ink">{monthLabel}</p>
        <div className="flex border border-line overflow-hidden">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="touch-target-44 w-10 h-9 flex items-center justify-center text-ink-muted border-r border-line hover:bg-sunken transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="touch-target-44 w-10 h-9 flex items-center justify-center text-ink-muted hover:bg-sunken transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="border border-line overflow-hidden bg-surface">
        <div className="grid grid-cols-7 bg-canvas">
          {WEEKDAYS.map((w, i) => (
            <div key={`${w}-${i}`} className="text-center text-[10px] font-semibold tracking-wide text-ink-faint py-2">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((c) => (
            <button
              key={c.key}
              type="button"
              disabled={!c.num}
              onClick={() => c.num && setSelectedDay(c.key === selectedDay ? null : c.key)}
              className={`h-12 flex flex-col items-center justify-center border-t border-line transition-colors ${
                c.isToday ? 'bg-amber-50/50' : c.isPast ? 'bg-canvas/40' : 'bg-surface'
              } ${selectedDay === c.key ? 'ring-2 ring-inset ring-taupe' : ''}`}
            >
              {c.num && (
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-normal ${
                  c.isToday ? 'bg-taupe text-white font-semibold' : c.isPast ? 'text-ink-faint' : 'text-ink'
                }`}>
                  {c.num}
                </span>
              )}
              {c.count > 0 && <span className="w-1.5 h-1.5 rounded-full bg-taupe mt-0.5" />}
            </button>
          ))}
        </div>
      </div>

      {!selectedDay && (
        <p className="mobile-caption text-ink-faint text-center mt-3 font-normal">
          Tap a day to see your appointments.
        </p>
      )}
    </div>
  );
}
