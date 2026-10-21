import { ArrowLeft, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { Appointment } from '../appointmentHelpers';
import AgendaCard, { type AgendaActions } from './AgendaCard';
import { dayKey } from './calendarHelpers';

/** One day on a desktop or tablet: the same cards as on a phone, two across, under a header with the way back to the month. */
export default function DayAgenda({ byDay, day, setDay, onBack, onToday, actions, onAddClick }: Readonly<{
  byDay: Map<string, Appointment[]>; day: Date; setDay: (d: Date) => void; onBack: () => void; onToday: () => void;
  actions: AgendaActions; onAddClick: (dayStr: string, time: string) => void;
}>) {
  const key = dayKey(day);
  const past = key < dayKey(new Date());
  const events = (byDay.get(key) ?? []);
  const step = (n: number) => { const d = new Date(day); d.setDate(d.getDate() + n); setDay(d); };
  const btn = 'flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-line bg-white px-3 text-xs font-medium text-ink hover:bg-sunken';

  return (
    <section className="space-y-5 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_3px_rgba(43,30,26,0.04),0_4px_12px_rgba(43,30,26,0.02)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onBack} className={btn}><ArrowLeft size={14} /> Back to month</button>
          <h2 className="truncate text-xl font-semibold tracking-tight text-ink">{day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onToday} className={btn}>Today</button>
          <div className="flex items-center rounded-lg border border-line">
            <button type="button" onClick={() => step(-1)} aria-label="Previous day" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-l-lg text-ink-muted hover:bg-sunken hover:text-ink"><ChevronLeft size={16} /></button>
            <span className="h-4 w-px bg-line" />
            <button type="button" onClick={() => step(1)} aria-label="Next day" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-r-lg text-ink-muted hover:bg-sunken hover:text-ink"><ChevronRight size={16} /></button>
          </div>
          {actions.isOwnerOrManager && !past && (
            <button type="button" onClick={() => onAddClick(key, '09:00')} className="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg bg-espresso px-3.5 text-xs font-medium text-white hover:bg-espresso/90"><Plus size={14} /> Book a visit</button>
          )}
        </div>
      </div>
      {events.length === 0
        ? <p className="rounded-xl border border-dashed border-line-strong px-4 py-14 text-center text-sm text-ink-muted">{past ? 'No appointments were recorded on this day.' : 'No appointments on this day. It is open for a visit.'}</p>
        : <div className="grid gap-4 lg:grid-cols-2">{events.map((a) => <AgendaCard key={a.id} apt={a} actions={actions} />)}</div>}
    </section>
  );
}
