import { nextStep } from '../nextStep';
import {
  Appointment, StatusBadge, TypeBadge, ChannelBadge, CheckInBadge, RescheduledBadge, appointmentNo, contactLine, customerLabel, getCustomerInitials,
} from '../appointmentHelpers';
import { subjectLine, timeRange } from './calendarHelpers';

export interface AgendaActions {
  isOwnerOrManager: boolean;
  onReviewClick: (apt: Appointment) => void;
  onCompleteClick: (apt: Appointment) => void;
  onCreateJobClick: (apt: Appointment) => void;
  onDetailsClick: (apt: Appointment) => void;
  onCheckInClick?: (aptId: number) => void;
}

/** One appointment of the chosen day (Stitch mobile calendar): who, how it stands, what and when, then the next step. */
export default function AgendaCard({ apt, actions }: Readonly<{ apt: Appointment; actions: AgendaActions }>) {
  const step = nextStep(apt, actions.isOwnerOrManager);
  const run = () => {
    if (!step) return;
    if (step.key === 'approve') actions.onReviewClick(apt);
    else if (step.key === 'arrived') actions.onCheckInClick?.(apt.id);
    else if (step.key === 'done') actions.onCompleteClick(apt);
    else actions.onCreateJobClick(apt);
  };
  const phone = apt.customer?.phone?.trim();
  const icon = 'flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line-strong bg-white px-3 text-[13px] font-medium text-ink hover:bg-sunken';

  return (
    <article className="space-y-3 rounded-xl border border-line bg-white p-4 shadow-[0_1px_3px_rgba(43,30,26,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sunken text-[13px] font-semibold text-taupe">{getCustomerInitials(apt.customer?.name)}</span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-ink">{customerLabel(apt.customer?.name)}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
              <ChannelBadge channel={apt.intake_channel} />
              <TypeBadge type={apt.appointment_type} label={apt.purpose_label} kind={apt.kind} />
              {(apt.outcome === 'rescheduled' || apt.previous_scheduled_at) && <RescheduledBadge />}
              <span className="font-mono">{appointmentNo(apt.id)}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusBadge status={apt.status} scheduledAt={apt.scheduled_at} outcome={apt.outcome} jobOrderId={apt.job_order_id} jobStatus={apt.job_order?.status} kind={apt.kind} type={apt.appointment_type} />
          <CheckInBadge checkedInAt={apt.checked_in_at} scheduledAt={apt.scheduled_at} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-sunken/70 p-2.5 text-[13px]">
        <span className="flex min-w-0 items-center gap-2 text-ink">
          <span className="min-w-0 truncate font-medium">{subjectLine(apt)}</span>
        </span>
        <span className="shrink-0 text-xs font-medium text-ink-muted">{timeRange(apt)}</span>
      </div>
      {!phone && <p className="truncate text-xs text-ink-muted">{contactLine(apt.customer)}</p>}

      <div className="flex items-center gap-2">
        {step ? (
          <button type="button" onClick={run} className="h-10 flex-1 cursor-pointer rounded-lg bg-espresso px-3 text-[13px] font-semibold text-white hover:bg-espresso/90">{step.label}</button>
        ) : (
          <button type="button" onClick={() => actions.onDetailsClick(apt)} className="flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-line-strong bg-white text-[13px] font-semibold text-ink hover:bg-sunken">View</button>
        )}
        {phone && <a href={`tel:${phone}`} aria-label={`Call ${customerLabel(apt.customer?.name)}`} className={icon}>Call</a>}
        {step && <button type="button" onClick={() => actions.onDetailsClick(apt)} aria-label="View details" title="View details" className={icon}>View</button>}
      </div>
    </article>
  );
}
