import React from 'react';
import { StoreSettings } from '../../types';
import { getServicePriceLabel } from '@/lib/servicePricing';

interface BookingServicePickerProps {
  readonly needsServicePicker: boolean;
  readonly typesRequiringService: string[];
  readonly appointmentType: string;
  readonly selectedServiceId: string;
  readonly setSelectedServiceId: (val: string) => void;
  readonly storeSettings: StoreSettings | null;
  readonly needsOrderReference: boolean;
  readonly orderReference: string;
  readonly setOrderReference: (val: string) => void;
}

export default function BookingServicePicker({
  needsServicePicker,
  typesRequiringService,
  appointmentType,
  selectedServiceId,
  setSelectedServiceId,
  storeSettings,
  needsOrderReference,
  orderReference,
  setOrderReference,
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
            className="w-full h-[52px] bg-canvas border border-line rounded-none px-4 text-base text-ink focus:outline-none focus:border-taupe"
          >
            <option value="">
              {typesRequiringService.includes(appointmentType)
                ? 'Select a service...'
                : 'No specific service (General Consultation)'}
            </option>
            {storeSettings?.services?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {getServicePriceLabel(s.base_price)}
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
            value={orderReference}
            onChange={(e) => setOrderReference(e.target.value.slice(0, 120))}
            className="w-full h-[52px] bg-canvas border border-line rounded-none px-4 text-base text-ink focus:outline-none focus:border-taupe placeholder:text-ink-faint"
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
