import React from 'react';
import { Clock, Pencil } from 'lucide-react';
import { StoreProfile } from '../types';
import { formatTime12h } from '../storeStorefrontHelpers';

interface StoreHoursTabProps {
  readonly store: StoreProfile;
  readonly isOwnerViewingOwnStore: boolean;
  readonly onOpenHoursModal: () => void;
}

export default function StoreHoursTab({
  store,
  isOwnerViewingOwnStore,
  onOpenHoursModal,
}: StoreHoursTabProps) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  return (
    <div className="max-w-md mx-auto">
      <div>
        <h3 className="text-xl font-bold text-ink mb-6 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Clock size={20} className="text-taupe" />
            Standard Operating Hours
          </span>
          {isOwnerViewingOwnStore && (
            <button
              type="button"
              onClick={onOpenHoursModal}
              className="flex items-center gap-1.5 text-xs font-semibold text-taupe hover:underline cursor-pointer"
            >
              <Pencil size={12} /> Edit
            </button>
          )}
        </h3>

        <div className="bg-surface border border-line rounded-2xl p-4">
          <div className="space-y-4">
            {days.map((day) => {
              const hours = store.operating_hours?.[day];
              if (!hours) return null;
              const isOpen = hours.is_open && hours.open && hours.close;
              return (
                <div
                  key={day}
                  className="flex justify-between items-center text-sm py-1 border-b border-line/50 last:border-0 last:pb-0"
                >
                  <span className="capitalize text-ink-body font-medium">{day}</span>
                  {isOpen ? (
                    <span className="text-ink font-bold bg-canvas px-3 py-1 rounded-lg">
                      {formatTime12h(hours.open)} – {formatTime12h(hours.close)}
                    </span>
                  ) : (
                    <span className="text-danger font-bold text-xs uppercase tracking-wider bg-danger/10 px-3 py-1 rounded-lg">
                      Closed
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
