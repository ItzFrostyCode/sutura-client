import Image from 'next/image';
import { AlertCircle, Info, Link as LinkIcon } from 'lucide-react';
import { safeHref } from '@/lib/safeHref';
import { getMediaUrl } from '@/lib/media';
import type { AppointmentDetailData } from './AppointmentDetailContent';

const note = 'mobile-caption mt-3 flex items-start gap-2 rounded-xl bg-sunken p-3 text-ink-body';

/** What the status means, quietly: soft notes, what the store handed over, and why a request was rejected. */
export default function AppointmentDetailNotices({ appt, isPastDue }: { readonly appt: AppointmentDetailData; readonly isPastDue: boolean }) {
  const hasHandOff = appt.shared_link || (appt.shared_images && appt.shared_images.length > 0);

  return (
    <>
      {isPastDue && (
        <p className={note}>
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-ink-muted" />
          This appointment&apos;s scheduled time has already passed with no update from the store. If you&apos;re not sure what happened, reach out to them directly.
        </p>
      )}

      {appt.needs_new_time && appt.status === 'pending' && (
        <div className="mt-3 rounded-xl bg-amber-50 p-3 text-amber-900">
          <p className="text-sm font-semibold">Your time was taken by a walk-in client</p>
          <p className="mobile-caption mt-1">The shop can&apos;t use the time you asked for. Pick another one — your request stays with the store, so you don&apos;t need to start over.</p>
        </div>
      )}

      {!isPastDue && appt.status === 'pending' && !appt.needs_new_time && (
        <p className={note}>
          <Info size={16} className="mt-0.5 shrink-0 text-ink-muted" />
          Waiting for the store to confirm. Walk-ins are seen first come, first served — arriving early improves your spot in line.
        </p>
      )}

      {hasHandOff && (
        <div className="mt-3 space-y-2 rounded-2xl bg-sunken p-3">
          <p className="mobile-overline text-ink-faint">From the store</p>
          {appt.shared_link && (
            <a href={safeHref(appt.shared_link)} target="_blank" rel="noopener noreferrer" className="mobile-body-sm flex items-center gap-2 break-all text-taupe hover:underline">
              <LinkIcon size={16} className="shrink-0" /> {appt.shared_link}
            </a>
          )}
          {appt.shared_images && appt.shared_images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {appt.shared_images.map((url) => (
                <a key={url} href={getMediaUrl(url)} target="_blank" rel="noopener noreferrer" className="relative block aspect-square overflow-hidden rounded-xl bg-surface">
                  <Image src={getMediaUrl(url)} alt="Shared by the store" fill sizes="120px" className="object-cover" unoptimized />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {appt.status === 'rejected' && (
        <div className="mt-3 rounded-xl bg-danger/5 p-3">
          <p className="mobile-caption font-semibold text-danger">Appointment Rejected</p>
          {appt.rejection_reason && <p className="mobile-caption mt-1 text-ink-body"><span className="font-semibold">Reason:</span> {appt.rejection_reason}</p>}
          {appt.rejection_note && <p className="mobile-caption mt-1 text-ink-muted">{appt.rejection_note}</p>}
          <p className="mobile-caption mt-2 text-ink-muted">You can book a different date or time anytime.</p>
        </div>
      )}
    </>
  );
}
