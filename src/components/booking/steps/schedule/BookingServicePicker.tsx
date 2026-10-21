import React from 'react';
import { StoreSettings } from '../../types';
import { getServicePriceLabel } from '@/lib/servicePricing';

interface BookingServicePickerProps {
  readonly needsServicePicker: boolean;
  readonly selectedServiceId: string;
  readonly setSelectedServiceId: (val: string) => void;
  readonly storeSettings: StoreSettings | null;
}

// A service visit needs the service it is for.
export default function BookingServicePicker({ needsServicePicker, selectedServiceId, setSelectedServiceId, storeSettings }: BookingServicePickerProps) {
  if (!needsServicePicker) return null;
  return (
    <div className="space-y-1.5">
      <label htmlFor="booking-service" className="mobile-h4 text-ink block">
        Service <span className="text-danger">*</span>
      </label>
      <select
        id="booking-service"
        value={selectedServiceId}
        required
        onChange={(e) => setSelectedServiceId(e.target.value)}
        className="w-full h-[52px] bg-canvas border border-line rounded-xl px-4 text-base text-ink focus:outline-none focus:border-taupe transition-colors shadow-xs"
      >
        <option value="">Select a service...</option>
        {storeSettings?.services?.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} — {getServicePriceLabel(s.base_price)}
          </option>
        ))}
      </select>
    </div>
  );
}
