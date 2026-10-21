import { Globe } from 'lucide-react';
import type { Appointment } from '../appointmentHelpers';
import CalendarHeader from './CalendarHeader';
import { dayKey, dotsFor, hhmm, monthGrid } from './calendarHelpers';

const WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MAX_PILLS = 2;

/** The month on a desktop or tablet (Stitch "calendar board"): a white card, a hairline grid, small appointment pills in each day. */
export default function MonthBoard({ byDay, currentDate, setCurrentDate, onPickDay, onToday }: Readonly<{
  byDay: Map<string, Appointment[]>; currentDate: Date; setCurrentDate: (d: Date) => void; onPickDay: (d: Date) => void; onToday: () => void;
}>) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayKey = dayKey(new Date());

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_3px_rgba(43,30,26,0.04),0_4px_12px_rgba(43,30,26,0.02)]">
      <CalendarHeader
        title={currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        onToday={onToday}
        onPrev={() => setCurrentDate(new Date(year, month - 1, 1))} onNext={() => setCurrentDate(new Date(year, month + 1, 1))}
        prevLabel="Previous month" nextLabel="Next month"
      />
      <div className="overflow-hidden rounded-xl border border-line">
        <div className="grid grid-cols-7 border-b border-line bg-sunken/50 py-2.5 text-center text-[10px] font-semibold tracking-wider text-ink-muted">
          {WEEK.map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 divide-x divide-y divide-line/70 text-xs [&>*:nth-child(-n+7)]:border-t-0">
          {monthGrid(year, month).map(({ date, inMonth }) => {
            if (!inMonth) return <div key={date.toISOString()} className="min-h-[104px] bg-canvas/60" />;
            const key = dayKey(date);
            const events = (byDay.get(key) ?? []);
            const today = key === todayKey;
            const waiting = events.some((a) => a.status === 'pending');
            return (
              <button
                key={key} type="button" onClick={() => onPickDay(date)}
                className={`flex min-h-[104px] cursor-pointer flex-col gap-1 p-2 text-left transition-colors hover:bg-sunken/50 ${waiting ? 'bg-amber-50/60 ring-1 ring-inset ring-amber-300/50' : ''}`}
              >
                <span className="flex items-center justify-between">
                  {today
                    ? <span className="flex h-5 w-5 items-center justify-center rounded-full bg-espresso text-[11px] font-semibold text-white">{date.getDate()}</span>
                    : <span className={`font-medium ${key < todayKey ? 'text-ink-muted' : 'text-ink'}`}>{date.getDate()}</span>}
                  <span className="flex items-center gap-1">{dotsFor(events).map((c) => <span key={c} className={`h-1.5 w-1.5 rounded-full ${c}`} />)}</span>
                </span>
                {events.slice(0, MAX_PILLS).map((a) => (
                  <span key={a.id} className="flex items-center justify-between gap-1 rounded border border-line bg-sunken px-1.5 py-0.5 text-[10px] text-ink">
                    <span className="truncate font-medium">{hhmm(a)} {a.customer?.name?.split(' ')[0] || 'Client'}</span>
                    {a.intake_channel === 'online' && <Globe size={9} className="shrink-0 text-ink-muted" />}
                  </span>
                ))}
                {events.length > MAX_PILLS && <span className="pl-0.5 text-[9px] font-semibold text-ink-muted">+{events.length - MAX_PILLS} more</span>}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
