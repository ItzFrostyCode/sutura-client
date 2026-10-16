import AppointmentPager from './AppointmentPager';
import React, { useState } from 'react';
import AppointmentSubject from './AppointmentSubject';
import {
  Calendar as CalendarIcon, Clock, Loader2, Eye, Play, Scissors,
  CheckSquare, RefreshCw, Pencil, Trash2, UserX, Mail, Phone,
  Building2, UserCheck, Sparkles, MoreHorizontal, FileText, Ruler, LogIn
} from 'lucide-react';
import {
  Appointment, formatScheduled, appointmentNo, fullDateTime, StatusBadge, TypeBadge, getCustomerInitials,
  ChannelBadge, RescheduledBadge, WalkInPriorityBadge, CheckInBadge
} from './appointmentHelpers';

interface AppointmentListViewProps {
  readonly filtered: Appointment[];
  readonly loading: boolean;
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
  filtered: all, loading, viewMode = 'table', actionLoadingId, isOwnerOrManager,
  onReviewClick, onCreateJobClick, onCompleteClick,
  onRescheduleClick, onDetailsClick, onEditClick, onCancelClick,
  onNoShowClick, onNewAppointmentClick, onCheckInClick
}: AppointmentListViewProps) {

  // Ten at a time, so the list stays easy to read.
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const filtered = all.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pager = <AppointmentPager total={all.length} page={currentPage} pageSize={PAGE_SIZE} onPage={setPage} />;

  // Active dropdown row ID for table more-menu
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  const renderTableActions = (apt: Appointment) => {
    const isLoading = actionLoadingId === apt.id;
    const isPending = apt.status === 'pending';
    const isConfirmed = apt.status === 'confirmed';
    const isInProgress = apt.status === 'in_progress';
    const isCompleted = apt.status === 'completed';
    const isTerminal = ['completed', 'cancelled', 'no_show', 'rejected'].includes(apt.status);
    const isMenuOpen = activeMenuId === apt.id;

    if (isLoading) {
      return (
        <div className="inline-flex items-center gap-1.5 text-xs text-taupe px-3 py-1.5">
          <Loader2 size={14} className="animate-spin" />
          <span className="text-[11px] font-semibold">Updating...</span>
        </div>
      );
    }

    return (
      <div className="inline-flex items-center justify-end gap-2 whitespace-nowrap">
        {/* Single Primary Action Button */}
        {isPending && isOwnerOrManager && (
          <button
            type="button"
            onClick={() => onReviewClick(apt)}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 h-9 cursor-pointer max-[599px]:h-11 max-[599px]:px-4 rounded-lg bg-taupe hover:bg-taupe-hover text-white shadow-2xs transition-colors"
          >
            <Eye size={13} /> <span>Review</span>
          </button>
        )}

        {isConfirmed && onCheckInClick && (
          <button
            type="button"
            onClick={() => onCheckInClick(apt.id)}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 h-9 cursor-pointer max-[599px]:h-11 max-[599px]:px-4 rounded-lg bg-surface border border-taupe/40 hover:bg-taupe/10 text-taupe shadow-2xs transition-colors"
          >
            <LogIn size={12} /> <span>{apt.checked_in_at ? 'Start now' : 'Customer arrived'}</span>
          </button>
        )}

        {isInProgress && (
          <button
            type="button"
            onClick={() => onCompleteClick(apt)}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 h-9 cursor-pointer max-[599px]:h-11 max-[599px]:px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-colors"
          >
            <CheckSquare size={13} /> <span>Done</span>
          </button>
        )}

        {/* Quick View Button */}
        <button
          type="button"
          onClick={() => onDetailsClick(apt)}
          title="View details"
          className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 text-xs font-semibold text-ink transition-colors hover:border-ink hover:bg-sunken max-[599px]:h-11"
        >
          <Eye size={14} /> <span>Details</span>
        </button>

        {!isOwnerOrManager && isConfirmed && !apt.job_order_id && (
          <button
            type="button"
            onClick={() => onCreateJobClick(apt)}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 h-9 cursor-pointer max-[599px]:h-11 max-[599px]:px-4 rounded-lg bg-surface border border-line hover:bg-canvas text-ink transition-colors"
          >
            <Scissors size={13} /> <span>Create Job</span>
          </button>
        )}

        {/* 3-Dots Action Dropdown Menu (Secondary management actions) */}
        {isOwnerOrManager && !isTerminal && (
          <div className="relative inline-block text-left">
            <button
              type="button"
              onClick={() => setActiveMenuId(isMenuOpen ? null : apt.id)}
              title="More actions"
              aria-label="More actions"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-line-strong bg-white text-ink transition-colors hover:border-ink hover:bg-sunken max-[599px]:h-11 max-[599px]:w-11"
            >
              <MoreHorizontal size={16} />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setActiveMenuId(null)}
                />
                <div className="absolute right-0 mt-1 w-44 bg-surface border border-line rounded-xl shadow-lg z-50 py-1 divide-y divide-line animate-in fade-in zoom-in-95 duration-100">
                  {/* Job Creation */}
                  {isConfirmed && !apt.job_order_id && (
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => { setActiveMenuId(null); onCreateJobClick(apt); }}
                        className="w-full text-left px-3 py-2 text-xs text-ink hover:bg-canvas flex items-center gap-2 font-medium"
                      >
                        <Scissors size={14} className="text-taupe" />
                        <span>Create Job Order</span>
                      </button>
                    </div>
                  )}

                  {/* Management: Edit, Reschedule, No-Show */}
                  {['pending', 'confirmed'].includes(apt.status) && (
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => { setActiveMenuId(null); onEditClick(apt); }}
                        className="w-full text-left px-3 py-2 text-xs text-ink hover:bg-canvas flex items-center gap-2 font-medium"
                      >
                        <Pencil size={14} className="text-ink-faint" />
                        <span>Edit Booking</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setActiveMenuId(null); onRescheduleClick(apt); }}
                        className="w-full text-left px-3 py-2 text-xs text-ink hover:bg-canvas flex items-center gap-2 font-medium"
                      >
                        <RefreshCw size={14} className="text-ink-faint" />
                        <span>Reschedule</span>
                      </button>
                      {isConfirmed && (
                        <button
                          type="button"
                          onClick={() => { setActiveMenuId(null); onNoShowClick(apt); }}
                          className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                        >
                          <UserX size={14} className="text-rose-500" />
                          <span>Didn't come</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Destructive: Cancel */}
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => { setActiveMenuId(null); onCancelClick(apt); }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                    >
                      <Trash2 size={14} />
                      <span>Cancel Booking</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTypeAndService = (apt: Appointment) => (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 flex-wrap">
        <TypeBadge type={apt.appointment_type} label={apt.purpose_label} kind={apt.kind} />
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
          apt.intake_channel === 'online'
            ? 'bg-sky-50/80 text-sky-900 border-sky-200'
            : 'bg-canvas text-ink-muted border-line'
        }`}>
          {apt.intake_channel === 'online' ? 'Online' : 'Walk-in'}
        </span>
        {apt.priority && apt.priority !== 'normal' && (
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
            apt.priority === 'rush' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            {apt.priority}
          </span>
        )}
      </div>

      <div className="max-w-[260px]">
        <AppointmentSubject apt={apt} />
      </div>
    </div>
  );

  // ── TABLE VIEW ──────────────────────────────────────────────────────
  const renderTableBody = () => {
    if (loading) {
      return (
        <>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={`apt-skel-${i}`} className="animate-pulse border-b border-line">
              <td className="px-5 py-3.5"><div className="h-4 bg-line rounded w-14"></div></td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-sunken"></div>
                  <div className="space-y-1">
                    <div className="h-3.5 bg-line rounded w-28"></div>
                    <div className="h-2.5 bg-line rounded w-20"></div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3.5">
                <div className="h-5 bg-line rounded w-24"></div>
              </td>
              <td className="px-5 py-3.5">
                <div className="h-4 bg-line rounded w-28"></div>
              </td>
              <td className="px-5 py-3.5">
                <div className="h-4 bg-line rounded w-20"></div>
              </td>
              <td className="px-5 py-3.5">
                <div className="h-5 bg-line rounded-full w-20"></div>
              </td>
              <td className="px-5 py-3.5 text-right">
                <div className="h-7 bg-line rounded-lg w-24 ml-auto"></div>
              </td>
            </tr>
          ))}
        </>
      );
    }

    if (filtered.length === 0) {
      return (
        <tr>
          <td colSpan={7} className="px-6 py-16 text-center">
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
                  className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 bg-taupe hover:bg-taupe-hover text-white rounded-lg transition-colors"
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
          {/* Number */}
          <td className="hidden lg:table-cell px-3 sm:px-4 xl:px-5 py-3.5 align-middle whitespace-nowrap font-mono text-xs font-semibold text-ink-body">{appointmentNo(apt.id)}</td>

          {/* Customer */}
          <td className="px-3 sm:px-4 xl:px-5 py-3.5 align-middle">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 rounded-full bg-taupe/10 border border-taupe/20 text-taupe flex items-center justify-center text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="font-mono text-[11px] font-semibold text-ink-faint lg:hidden">
                    {appointmentNo(apt.id)}
                  </span>
                  <p className="font-semibold text-sm text-ink truncate group-hover:text-taupe transition-colors">
                    {apt.customer?.name || 'Walk-in Client'}
                  </p>
                  <ChannelBadge channel={apt.intake_channel} />
                  {apt.notes?.includes('[Walk-in Priority]') ? (
                    <WalkInPriorityBadge />
                  ) : (apt.outcome === 'rescheduled' || apt.notes?.includes('[Rescheduled from')) ? (
                    <RescheduledBadge />
                  ) : null}
                </div>
                <p className="text-[11px] text-ink-faint truncate mt-0.5">
                  {apt.customer?.email || apt.customer?.phone || 'No contact info'}
                </p>
                {/* On tablet (< lg) show assigned staff under customer so Assigned to column can be hidden */}
                {apt.assigned_staff && (
                  <p className="text-[11px] text-ink-muted lg:hidden flex items-center gap-1 mt-0.5 truncate">
                    <UserCheck size={11} className="text-taupe shrink-0" />
                    <span className="truncate">{apt.assigned_staff.name}</span>
                  </p>
                )}
              </div>
            </div>
          </td>

          {/* Type & Service */}
          <td className="px-3 sm:px-4 xl:px-5 py-3.5 align-middle">
            {renderTypeAndService(apt)}
          </td>

          {/* Scheduled Date & Time (Clean single-line wrap guard) */}
          <td className="px-3 sm:px-4 xl:px-5 py-3.5 align-middle whitespace-nowrap">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-ink font-semibold text-xs">
                <CalendarIcon size={12} className="text-taupe shrink-0" />
                <span>{fullDate}</span>
                {relative && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    isToday ? 'bg-taupe text-white' : 'bg-canvas border border-line text-taupe'
                  }`}>
                    {relative}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-ink-muted">
                <Clock size={11} className="text-ink-faint shrink-0" />
                <span className="tabular-nums font-medium text-ink-body">{time}</span>
                <span className="text-ink-faint">({apt.duration_minutes ?? 45}m)</span>
              </div>
            </div>
          </td>

          {/* Assigned to (Visible on lg+) */}
          <td className="hidden lg:table-cell px-3 sm:px-4 xl:px-5 py-3.5 align-middle">
            {apt.assigned_staff ? (
              <div className="flex items-center gap-1 text-xs text-ink-body truncate">
                <UserCheck size={12} className="text-taupe shrink-0" />
                <span className="truncate">{apt.assigned_staff.name}</span>
              </div>
            ) : (
              <span className="text-xs text-ink-faint italic">Nobody yet</span>
            )}
          </td>

          {/* Status */}
          <td className="px-3 sm:px-4 xl:px-5 py-3.5 align-middle whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <StatusBadge status={apt.status} scheduledAt={apt.scheduled_at} outcome={apt.outcome} />
              <CheckInBadge checkedInAt={apt.checked_in_at} scheduledAt={apt.scheduled_at} />
            </div>
          </td>

          {/* Actions (Single neat row) */}
          <td className="px-3 sm:px-4 xl:px-5 py-3.5 align-middle text-right">
            {renderTableActions(apt)}
          </td>
        </tr>
      );
    });
  };

  // ── CARDS GRID VIEW ─────────────────────────────────────────────────
  const renderCardGrid = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4 sm:p-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`apt-card-skel-${i}`} className="bg-surface border border-line rounded-xl p-5 animate-pulse space-y-3">
              <div className="h-4 bg-line rounded w-2/3"></div>
              <div className="h-3 bg-line rounded w-1/2"></div>
              <div className="h-10 bg-line rounded-lg w-full mt-4"></div>
            </div>
          ))}
        </div>
      );
    }

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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4 sm:p-5">
        {filtered.map(apt => {
          const { shortDate, time, relative, isToday } = formatScheduled(apt.scheduled_at);
          const isPending = apt.status === 'pending';
          const isConfirmed = apt.status === 'confirmed';
          const isInProgress = apt.status === 'in_progress';
          const initials = getCustomerInitials(apt.customer?.name);

          return (
            <div
              key={apt.id}
              className={`bg-surface border rounded-xl p-4 sm:p-5 space-y-3.5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between ${
                isPending ? 'border-amber-300/80 bg-amber-50/10' : 'border-line hover:border-taupe/40'
              }`}
            >
              {/* Card Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-taupe/10 border border-taupe/20 text-taupe flex items-center justify-center text-xs font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-sm text-ink truncate">{apt.customer?.name || 'Walk-in Client'}</p>
                        <ChannelBadge channel={apt.intake_channel} />
                        {apt.notes?.includes('[Walk-in Priority]') ? (
                          <WalkInPriorityBadge />
                        ) : (apt.outcome === 'rescheduled' || apt.notes?.includes('[Rescheduled from')) ? (
                          <RescheduledBadge />
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-ink-faint mt-0.5">
                        {apt.customer?.phone ? (
                          <span className="flex items-center gap-1 truncate">
                            <Phone size={11} className="shrink-0" /> {apt.customer.phone}
                          </span>
                        ) : apt.customer?.email ? (
                          <span className="flex items-center gap-1 truncate">
                            <Mail size={11} className="shrink-0" /> {apt.customer.email}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge status={apt.status} scheduledAt={apt.scheduled_at} outcome={apt.outcome} />
                    <CheckInBadge checkedInAt={apt.checked_in_at} scheduledAt={apt.scheduled_at} />
                  </div>
                </div>

                {/* Service Details Box */}
                <div className="bg-canvas/50 border border-line/70 rounded-lg p-2.5">
                  {renderTypeAndService(apt)}
                </div>

                {/* Schedule & Location */}
                <div className="space-y-1 text-xs text-ink-body pt-0.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-semibold text-ink">
                      <CalendarIcon size={12} className="text-taupe shrink-0" />
                      <span>{shortDate}</span>
                      {relative && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          isToday ? 'bg-taupe text-white' : 'bg-canvas border border-line text-taupe'
                        }`}>
                          {relative}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 font-semibold tabular-nums text-ink">
                      <Clock size={11} className="text-ink-faint" />
                      <span>{time}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-ink-muted">
                    <span className="font-mono font-semibold">{appointmentNo(apt.id)}</span>
                    {apt.assigned_staff && (
                      <span className="flex items-center gap-1">
                        <UserCheck size={11} className="text-taupe" />
                        {apt.assigned_staff.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Action Bar — flex-wrap: a confirmed appointment can
                  show Check In + Start + Job on the left plus Eye + Edit on
                  the right all at once (up to 5 controls), which is wider
                  than a real 320-375px phone card and this row has no
                  overflow-hidden to hide the overflow, so it would spill
                  visibly past the card edge instead of wrapping cleanly. */}
              <div className="flex items-center justify-between flex-wrap gap-2 border-t border-line/60 pt-3">
                <div className="flex items-center gap-1.5">
                  {isPending && isOwnerOrManager && (
                    <button
                      type="button"
                      onClick={() => onReviewClick(apt)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-taupe hover:bg-taupe-hover text-white transition-colors"
                    >
                      Review
                    </button>
                  )}
                  {isConfirmed && onCheckInClick && (
                    <button
                      type="button"
                      onClick={() => onCheckInClick(apt.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface border border-taupe/40 hover:bg-taupe/10 text-taupe transition-colors"
                    >
                      {apt.checked_in_at ? 'Start now' : 'Customer arrived'}
                    </button>
                  )}
                  {isInProgress && (
                    <button
                      type="button"
                      onClick={() => onCompleteClick(apt)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
                    >
                      Done
                    </button>
                  )}
                  {isConfirmed && !apt.job_order_id && (
                    <button
                      type="button"
                      onClick={() => onCreateJobClick(apt)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-surface border border-line hover:bg-canvas text-ink transition-colors"
                    >
                      Job
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onDetailsClick(apt)}
                    title="View Details"
                    className="p-1.5 max-[599px]:p-3 text-ink-muted hover:text-ink hover:bg-canvas rounded-lg"
                  >
                    <Eye size={14} />
                  </button>
                  {['pending', 'confirmed'].includes(apt.status) && isOwnerOrManager && (
                    <button
                      type="button"
                      onClick={() => onEditClick(apt)}
                      title="Edit"
                      className="p-1.5 max-[599px]:p-3 text-ink-muted hover:text-ink hover:bg-canvas rounded-lg"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── MOBILE COMPACT LIST VIEW (<640px) ─────────────────────────────────
  const renderMobileList = () => {
    if (loading) {
      return (
        <div className="divide-y divide-line p-3 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`skel-mob-${i}`} className="p-3.5 bg-surface rounded-xl border border-line animate-pulse space-y-2.5">
              <div className="h-4 bg-line rounded w-1/2"></div>
              <div className="h-3 bg-line rounded w-3/4"></div>
              <div className="h-9 bg-line rounded-lg w-full mt-2"></div>
            </div>
          ))}
        </div>
      );
    }

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
      <div className="divide-y divide-line">
        {filtered.map((apt) => {
          const { shortDate, time, relative, isToday } = formatScheduled(apt.scheduled_at);
          const isPending = apt.status === 'pending';
          const initials = getCustomerInitials(apt.customer?.name);

          return (
            <div
              key={`mob-apt-${apt.id}`}
              className={`p-3.5 space-y-2.5 transition-colors ${
                isPending ? 'bg-amber-50/20' : 'bg-surface'
              }`}
            >
              {/* Header: Customer avatar, name, badges, status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-taupe/10 border border-taupe/20 text-taupe flex items-center justify-center text-xs font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[11px] font-semibold text-ink-faint">
                        {appointmentNo(apt.id)}
                      </span>
                      <p className="font-semibold text-sm text-ink truncate">
                        {apt.customer?.name || 'Walk-in Client'}
                      </p>
                      <ChannelBadge channel={apt.intake_channel} />
                      {apt.notes?.includes('[Walk-in Priority]') ? (
                        <WalkInPriorityBadge />
                      ) : (apt.outcome === 'rescheduled' || apt.notes?.includes('[Rescheduled from')) ? (
                        <RescheduledBadge />
                      ) : null}
                    </div>
                    <p className="text-[11px] text-ink-faint truncate mt-0.5">
                      {apt.customer?.phone || apt.customer?.email || 'No contact info'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <StatusBadge status={apt.status} scheduledAt={apt.scheduled_at} outcome={apt.outcome} />
                  <CheckInBadge checkedInAt={apt.checked_in_at} scheduledAt={apt.scheduled_at} />
                </div>
              </div>

              {/* Service & Schedule Box */}
              <div className="flex items-center justify-between text-xs text-ink-body bg-canvas/40 border border-line/60 rounded-lg p-2.5 gap-2">
                <div className="min-w-0 flex-1 truncate">
                  {renderTypeAndService(apt)}
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 font-semibold text-ink">
                    <CalendarIcon size={11} className="text-taupe" />
                    <span>{shortDate}</span>
                    {relative && (
                      <span className={`text-[9px] font-bold px-1 rounded ${
                        isToday ? 'bg-taupe text-white' : 'bg-canvas border border-line text-taupe'
                      }`}>
                        {relative}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-ink-muted justify-end">
                    <Clock size={10} className="text-ink-faint" />
                    <span>{time}</span>
                  </div>
                </div>
              </div>

              {/* Footer: Staff & Actions */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <div className="text-[11px] text-ink-muted truncate min-w-0">
                  {apt.assigned_staff ? (
                    <span className="flex items-center gap-1 truncate">
                      <UserCheck size={11} className="text-taupe shrink-0" />
                      <span className="truncate">{apt.assigned_staff.name}</span>
                    </span>
                  ) : (
                    <span className="text-ink-faint italic">Nobody assigned</span>
                  )}
                </div>
                <div className="shrink-0">
                  {renderTableActions(apt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (viewMode === 'cards') {
    return <>{renderCardGrid()}{pager}</>;
  }

  return (
    <>
      {/* Mobile List View (<640px) */}
      <div className="block sm:hidden">
        {renderMobileList()}
      </div>

      {/* Tablet & Desktop Table (>=640px) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-sm text-ink-body">
          <thead className="bg-canvas/50 text-[11px] font-bold uppercase tracking-wider text-ink-faint border-b border-line">
            <tr>
              <th className="hidden lg:table-cell px-3 sm:px-4 xl:px-5 py-3">No.</th>
              <th className="px-3 sm:px-4 xl:px-5 py-3">Customer</th>
              <th className="px-3 sm:px-4 xl:px-5 py-3">Visit</th>
              <th className="px-3 sm:px-4 xl:px-5 py-3 whitespace-nowrap">Date and time</th>
              <th className="hidden lg:table-cell px-3 sm:px-4 xl:px-5 py-3">Assigned to</th>
              <th className="px-3 sm:px-4 xl:px-5 py-3">Status</th>
              <th className="px-3 sm:px-4 xl:px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {renderTableBody()}
          </tbody>
        </table>
      </div>
      {pager}
    </>
  );
}
