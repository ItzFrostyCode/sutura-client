import { Calendar, Clock, MapPin, CheckCircle2, Edit2 } from 'lucide-react';
import { Branch } from '../../types';

interface BookingScheduleSummaryProps {
  date: string;
  time: string;
  selectedBranch: Branch | null;
  appointmentType: string;
  formatDatePreview: (d: string) => string;
  formatTimePreview: (t: string) => string;
  onEditSchedule: () => void;
}

export default function BookingScheduleSummary({
  date,
  time,
  selectedBranch,
  appointmentType,
  formatDatePreview,
  formatTimePreview,
  onEditSchedule,
}: Readonly<BookingScheduleSummaryProps>) {
  return (
    <div className="p-4 bg-surface border border-line rounded-none space-y-3">
      <div className="flex items-center justify-between">
        <span className="mobile-overline text-taupe flex items-center gap-1.5">
          <Calendar size={14} className="text-taupe" /> Appointment Schedule
        </span>
        <button
          type="button"
          onClick={onEditSchedule}
          className="mobile-caption font-semibold text-taupe hover:underline flex items-center gap-1 cursor-pointer py-1"
        >
          <Edit2 size={12} /> Edit Schedule
        </button>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-2.5">
          <Clock size={16} className="text-taupe shrink-0" />
          <span className="mobile-body-sm text-ink font-semibold">
            {formatDatePreview(date)} • {formatTimePreview(time)}
          </span>
        </div>

        {selectedBranch && (
          <div className="flex items-start gap-2.5 mobile-body-sm text-ink-muted font-normal">
            <MapPin size={16} className="text-taupe shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-ink">{selectedBranch.name}</span>
              {selectedBranch.address && (
                <p className="mobile-caption text-ink-faint mt-0.5 font-normal">{selectedBranch.address}</p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2.5 mobile-body-sm text-ink-muted font-normal pt-0.5">
          <CheckCircle2 size={16} className="text-taupe shrink-0" />
          <span>
            Purpose: <span className="font-medium text-ink capitalize">{appointmentType}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
