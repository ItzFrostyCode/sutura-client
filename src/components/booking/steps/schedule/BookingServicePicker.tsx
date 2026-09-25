import React from 'react';
import { StoreSettings } from '../../types';

interface BookingServicePickerProps {
  readonly needsServicePicker: boolean;
  readonly typesRequiringService: string[];
  readonly appointmentType: string;
  readonly selectedServiceId: string;
  readonly setSelectedServiceId: (val: string) => void;
  readonly storeSettings: StoreSettings | null;
  readonly needsOrderReference: boolean;
  readonly remarks: string;
  readonly setRemarks: (val: string) => void;
}

export default function BookingServicePicker({
  needsServicePicker,
  typesRequiringService,
  appointmentType,
  selectedServiceId,
  setSelectedServiceId,
  storeSettings,
  needsOrderReference,
  remarks,
  setRemarks,
}: BookingServicePickerProps) {
  return (
    <div className="space-y-4">
      {needsServicePicker && (
        <div className="space-y-1.5">
          <label htmlFor="booking-service" className="mobile-h4 text-ink block">
            Service{' '}
            {typesRequiringService.includes(appointmentType) ? (
              <span className="text-danger">*</span>
            ) : (
              <span className="text-ink-faint font-normal">(Optional)</span>
            )}
          </label>
          <select
            id="booking-service"
            value={selectedServiceId}
            required={typesRequiringService.includes(appointmentType)}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="w-full h-[52px] bg-canvas border border-line rounded-xl px-4 text-base text-ink focus:outline-none focus:border-taupe"
          >
            <option value="">
              {typesRequiringService.includes(appointmentType)
                ? 'Select a service...'
                : 'No specific service (General Consultation)'}
            </option>
            {storeSettings?.services?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.base_price ? `(₱${Number(s.base_price).toLocaleString()})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {needsOrderReference && (
        <div className="space-y-1.5">
          <label htmlFor="booking-order-reference" className="mobile-h4 text-ink block">
            Ongoing Order Number or Garment Description <span className="text-danger">*</span>
          </label>
          <input
            id="booking-order-reference"
            type="text"
            placeholder="e.g. Order #1002 or Blue Wedding Gown"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value.slice(0, 120))}
            className="w-full h-[52px] bg-canvas border border-line rounded-xl px-4 text-base text-ink focus:outline-none focus:border-taupe placeholder:text-ink-faint"
          />
          <p className="mobile-caption text-ink-faint">
            {appointmentType === 'pickup'
              ? 'Tell the store which finished order you’re coming to collect.'
              : 'Tell the designer which ongoing order you are coming in to fit.'}
          </p>
        </div>
      )}
    </div>
  );
}
