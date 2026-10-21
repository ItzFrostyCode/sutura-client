import { AlertCircle, CheckCircle2, Clock, Scissors } from 'lucide-react';

interface Stats { todayCount: number; pendingCount: number; activeCount: number; completedCount: number }
type Status = 'all' | 'pending' | 'confirmed' | 'completed';

function Kpi({ label, value, note, icon, noteClass, active, onClick, loading }: Readonly<{ label: string; value: number; note: string; icon: React.ReactNode; noteClass: string; active?: boolean; onClick: () => void; loading?: boolean }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[100px] cursor-pointer flex-col justify-between rounded-xl border bg-white p-4 text-left sm:min-h-[116px] sm:rounded-2xl sm:p-5 shadow-[0_1px_3px_rgba(43,30,26,0.04),0_4px_12px_rgba(43,30,26,0.02)] transition-shadow hover:shadow-md ${active ? 'border-espresso/40 ring-1 ring-espresso/30' : 'border-line'}`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{label}</span>
        {icon}
      </span>
      <span className="mt-3 flex items-baseline gap-1.5 sm:mt-4 sm:justify-between sm:gap-2">
        {loading ? <span className="h-[30px] w-10 animate-pulse rounded-md bg-sunken" /> : <span className="text-3xl font-semibold leading-none text-ink tabular-nums">{value}</span>}
        <span className={`text-[11px] font-medium ${noteClass}`}>{note}</span>
      </span>
    </button>
  );
}

/** The four counts across the top of Appointments (Stitch "bento metric capsules"); each one filters the list. */
export default function AppointmentKpis({ stats, status, onStatus, onToday, loading = false }: Readonly<{ stats: Stats; status: string; onStatus: (s: Status) => void; onToday: () => void; loading?: boolean }>) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <Kpi loading={loading} label="Today" value={stats.todayCount} note="scheduled" noteClass="text-ink-muted" icon={<Clock size={17} className="text-ink-faint" />} onClick={onToday} />
      <Kpi loading={loading} label="Waiting for approval" value={stats.pendingCount} note="pending review" noteClass="text-amber-600" icon={<AlertCircle size={17} className={stats.pendingCount > 0 ? 'text-amber-600' : 'text-ink-faint'} />} active={status === 'pending'} onClick={() => onStatus('pending')} />
      <Kpi loading={loading} label="Approved & in progress" value={stats.activeCount} note="active sessions" noteClass="text-ink-muted" icon={<Scissors size={17} className="text-ink-faint" />} active={status === 'confirmed'} onClick={() => onStatus('confirmed')} />
      <Kpi loading={loading} label="Done" value={stats.completedCount} note="completed today" noteClass="text-sage" icon={<CheckCircle2 size={17} className="text-sage" />} active={status === 'completed'} onClick={() => onStatus('completed')} />
    </div>
  );
}
