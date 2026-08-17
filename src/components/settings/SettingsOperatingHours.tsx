import React from 'react';
import { Clock } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface SettingsOperatingHoursProps {
  readonly operatingHours: Record<string, { is_open: boolean; open: string; close: string }>;
  readonly onHoursChange: (day: string, field: 'is_open' | 'open' | 'close', value: string | boolean) => void;
}

export default function SettingsOperatingHours({
  operatingHours,
  onHoursChange,
}: SettingsOperatingHoursProps) {
  const toast = useToast();
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-line rounded-2xl p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-ink flex items-center gap-2">
            <Clock size={20} className="text-ink-muted" />
            Weekly Operating Hours
          </h2>
          <p className="text-sm text-ink-muted mt-1">
            Set the regular hours your shop is open for business. Customers will use this to book appointments.
          </p>
        </div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-ink-body">Standard Hours</h2>
          <button
            type="button"
            onClick={() => {
              const monday = operatingHours['monday'];
              if (!monday) return;
              const targetDays = ['tuesday', 'wednesday', 'thursday', 'friday'];
              targetDays.forEach(day => {
                onHoursChange(day, 'is_open', monday.is_open);
                onHoursChange(day, 'open', monday.open);
                onHoursChange(day, 'close', monday.close);
              });
              toast.success('Monday hours applied to Tue-Fri');
            }}
            className="text-xs font-semibold text-taupe bg-canvas border border-line px-3 py-1.5 rounded-lg hover:bg-sunken transition-colors"
          >
            Apply Monday to Tue-Fri
          </button>
        </div>
        <div className="space-y-3">
          {days.map(day => (
            <div key={day} className="flex items-center justify-between p-3 rounded-xl border border-line bg-canvas">
              <div className="flex items-center gap-4 w-32">
                <input
                  type="checkbox"
                  checked={operatingHours[day]?.is_open || false}
                  onChange={e => {
                    onHoursChange(day, 'is_open', e.target.checked);
                    // The time inputs below fall back to '09:00'/'18:00' only
                    // for DISPLAY when a day has no open/close yet — that
                    // fallback never gets written into real state on its own.
                    // Enabling a fresh day showed "09:00 to 18:00" looking
                    // fully set, but saving it kept 'open' (and sometimes
                    // 'close') entirely missing from the payload unless the
                    // owner happened to actually retype a value. Confirmed
                    // live: enabled Saturday, left the pre-filled times
                    // alone, saved, and it persisted with no 'open' key at
                    // all. Writing real defaults the moment a day is turned
                    // on keeps what's displayed and what's saved the same
                    // thing, always.
                    if (e.target.checked && !operatingHours[day]?.open) {
                      onHoursChange(day, 'open', operatingHours[day]?.open || '09:00');
                      onHoursChange(day, 'close', operatingHours[day]?.close || '18:00');
                    }
                  }}
                  className="w-4 h-4 text-taupe border-line rounded focus:ring-taupe"
                />
                <span className="text-sm font-medium text-ink capitalize">{day}</span>
              </div>
              <div className="flex items-center gap-3 flex-1 justify-end">
                {operatingHours[day]?.is_open ? (
                  <>
                    <input
                      type="time"
                      value={operatingHours[day]?.open || '09:00'}
                      onChange={e => onHoursChange(day, 'open', e.target.value)}
                      className="px-3 py-1.5 bg-surface border border-line rounded-lg text-sm text-ink focus:border-taupe outline-none"
                    />
                    <span className="text-ink-faint text-sm">to</span>
                    <input
                      type="time"
                      value={operatingHours[day]?.close || '18:00'}
                      onChange={e => onHoursChange(day, 'close', e.target.value)}
                      className="px-3 py-1.5 bg-surface border border-line rounded-lg text-sm text-ink focus:border-taupe outline-none"
                    />
                  </>
                ) : (
                  <span className="text-sm text-danger font-medium px-4 py-1.5 bg-danger/10 rounded-lg">
                    Closed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
