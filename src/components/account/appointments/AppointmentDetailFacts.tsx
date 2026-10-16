import { CalendarDays, CheckCircle2, Clock, FileText, Link as LinkIcon, MapPin, Wallet } from 'lucide-react';
import type { AppointmentDetailData } from './AppointmentDetailContent';

const row = 'mobile-body-sm flex items-start gap-2.5 text-ink-body';
const icon = 'mt-0.5 shrink-0 text-ink-faint';

/** When, where and the small print: date, time, branch, payment, what to bring, the customer's note and link. */
export default function AppointmentDetailFacts({ appt, scheduled }: { readonly appt: AppointmentDetailData; readonly scheduled: Date }) {
  const bringsOwnFabric = !!appt.notes?.toLowerCase().includes('bring own fabric');
  const sampleDetail = appt.notes?.match(/\[Material:\s*Customer will bring own fabric\/sample(?:\s*-\s*([^\]]+))?\]/i)?.[1]?.trim();

  return (
    <div className="mt-4 space-y-2.5">
      <div className={row}>
        <CalendarDays size={16} className={icon} />
        <span>{scheduled.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
      </div>
      <div className={row}>
        <Clock size={16} className={icon} />
        <span>
          {scheduled.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}
          {appt.duration_minutes ? ` · ${appt.duration_minutes} min` : ''}
        </span>
      </div>
      {appt.branch && (
        <div className={row}>
          <MapPin size={16} className={icon} />
          <span>{appt.branch.name}{appt.branch.address ? `, ${appt.branch.address}` : ''}{appt.branch.city ? `, ${appt.branch.city}` : ''}</span>
        </div>
      )}
      {appt.has_payment && appt.payment_method && (
        <div className={row}>
          <Wallet size={16} className={icon} />
          <span>Payment: {appt.payment_status} · {appt.payment_method}</span>
        </div>
      )}

      {bringsOwnFabric && (
        <div className="rounded-xl bg-sunken p-3">
          <p className="mobile-overline mb-1 text-taupe">What to bring</p>
          <p className="mobile-caption flex items-center gap-1.5 font-semibold text-ink">
            <CheckCircle2 size={14} className="shrink-0 text-sage" /> Your fabric/sample
          </p>
          {sampleDetail && <p className="mobile-caption mt-1 pl-5 text-ink-muted">Note: {sampleDetail}</p>}
        </div>
      )}

      {appt.notes && (
        <div className={row}>
          <FileText size={16} className={icon} />
          <span>{appt.notes}</span>
        </div>
      )}
      {appt.reference_link && (
        <div className={row}>
          <LinkIcon size={16} className={icon} />
          <a href={appt.reference_link} target="_blank" rel="noopener noreferrer" className="truncate text-taupe hover:text-taupe-hover">{appt.reference_link}</a>
        </div>
      )}
    </div>
  );
}
