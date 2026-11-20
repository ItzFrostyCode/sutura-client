import Image from 'next/image';
import { CalendarDays, CheckCircle2, Clock, FileText, Link as LinkIcon, MapPin, Pencil, Wallet } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import type { AppointmentDetailData } from './AppointmentDetailContent';

const row = 'mobile-body-sm flex items-start gap-2.5 text-ink-body';
const icon = 'mt-0.5 shrink-0 text-ink-faint';

interface AppointmentDetailFactsProps {
  readonly appt: AppointmentDetailData;
  readonly scheduled: Date;
  readonly canReschedule: boolean;
  readonly needsNewTime: boolean;
  readonly onReschedule: () => void;
}

/** When, where and the small print: date, time, branch, payment, what to bring, the customer's note, link, and reference photos. */
export default function AppointmentDetailFacts({ appt, scheduled, canReschedule, needsNewTime, onReschedule }: AppointmentDetailFactsProps) {
  const bringsOwnFabric = appt.material_source === 'own';
  const sampleDetail = appt.material_note;
  const timeLabel = scheduled.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="mt-4 space-y-2.5">
      <div className={row}>
        <CalendarDays size={16} className={icon} />
        <span>{scheduled.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
      </div>
      {canReschedule ? (
        <button
          type="button"
          onClick={onReschedule}
          aria-label={needsNewTime ? 'Pick a new time' : 'Change appointment time'}
          className={`w-full flex items-center gap-2.5 rounded-xl px-3 min-h-11 text-left transition-opacity active:opacity-70 cursor-pointer ${needsNewTime ? 'bg-amber-50 border border-amber-200' : 'bg-sunken'}`}
        >
          <Clock size={16} className={needsNewTime ? 'shrink-0 text-amber-600' : icon} />
          <span className="min-w-0 flex-1">
            <span className="block mobile-body-sm text-ink">
              {timeLabel}
              {appt.duration_minutes ? ` · ${appt.duration_minutes} min` : ''}
            </span>
            {needsNewTime && <span className="block mobile-caption text-amber-800">Pick a new time</span>}
          </span>
          <span className={`shrink-0 w-11 h-11 -mr-2 flex items-center justify-center rounded-full ${needsNewTime ? 'text-amber-700' : 'text-ink-faint'}`}>
            <Pencil size={20} />
          </span>
        </button>
      ) : (
        <div className={row}>
          <Clock size={16} className={icon} />
          <span>
            {timeLabel}
            {appt.duration_minutes ? ` · ${appt.duration_minutes} min` : ''}
          </span>
        </div>
      )}
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
      {appt.reference_images && appt.reference_images.length > 0 && (
        <div className="pt-1">
          <p className="mobile-caption mb-1.5 font-medium text-ink-muted">Reference Photos</p>
          <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
            {appt.reference_images.map((url) => (
              <a
                key={url}
                href={getMediaUrl(url)}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block aspect-square overflow-hidden rounded-xl bg-surface border border-line shadow-2xs hover:opacity-95 transition-opacity"
              >
                <Image
                  src={getMediaUrl(url)}
                  alt="Reference photo"
                  fill
                  sizes="120px"
                  className="object-cover"
                  unoptimized
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
