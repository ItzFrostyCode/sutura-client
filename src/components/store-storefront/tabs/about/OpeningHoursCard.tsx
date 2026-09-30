import React from 'react';
import { Clock, Pencil } from 'lucide-react';
import { StoreProfile } from '../../types';
import { formatTime12h } from '../../storeStorefrontHelpers';

const DAYS: { key: string; label: string }[] = [
  { key: 'sunday', label: 'Sunday' },
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
];

interface OpeningHoursCardProps {
  readonly operatingHours: StoreProfile['operating_hours'];
  readonly isStoreCurrentlyOpen: boolean;
  readonly canEdit: boolean;
  readonly onOpenHoursModal: () => void;
}

// Hours already has its own working, immediately-reflecting edit flow (a
// dedicated modal + a targeted local merge back into the storefront's
// `store` state) — kept as-is rather than folded into the shared
// EditableCard pattern used by the other cards on this tab.
export default function OpeningHoursCard({
  operatingHours,
  isStoreCurrentlyOpen,
  canEdit,
  onOpenHoursModal,
}: OpeningHoursCardProps) {
  return (
    <div className="bg-surface border border-line p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-taupe" />
          <h3 className="mobile-h4 text-ink">Opening hours</h3>
        </div>
        <span
          className={`text-xs font-semibold px-3 py-1 border ${
            isStoreCurrentlyOpen
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
              : 'text-ink-muted bg-sunken border-line'
          }`}
        >
          {isStoreCurrentlyOpen ? 'Open now' : 'Closed now'}
        </span>
      </div>
      <div className="space-y-1 text-sm">
        {DAYS.map(({ key, label }) => {
          const dayHours = operatingHours?.[key];
          const isToday =
            DAYS.map((d) => d.key)[new Date().getDay()] === key;
          const isOpen = dayHours?.is_open && dayHours.open && dayHours.close;

          return (
            <div
              key={key}
              className={`flex items-center justify-between py-2 px-2.5 transition-colors ${
                isToday ? 'bg-taupe/10 font-medium' : 'text-ink-body font-normal'
              }`}
            >
              <span className={`capitalize ${isToday ? 'font-semibold text-ink' : 'text-ink-body'}`}>
                {label} {isToday && <span className="text-[11px] text-taupe font-semibold ml-1">(Today)</span>}
              </span>
              {isOpen ? (
                <span className={`font-medium ${isToday ? 'text-ink font-semibold' : 'text-ink-body'}`}>
                  {formatTime12h(dayHours.open)} – {formatTime12h(dayHours.close)}
                </span>
              ) : (
                <span className="text-ink-faint font-normal">Closed</span>
              )}
            </div>
          );
        })}
      </div>
      {canEdit && (
        <button
          type="button"
          onClick={onOpenHoursModal}
          className="mt-3 min-h-[44px] text-xs font-semibold text-taupe hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <Pencil size={13} /> Edit Hours
        </button>
      )}
    </div>
  );
}
