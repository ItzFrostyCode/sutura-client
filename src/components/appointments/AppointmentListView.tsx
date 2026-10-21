import AppointmentPager from './AppointmentPager';
import { CardsSkeleton, TableRowsSkeleton } from './AppointmentSkeletons';
import React, { useEffect, useState } from 'react';
import AppointmentSubject from './AppointmentSubject';
import { nextStep } from './nextStep';
import {
  Calendar as CalendarIcon, Clock, Loader2, Eye, Play, Scissors,
  CheckSquare, RefreshCw, Pencil, Trash2, UserX, Mail, Phone,
  Building2, UserCheck, Sparkles, MoreHorizontal, FileText, Ruler, LogIn
} from 'lucide-react';
import {
  Appointment, formatScheduled, appointmentNo, fullDateTime, StatusBadge, TypeBadge, getCustomerInitials,
  ChannelBadge, RescheduledBadge, WalkInPriorityBadge, CheckInBadge, contactLine, customerLabel
} from './appointmentHelpers';

interface AppointmentListViewProps {
  readonly filtered: Appointment[];
  readonly loading: boolean;
  /** Changes when a filter or the search changes: the list goes back to page 1. */
  readonly resetKey?: string;
  readonly viewMode?: 'table' | 'cards';
  readonly actionLoadingId: number | null;
  readonly isOwnerOrManager: boolean;

  // Actions
  readonly onReviewClick: (apt: Appointment) => void;
  readonly onCreateJobClick: (apt: Appointment) => void;
  readonly onCompleteClick: (apt: Appointment) => void;
  readonly onRescheduleClick: (apt: Appointment) => void;
  readonly onDetailsClick: (apt: Appointment) => void;
  readonly onEditClick: (apt: Appointment) => void;
  readonly onCancelClick: (apt: Appointment) => void;
  readonly onNoShowClick: (apt: Appointment) => void;
  readonly onNewAppointmentClick?: () => void;
  readonly onCheckInClick?: (aptId: number) => void;
}

const PAGE_SIZE = 10;

export default function AppointmentListView({
  filtered: all, loading, resetKey, viewMode = 'table', actionLoadingId, isOwnerOrManager,
  onReviewClick, onCreateJobClick, onCompleteClick,
  onRescheduleClick, onDetailsClick, onEditClick, onCancelClick,
  onNoShowClick, onNewAppointmentClick, onCheckInClick
}: AppointmentListViewProps) {

  // Ten at a time, so the list stays easy to read.
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [resetKey]); // eslint-disable-line react-hooks/set-state-in-effect
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const filtered = all.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pager = <AppointmentPager total={all.length} page={currentPage} pageSize={PAGE_SIZE} onPage={setPage} />;

  const renderTableActions = (apt: Appointment) => {
    const isLoading = actionLoadingId === apt.id;

    if (isLoading) {
      return (
        <div className="inline-flex items-center gap-1.5 text-xs text-taupe px-3 py-1.5">
          <Loader2 size={14} className="animate-spin" />
          <span className="text-[11px] font-semibold">Updating...</span>
        </div>
      );
    }

    // The one thing to do next sits right on the row; everything else is behind View.
    const step = nextStep(apt, isOwnerOrManager);
    const runStep = () => {
      if (!step) return;
      if (step.key === 'approve') onReviewClick(apt);
      else if (step.key === 'arrived') onCheckInClick?.(apt.id);
      else if (step.key === 'done') onCompleteClick(apt);
      else onCreateJobClick(apt);
    };

    return (
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        {step && (
          <button
            type="button"
            onClick={runStep}
            className="inline-flex h-8.5 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-espresso px-3 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-espresso/90"
          >
            {step.label}
          </button>
        )}
        <button
          type="button"
          onClick={() => onDetailsClick(apt)}
          title="View appointment details and actions"
          aria-label={`View details for appointment ${appointmentNo(apt.id)}`}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 h-8.5 rounded-lg border border-line-strong bg-white hover:bg-canvas hover:border-ink/50 text-ink shadow-2xs transition-colors cursor-pointer shrink-0"
        >
          <span>View</span>
        </button>
      </div>
    );
  };

  const renderTypeAndService = (apt: Appointment) => (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 flex-wrap">
        <TypeBadge type={apt.appointment_type} label={apt.purpose_label} kind={apt.kind} />
        {apt.items && apt.items.length > 1 && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sunken text-ink-muted border border-line">
            {apt.items.length} items
          </span>
        )}
        {apt.priority && apt.priority !== 'normal' && (
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
            apt.priority === 'rush' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            {apt.priority}
          </span>
        )}
      </div>

      <div className="w-full min-w-0 truncate">
        <AppointmentSubject apt={apt} />
      </div>
    </div>
  );

  // ── TABLE VIEW ──────────────────────────────────────────────────────
  const renderTableBody = () => {
    if (loading) return <TableRowsSkeleton />;

    if (filtered.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="px-6 py-16 text-center">
            <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
              <div className="w-12 h-12 bg-canvas border border-line rounded-full flex items-center justify-center mb-3 text-taupe">
                <CalendarIcon size={22} />
              </div>
              <h3 className="text-sm font-bold text-ink">No appointments found</h3>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                There are no scheduled sessions matching your search or active filter tabs.
              </p>
              {onNewAppointmentClick && isOwnerOrManager && (
                <button
                  type="button"
                  onClick={onNewAppointmentClick}
                  className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 bg-espresso hover:bg-espresso/90 text-white rounded-lg transition-colors"
                >
                  <Sparkles size={13} /> Book Appointment
                </button>
              )}
            </div>
          </td>
        </tr>
      );
    }

    return filtered.map(apt => {
      const { relative, isToday } = formatScheduled(apt.scheduled_at);
      const { date: fullDate, time } = fullDateTime(apt.scheduled_at);
      const isPending = apt.status === 'pending';
      const initials = getCustomerInitials(apt.customer?.name);

      return (
        <tr
          key={apt.id}
          className={`hover:bg-canvas/50 transition-colors group ${
            isPending ? 'bg-amber-50/10' : ''
          }`}
        >
          {/* Customer & Booking Ref */}
          <td className="px-3 py-4 align-middle xl:px-5 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-10 w-10 rounded-full bg-sunken text-taupe flex items-center justify-center text-[13px] font-semibold shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[11px] font-semibold text-ink-faint">
                    {appointmentNo(apt.id)}
                  </span>
                  <ChannelBadge channel={apt.intake_channel} />
                  {apt.status === 'pending' && apt.outcome === 'rescheduled' ? (
                    <WalkInPriorityBadge />
                  ) : (apt.outcome === 'rescheduled' || apt.previous_scheduled_at) ? (
                    <RescheduledBadge />
                  ) : null}
                </div>
                <p className="font-semibold text-sm text-ink truncate group-hover:text-taupe transition-colors mt-0.5" title={customerLabel(apt.customer?.name)}>
                  {customerLabel(apt.customer?.name)}
                </p>
                <p className="text-xs text-ink-muted truncate mt-0.5">
                  {contactLine(apt.customer)}
                </p>
              </div>
            </div>
          </td>

          {/* Appointment Type & Service */}
          <td className="px-3 py-4 align-middle xl:px-5 min-w-0">
            {renderTypeAndService(apt)}
          </td>

          {/* Date & Time */}
          <td className="px-3 py-4 align-middle xl:px-5 min-w-0">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 text-ink font-semibold text-xs truncate">
                <CalendarIcon size={12} className="text-taupe shrink-0" />
                <span className="truncate">{fullDate}</span>
                {relative && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                    isToday ? 'bg-espresso text-white' : 'bg-canvas border border-line text-taupe'
                  }`}>
                    {relative}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-ink-muted truncate">
                <Clock size={11} className="text-ink-faint shrink-0" />
                <span className="tabular-nums font-medium text-ink-body">{time}</span>
                <span className="text-ink-faint">({apt.duration_minutes ?? 30}m)</span>
              </div>
            </div>
          </td>

          {/* Assigned to */}
          <td className="px-3 py-4 align-middle xl:px-5 min-w-0">
            {apt.assigned_staff ? (
              <p className="truncate text-xs text-ink-body">{apt.assigned_staff.name}</p>
            ) : (
              <span className="text-xs text-ink-faint italic">Unassigned</span>
            )}
          </td>

          {/* Status */}
          <td className="px-3 py-4 align-middle xl:px-5 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <StatusBadge status={apt.status} scheduledAt={apt.scheduled_at} outcome={apt.outcome} jobOrderId={apt.job_order_id} jobStatus={apt.job_order?.status} kind={apt.kind} type={apt.appointment_type} />
              <CheckInBadge checkedInAt={apt.checked_in_at} scheduledAt={apt.scheduled_at} />
            </div>
          </td>

          {/* Actions (Single neat row) */}
          <td className="px-3 py-4 align-middle xl:px-5 text-right">
            {renderTableActions(apt)}
          </td>
        </tr>
      );
    });
  };

  // ── CARDS GRID VIEW ─────────────────────────────────────────────────
  const renderCardGrid = () => {
    if (loading) return <CardsSkeleton grid />;

    if (filtered.length === 0) {
      return (
        <div className="py-16 px-4 text-center">
          <div className="w-14 h-14 bg-canvas border border-line rounded-full flex items-center justify-center mx-auto text-taupe mb-3">
            <CalendarIcon size={24} />
          </div>
          <h3 className="text-base font-bold text-ink">No appointments found</h3>
          <p className="text-xs text-ink-muted mt-1">There are no appointments matching your current filters.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((apt) => <React.Fragment key={apt.id}>{renderAptCard(apt)}</React.Fragment>)}
      </div>
    );
  };

  /** One appointment as a card: the same card on a phone and in the cards view. */
  const renderAptCard = (apt: Appointment) => {
    const { relative, isToday } = formatScheduled(apt.scheduled_at);
    const { date: fullDate, time } = fullDateTime(apt.scheduled_at);
    return (
            <article
              key={`mob-apt-${apt.id}`}
              className="rounded-xl border border-line bg-white p-4 shadow-[0_1px_3px_rgba(43,30,26,0.03)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sunken text-[13px] font-semibold text-taupe">
                    {getCustomerInitials(apt.customer?.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-[15px] font-semibold text-ink">{customerLabel(apt.customer?.name)}</p>
                      <ChannelBadge channel={apt.intake_channel} />
                      {apt.status === 'pending' && apt.outcome === 'rescheduled' ? <WalkInPriorityBadge /> : (apt.outcome === 'rescheduled' || apt.previous_scheduled_at) ? <RescheduledBadge /> : null}
                    </div>
                    <p className="truncate text-xs text-ink-muted"><span className="font-mono">{appointmentNo(apt.id)}</span> · {contactLine(apt.customer)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge status={apt.status} scheduledAt={apt.scheduled_at} outcome={apt.outcome} jobOrderId={apt.job_order_id} jobStatus={apt.job_order?.status} kind={apt.kind} type={apt.appointment_type} />
                  <CheckInBadge checkedInAt={apt.checked_in_at} scheduledAt={apt.scheduled_at} />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3">
                <div className="min-w-0">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Service</p>
                  {renderTypeAndService(apt)}
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Schedule</p>
                  <p className="flex flex-wrap items-center gap-x-1.5 text-[13px] font-medium text-ink">
                    <span>{fullDate}</span>
                    {relative && <span className={`rounded px-1.5 text-[10px] font-semibold ${isToday ? 'bg-espresso text-white' : 'border border-line bg-sunken text-taupe'}`}>{relative}</span>}
                  </p>
                  <p className="text-xs text-ink-muted"><span className="tabular-nums">{time}</span> ({apt.duration_minutes ?? 30}m)</p>
                </div>
              </div>

              <div className="mt-3 space-y-3 border-t border-line pt-3">
                <p className="flex min-w-0 items-center gap-1.5 text-xs text-ink-muted">
                  {apt.assigned_staff ? (
                    <span className="truncate text-ink-body">Assigned: {apt.assigned_staff.name}</span>
                  ) : (
                    <span className="pr-1 text-ink-faint">Unassigned</span>
                  )}
                </p>
                {/* The buttons get their own row and share it, so a long label never runs into the line above. */}
                <div className="[&>div]:flex-nowrap [&>div]:justify-stretch [&>div>button]:h-10 [&>div>button]:flex-1">{renderTableActions(apt)}</div>
              </div>
            </article>
    );
  };

  // ── MOBILE COMPACT LIST VIEW (<640px) ─────────────────────────────────
  const renderMobileList = () => {
    if (loading) return <CardsSkeleton count={4} />;

    if (filtered.length === 0) {
      return (
        <div className="py-12 px-4 text-center">
          <div className="w-12 h-12 bg-canvas border border-line rounded-full flex items-center justify-center mx-auto text-taupe mb-2">
            <CalendarIcon size={20} />
          </div>
          <h3 className="text-sm font-bold text-ink">No appointments found</h3>
          <p className="text-xs text-ink-muted mt-1">There are no appointments matching your current filters.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filtered.map((apt) => <React.Fragment key={`mob-apt-${apt.id}`}>{renderAptCard(apt)}</React.Fragment>)}
      </div>
    );
  };

  if (viewMode === 'cards') {
    return <>{renderCardGrid()}<div className="[&_nav]:border-t-0 [&_nav]:px-0">{pager}</div></>;
  }

  return (
    <>
      {/* Mobile List View (<640px) */}
      <div className="block sm:hidden">
        {renderMobileList()}
      </div>

      {/* Tablet & Desktop Table (>=640px) — table-fixed 100% width with zero horizontal scrolling */}
      <div className="hidden w-full overflow-x-auto sm:block">
        <table className="w-full min-w-[860px] table-fixed text-left text-sm text-ink-body">
          <thead className="border-b border-line bg-sunken/40 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
            <tr>
              <th className="w-[24%] px-3 py-3.5 xl:px-5">Customer &amp; ID</th>
              <th className="w-[19%] px-3 py-3.5 xl:px-5">Visit &amp; Purpose</th>
              <th className="w-[18%] px-3 py-3.5 xl:px-5">Schedule</th>
              <th className="w-[12%] px-3 py-3.5 xl:px-5">Assigned</th>
              <th className="w-[13%] px-3 py-3.5 xl:px-5">Status</th>
              <th className="w-[14%] px-3 py-3.5 text-right xl:px-5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {renderTableBody()}
          </tbody>
        </table>
      </div>
      {pager}
    </>
  );
}
