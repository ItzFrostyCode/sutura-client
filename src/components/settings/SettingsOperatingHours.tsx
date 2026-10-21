import React from 'react';

interface SettingsOperatingHoursProps {
  readonly operatingHours: Record<string, { is_open: boolean; open: string; close: string }>;
  readonly onHoursChange: (day: string, field: 'is_open' | 'open' | 'close', value: string | boolean) => void;
}

export default function SettingsOperatingHours({
  operatingHours,
  onHoursChange,
}: SettingsOperatingHoursProps) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="space-y-4">
      <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
        Set the regular hours your store is open for business. Customers will use this to book appointments.
      </p>

      <div className="space-y-2 sm:space-y-2.5">
        {days.map((day) => (
          <div
            key={day}
            className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-line bg-canvas hover:border-line-strong transition-colors"
          >
            <div className="flex items-center gap-3 w-28 sm:w-32 shrink-0">
              <input
                type="checkbox"
                id={`hours-${day}`}
                checked={operatingHours[day]?.is_open || false}
                onChange={(e) => {
                  onHoursChange(day, 'is_open', e.target.checked);
                  if (e.target.checked && !operatingHours[day]?.open) {
                    onHoursChange(day, 'open', operatingHours[day]?.open || '09:00');
                    onHoursChange(day, 'close', operatingHours[day]?.close || '18:00');
                  }
                }}
                className="w-4 h-4 text-taupe border-line rounded focus:ring-taupe cursor-pointer"
              />
              <label
                htmlFor={`hours-${day}`}
                className="text-sm font-medium text-ink capitalize cursor-pointer select-none"
              >
                {day}
              </label>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
              {operatingHours[day]?.is_open ? (
                <>
                  <input
                    type="time"
                    value={operatingHours[day]?.open || '09:00'}
                    onChange={(e) => onHoursChange(day, 'open', e.target.value)}
                    aria-label={`${day} opening time`}
                    className="px-2.5 sm:px-3 py-1.5 bg-surface border border-line rounded-lg text-xs sm:text-sm text-ink focus:border-taupe outline-none min-h-[38px]"
                  />
                  <span className="text-ink-faint text-xs sm:text-sm">to</span>
                  <input
                    type="time"
                    value={operatingHours[day]?.close || '18:00'}
                    onChange={(e) => onHoursChange(day, 'close', e.target.value)}
                    aria-label={`${day} closing time`}
                    className="px-2.5 sm:px-3 py-1.5 bg-surface border border-line rounded-lg text-xs sm:text-sm text-ink focus:border-taupe outline-none min-h-[38px]"
                  />
                </>
              ) : (
                <span className="text-xs sm:text-sm text-danger font-medium px-3 sm:px-4 py-1.5 bg-danger/10 rounded-lg">
                  Closed
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
