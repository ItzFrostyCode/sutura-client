import { Plus } from 'lucide-react';
import type { Appointment } from '../appointmentHelpers';
import AgendaCard, { type AgendaActions } from './AgendaCard';
import CalendarHeader from './CalendarHeader';
import { dayKey, dotsFor, monthGrid } from './calendarHelpers';

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** The calendar on a phone (Stitch mobile calendar): a compact month with a dot under the busy days, and the chosen day's cards right below it. */
export default function PhoneCalendar({ byDay, currentDate, setCurrentDate, selectedDay, setSelectedDay, actions, onAddClick, onToday }: Readonly<{
  byDay: Map<string, Appointment[]>; currentDate: Date; setCurrentDate: (d: Date) => void; selectedDay: Date | null; setSelectedDay: (d: Date) => void;
  actions: AgendaActions; onAddClick: (dayStr: string, time: string) => void; onToday: () => void;
}>) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayKey = dayKey(new Date());
  const chosen = selectedDay ?? new Date();
  const chosenKey = dayKey(chosen);
  const events = (byDay.get(chosenKey) ?? []);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-line bg-white p-4 shadow-[0_1px_3px_rgba(43,30,26,0.03)]">
        <CalendarHeader
          title={currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          onToday={onToday}
          onPrev={() => setCurrentDate(new Date(year, month - 1, 1))} onNext={() => setCurrentDate(new Date(year, month + 1, 1))}
          prevLabel="Previous month" nextLabel="Next month"
        />
        <div className="mt-3 grid grid-cols-7 text-center text-[11px] font-semibold text-ink-faint">{WEEK.map((d, i) => <span key={i} className="py-1">{d}</span>)}</div>
        <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
          {monthGrid(year, month).map(({ date, inMonth }) => {
            const key = dayKey(date);
            if (!inMonth) return <span key={key} className="flex h-11 items-center justify-center text-ink-faint/50">{date.getDate()}</span>;
            const selected = key === chosenKey;
            const dots = dotsFor((byDay.get(key) ?? []));
            return (
              <button key={key} type="button" onClick={() => setSelectedDay(date)} aria-label={date.toDateString()} aria-pressed={selected} className="flex h-11 cursor-pointer flex-col items-center justify-center rounded-lg hover:bg-sunken">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full ${selected ? 'bg-espresso font-semibold text-white' : key === todayKey ? 'font-semibold text-taupe ring-1 ring-taupe/50' : 'font-medium text-ink'}`}>{date.getDate()}</span>
                <span className="mt-0.5 flex h-1 items-center gap-0.5">{dots.map((c) => <span key={c} className={`h-1 w-1 rounded-full ${c}`} />)}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-ink">{chosen.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
            <p className="text-[13px] text-ink-muted">{events.length === 0 ? 'Nothing booked' : `${events.length} ${events.length === 1 ? 'appointment' : 'appointments'}`}</p>
          </div>
          {actions.isOwnerOrManager && chosenKey >= todayKey && (
            <button type="button" onClick={() => onAddClick(chosenKey, '09:00')} className="flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-espresso px-3 text-[13px] font-medium text-white hover:bg-espresso/90"><Plus size={15} />Visit</button>
          )}
        </div>
        {events.length === 0
          ? <p className="rounded-xl border border-dashed border-line-strong bg-white/60 px-4 py-8 text-center text-sm text-ink-muted">{chosenKey < todayKey ? 'No appointments were recorded on this day.' : 'This day is open for a visit.'}</p>
          : events.map((a) => <AgendaCard key={a.id} apt={a} actions={actions} />)}
      </section>
    </div>
  );
}
