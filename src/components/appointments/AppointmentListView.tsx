import React from 'react';
import {
  Calendar as CalendarIcon, Clock, Loader2, Eye, Play, Scissors, CheckSquare, RefreshCw, Pencil, Trash2, UserX
} from 'lucide-react';
import {
  Appointment, formatScheduled, StatusBadge, TypeBadge
} from './appointmentHelpers';

interface AppointmentListViewProps {
  readonly filtered: Appointment[];
  readonly loading: boolean;
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
}

export default function AppointmentListView({
  filtered, loading, actionLoadingId, isOwnerOrManager,
  onReviewClick, onStartClick, onCreateJobClick, onCompleteClick, onRescheduleClick, onDetailsClick, onEditClick, onCancelClick, onNoShowClick
}: AppointmentListViewProps) {

  const renderTableBody = () => {
    if (loading) {
      return (
        <>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={`apt-skel-${i}`} className="animate-pulse border-b border-[#EBE6E0]">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F0EAE3]"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-[#EBE6E0] rounded w-32"></div>
                    <div className="h-3 bg-[#EBE6E0] rounded w-24"></div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="space-y-2">
                  <div className="h-4 bg-[#EBE6E0] rounded w-24"></div>
                  <div className="h-3 bg-[#EBE6E0] rounded w-32"></div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="h-5 bg-[#EBE6E0] rounded-full w-20"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-[#EBE6E0] rounded w-28"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-[#EBE6E0] rounded w-16"></div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="h-8 bg-[#EBE6E0] rounded-lg w-20 ml-auto"></div>
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
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 bg-[#F0EAE3] rounded-full flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-[#A8A19A]" />
              </div>
              <p className="font-medium text-[#524A44]">No appointments found</p>
              <p className="text-sm text-[#827A73]">There are no appointments matching your current filters.</p>
            </div>
          </td>
        </tr>
      );
    }

    return filtered.map(apt => {
      const { date, time } = formatScheduled(apt.scheduled_at);
      const isLoading = actionLoadingId === apt.id;
      const isPending = apt.status === 'pending';
      const isConfirmed = apt.status === 'confirmed';
      const isInProgress = apt.status === 'in_progress';
      const isTerminal = ['completed', 'cancelled', 'no_show'].includes(apt.status);
      return (
        <tr key={apt.id} className={`hover:bg-[#FAF6F3]/60 transition-colors ${isPending ? 'bg-amber-50/30' : ''}`}>
          <td className="px-5 py-3.5">
            <p className="font-semibold text-[#2D2A26]">{apt.customer?.name}</p>
            <p className="text-xs text-[#A8A19A]">{apt.customer?.email}</p>
          </td>
          <td className="px-5 py-3.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <TypeBadge type={apt.appointment_type} />
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                apt.intake_channel === 'online'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-[#F0EAE3] text-[#9A8073] border-[#EBE6E0]'
              }`}>
                {apt.intake_channel === 'online' ? 'Online' : 'Walk-in'}
              </span>
              {apt.priority && apt.priority !== 'normal' && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${
                  apt.priority === 'rush' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {apt.priority}
                </span>
              )}
            </div>
            {apt.service && (
              <p className="text-xs text-[#827A73] mt-1.5 flex items-center gap-1.5">
                <span>{apt.service.name}</span>
                {apt.garment_category && (
                  <span className="text-[10px] bg-[#FAF6F3] text-[#9A8073] px-1.5 py-0.5 rounded-md border border-[#EBE6E0] font-bold capitalize">
                    {apt.garment_category}
                  </span>
                )}
              </p>
            )}
            {!apt.service && apt.garment_category && (
              <p className="text-xs text-[#827A73] mt-1.5 flex items-center gap-1.5">
                <span className="text-[10px] bg-[#FAF6F3] text-[#9A8073] px-1.5 py-0.5 rounded-md border border-[#EBE6E0] font-bold capitalize">
                  {apt.garment_category}
                </span>
              </p>
            )}
          </td>
          <td className="px-5 py-3.5">
            <div className="flex items-center gap-2 text-[#2D2A26]">
              <CalendarIcon size={13} className="text-[#A8A19A]" />
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Clock size={13} className="text-[#A8A19A]" />
              <span className="text-xs text-[#827A73]">{time} · {apt.duration_minutes ?? 60}min</span>
            </div>
          </td>
          <td className="px-5 py-3.5 text-xs text-[#827A73]">
            {apt.branch?.name || <span className="italic text-[#C4BDB6]">Main Branch</span>}
          </td>
          <td className="px-5 py-3.5"><StatusBadge status={apt.status} /></td>
          <td className="px-5 py-3.5">
            <div className="flex items-center justify-end gap-1.5">
              {isLoading ? (
                <Loader2 size={16} className="animate-spin text-[#A8A19A]" />
              ) : (
                <>
                  {/* Pending → Owner Review */}
                  {isPending && isOwnerOrManager && (
                    <button
                      type="button"
                      onClick={() => onReviewClick(apt)}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                    >
                      <Eye size={13} /> Review
                    </button>
                  )}

                  {/* Confirmed → Start */}
                  {isConfirmed && (
                    <button
                      type="button"
                      onClick={() => onStartClick(apt.id)}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-colors"
                    >
                      <Play size={13} /> Start
                    </button>
                  )}

                  {/* Confirmed → Create Job */}
                  {isConfirmed && isOwnerOrManager && (
                    <button
                      type="button"
                      onClick={() => onCreateJobClick(apt)}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#9A8073]/10 text-[#9A8073] hover:bg-[#FAF6F3] border border-[#9A8073]/20 transition-colors"
                    >
                      <Scissors size={13} /> Job
                    </button>
                  )}

                  {/* In Progress → Complete */}
                  {isInProgress && (
                    <button
                      type="button"
                      onClick={() => onCompleteClick(apt)}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                    >
                      <CheckSquare size={13} /> Complete
                    </button>
                  )}

                  {/* Confirmed → No Show */}
                  {isConfirmed && isOwnerOrManager && (
                    <button
                      type="button"
                      onClick={() => onNoShowClick(apt)}
                      title="Mark as No-Show"
                      className="p-1.5 text-[#A8A19A] hover:text-[#B26959] hover:bg-[#B26959]/10 rounded-lg transition-colors"
                    >
                      <UserX size={14} />
                    </button>
                  )}

                  {/* Reschedule */}
                  {['pending', 'confirmed'].includes(apt.status) && isOwnerOrManager && (
                    <button
                      type="button"
                      onClick={() => onRescheduleClick(apt)}
                      title="Reschedule"
                      className="p-1.5 text-[#A8A19A] hover:text-[#6B7FA8] hover:bg-[#6B7FA8]/10 rounded-lg transition-colors"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}

                  {/* View details */}
                  <button
                    type="button"
                    onClick={() => onDetailsClick(apt)}
                    title="View Details"
                    className="p-1.5 text-[#A8A19A] hover:text-[#2D2A26] hover:bg-[#F0EAE3] rounded-lg transition-colors"
                  >
                    <Eye size={14} />
                  </button>

                  {/* Edit */}
                  {!isTerminal && isOwnerOrManager && (
                    <button
                      type="button"
                      onClick={() => onEditClick(apt)}
                      title="Edit"
                      className="p-1.5 text-[#A8A19A] hover:text-[#2D2A26] hover:bg-[#F0EAE3] rounded-lg transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                  )}

                  {/* Cancel */}
                  {!isTerminal && isOwnerOrManager && (
                    <button
                      type="button"
                      onClick={() => onCancelClick(apt)}
                      title="Cancel"
                      className="p-1.5 text-[#A8A19A] hover:text-[#B26959] hover:bg-[#B26959]/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-[#524A44]">
        <thead className="bg-[#FAF6F3]/50 text-xs uppercase text-[#A8A19A] border-b border-[#EBE6E0]">
          <tr>
            <th className="px-5 py-3.5 font-semibold">Customer</th>
            <th className="px-5 py-3.5 font-semibold">Type / Service</th>
            <th className="px-5 py-3.5 font-semibold">Scheduled</th>
            <th className="px-5 py-3.5 font-semibold">Branch</th>
            <th className="px-5 py-3.5 font-semibold">Status</th>
            <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EBE6E0]/70">
          {renderTableBody()}
        </tbody>
      </table>
    </div>
  );
}
