import React, { useState } from 'react';
import {
  Calendar as CalendarIcon, Clock, Loader2, Eye, Play, Scissors,
  CheckSquare, RefreshCw, Pencil, Trash2, UserX, Mail, Phone,
  Building2, UserCheck, Sparkles, MoreHorizontal, FileText, Ruler
} from 'lucide-react';
import {
  Appointment, formatScheduled, StatusBadge, TypeBadge, getCustomerInitials
} from './appointmentHelpers';

interface AppointmentListViewProps {
  readonly filtered: Appointment[];
  readonly loading: boolean;
  readonly viewMode?: 'table' | 'cards';
  readonly actionLoadingId: number | null;
  readonly isOwnerOrManager: boolean;

  // Actions
  readonly onReviewClick: (apt: Appointment) => void;
  readonly onStartClick: (aptId: number) => void;
  readonly onCreateJobClick: (apt: Appointment) => void;
  readonly onCompleteClick: (apt: Appointment) => void;
  readonly onRescheduleClick: (apt: Appointment) => void;
  readonly onDetailsClick: (apt: Appointment) => void;
  readonly onEditClick: (apt: Appointment) => void;
  readonly onCancelClick: (apt: Appointment) => void;
  readonly onNoShowClick: (apt: Appointment) => void;
  readonly onNewAppointmentClick?: () => void;
}

export default function AppointmentListView({
  filtered, loading, viewMode = 'table', actionLoadingId, isOwnerOrManager,
  onReviewClick, onStartClick, onCreateJobClick, onCompleteClick,
  onRescheduleClick, onDetailsClick, onEditClick, onCancelClick,
  onNoShowClick, onNewAppointmentClick
}: AppointmentListViewProps) {

  // Active dropdown row ID for table more-menu
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  const renderTableActions = (apt: Appointment) => {
    const isLoading = actionLoadingId === apt.id;
    const isPending = apt.status === 'pending';
    const isConfirmed = apt.status === 'confirmed';
    const isInProgress = apt.status === 'in_progress';
    const isCompleted = apt.status === 'completed';
    const isTerminal = ['completed', 'cancelled', 'no_show'].includes(apt.status);
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
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-taupe hover:bg-taupe-hover text-white shadow-2xs transition-colors"
          >
            <Eye size={13} /> <span>Review</span>
          </button>
        )}

        {isConfirmed && (
          <button
            type="button"
            onClick={() => onStartClick(apt.id)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-ink hover:bg-black text-white shadow-2xs transition-colors"
          >
            <Play size={12} fill="currentColor" /> <span>Start</span>
          </button>
        )}

        {isInProgress && (
          <button
            type="button"
            onClick={() => onCompleteClick(apt)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-colors"
          >
            <CheckSquare size={13} /> <span>Complete</span>
          </button>
        )}

        {/* Quick View Button */}
        <button
          type="button"
          onClick={() => onDetailsClick(apt)}
          title="View details"
          className="p-1.5 text-ink-muted hover:text-ink hover:bg-canvas rounded-lg transition-colors"
        >
          <Eye size={15} />
        </button>

        {/* 3-Dots Action Dropdown Menu (Secondary management actions) */}
        {isOwnerOrManager && !isTerminal && (
          <div className="relative inline-block text-left">
            <button
              type="button"
              onClick={() => setActiveMenuId(isMenuOpen ? null : apt.id)}
              title="More actions"
              className="p-1.5 text-ink-faint hover:text-ink hover:bg-canvas rounded-lg transition-colors"
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
                          <span>Mark as No-Show</span>
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
        <TypeBadge type={apt.appointment_type} />
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

      {apt.service && (
        <p className="text-xs text-ink font-medium truncate max-w-[200px]">
          {apt.service.name}
        </p>
      )}
      {!apt.service && apt.garment_category && (
        <p className="text-xs text-ink-muted capitalize truncate max-w-[200px]">
          {apt.garment_category.replace(/_/g, ' ')}
        </p>
      )}
    </div>
  );

  // ── TABLE VIEW ──────────────────────────────────────────────────────
  const renderTableBody = () => {
    if (loading) {
      return (
        <>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={`apt-skel-${i}`} className="animate-pulse border-b border-line">
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
      const { shortDate, time, relative, isToday } = formatScheduled(apt.scheduled_at);
      const isPending = apt.status === 'pending';
      const initials = getCustomerInitials(apt.customer?.name);

      return (
        <tr
          key={apt.id}
          className={`hover:bg-canvas/50 transition-colors group ${
            isPending ? 'bg-amber-50/10' : ''
          }`}
        >
          {/* Customer */}
          <td className="px-5 py-3.5 align-middle">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-taupe/10 border border-taupe/20 text-taupe flex items-center justify-center text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-ink truncate group-hover:text-taupe transition-colors">
                  {apt.customer?.name || 'Walk-in Client'}
                </p>
                <p className="text-[11px] text-ink-faint truncate">
                  {apt.customer?.email || apt.customer?.phone || 'No contact info'}
                </p>
              </div>
            </div>
          </td>

          {/* Type & Service */}
          <td className="px-5 py-3.5 align-middle">
            {renderTypeAndService(apt)}
          </td>

          {/* Scheduled Date & Time (Clean single-line wrap guard) */}
          <td className="px-5 py-3.5 align-middle whitespace-nowrap">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-ink font-semibold text-xs">
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
              <div className="flex items-center gap-1 text-[11px] text-ink-muted">
                <Clock size={11} className="text-ink-faint shrink-0" />
                <span className="tabular-nums font-medium text-ink-body">{time}</span>
                <span className="text-ink-faint">({apt.duration_minutes ?? 45}m)</span>
              </div>
            </div>
          </td>

          {/* Branch & Staff */}
          <td className="px-5 py-3.5 align-middle">
            <div className="space-y-0.5 text-xs">
              <div className="flex items-center gap-1 text-ink font-medium truncate">
                <Building2 size={12} className="text-ink-faint shrink-0" />
                <span className="truncate">{apt.branch?.name || 'Main Branch'}</span>
              </div>
              {apt.assigned_staff ? (
                <div className="flex items-center gap-1 text-ink-muted text-[11px] truncate">
                  <UserCheck size={11} className="text-taupe shrink-0" />
                  <span className="truncate">{apt.assigned_staff.name}</span>
                </div>
              ) : (
                <span className="text-[10px] text-ink-faint italic">Unassigned</span>
              )}
            </div>
          </td>

          {/* Status */}
          <td className="px-5 py-3.5 align-middle whitespace-nowrap">
            <StatusBadge status={apt.status} />
          </td>

          {/* Actions (Single neat row) */}
          <td className="px-5 py-3.5 align-middle text-right">
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
                      <p className="font-bold text-sm text-ink truncate">{apt.customer?.name || 'Walk-in Client'}</p>
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
                  <StatusBadge status={apt.status} />
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
                    <span className="flex items-center gap-1">
                      <Building2 size={11} className="text-ink-faint" />
                      {apt.branch?.name || 'Main Branch'}
                    </span>
                    {apt.assigned_staff && (
                      <span className="flex items-center gap-1">
                        <UserCheck size={11} className="text-taupe" />
                        {apt.assigned_staff.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Action Bar */}
              <div className="flex items-center justify-between gap-2 border-t border-line/60 pt-3">
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
                  {isConfirmed && (
                    <button
                      type="button"
                      onClick={() => onStartClick(apt.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-ink hover:bg-black text-white transition-colors"
                    >
                      Start
                    </button>
                  )}
                  {isInProgress && (
                    <button
                      type="button"
                      onClick={() => onCompleteClick(apt)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
                    >
                      Complete
                    </button>
                  )}
                  {isConfirmed && isOwnerOrManager && !apt.job_order_id && (
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
                    className="p-1.5 text-ink-muted hover:text-ink hover:bg-canvas rounded-lg"
                  >
                    <Eye size={14} />
                  </button>
                  {['pending', 'confirmed'].includes(apt.status) && isOwnerOrManager && (
                    <button
                      type="button"
                      onClick={() => onEditClick(apt)}
                      title="Edit"
                      className="p-1.5 text-ink-muted hover:text-ink hover:bg-canvas rounded-lg"
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

  if (viewMode === 'cards') {
    return renderCardGrid();
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-ink-body">
        <thead className="bg-canvas/50 text-[11px] font-bold uppercase tracking-wider text-ink-faint border-b border-line">
          <tr>
            <th className="px-5 py-3">Customer</th>
            <th className="px-5 py-3">Type & Service</th>
            <th className="px-5 py-3">Schedule</th>
            <th className="px-5 py-3">Branch & Staff</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {renderTableBody()}
        </tbody>
      </table>
    </div>
  );
}
