'use client';

import React, { useState } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';
import { StoreSettings, BookingTypeOption } from '../types';
import BookingTypeSelector from './schedule/BookingTypeSelector';
import type { BookingKind } from '../hooks/useBookingWizard';
import PurposeLabelField from '@/components/appointments/PurposeLabelField';

interface BookingStep1PolicyProps {
  readonly storeSettings: StoreSettings | null;
  readonly availableBookingTypes: BookingTypeOption[];
  readonly appointmentType: string;
  readonly setAppointmentType: (val: string) => void;
  readonly kind?: BookingKind;
  readonly setKind?: (val: BookingKind) => void;
  readonly kindLocked?: boolean;
  readonly purposeLabel: string;
  readonly setPurposeLabel: (val: string) => void;
}

// Step 1 — purpose only. The customer is already authenticated by the time
// they reach here (useBookingWizard's auth gate), and already knows the
// shop/design/service context (shown in the persistent reference card above
// this step) — the only thing left to decide here is why they're coming in.
export default function BookingStep1Policy({
  storeSettings,
  availableBookingTypes,
  appointmentType,
  setAppointmentType,
  purposeLabel,
  setPurposeLabel,
}: BookingStep1PolicyProps) {
  const [policyOpen, setPolicyOpen] = useState(false);

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="mobile-h2 text-ink">Book a visit</h2>

      <div className="flex items-start gap-2.5 p-3.5 bg-sunken border border-line rounded-xl text-xs text-ink-body shadow-2xs">
        <MapPin size={16} className="text-taupe shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          This is a visit to the shop, not a delivery. Once the shop accepts your request, go to the shop on the day.
          Nothing is paid now.
        </p>
      </div>

      <BookingTypeSelector
        availableBookingTypes={availableBookingTypes}
        appointmentType={appointmentType}
        onSelectType={setAppointmentType}
      />

      {appointmentType === 'other' && (
        <PurposeLabelField
          value={purposeLabel}
          onChange={setPurposeLabel}
          label="What is it for?"
          placeholder="e.g. Fabric selection, Inquiry, Custom question"
          helperText="Tell the tailor what your visit is about"
        />
      )}

      {appointmentType === 'alteration' && (
        <PurposeLabelField
          value={purposeLabel}
          onChange={setPurposeLabel}
          label="What is it for?"
          placeholder="e.g. Barong hem shortening, Replace zipper, Suit resizing"
          helperText="Specify the garment and adjustment needed"
        />
      )}

      {storeSettings?.booking_policy && (
        <div className="border border-line rounded-xl overflow-hidden bg-surface shadow-2xs">
          <button
            type="button"
            onClick={() => setPolicyOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer hover:bg-canvas/40 transition-colors"
          >
            <span className="mobile-caption font-semibold text-ink-body">Booking Policy</span>
            <ChevronDown size={16} className={`text-ink-faint transition-transform ${policyOpen ? 'rotate-180' : ''}`} />
          </button>
          {policyOpen && (
            <div className="px-4 pb-4 text-xs text-ink-body whitespace-pre-wrap leading-relaxed border-t border-line pt-3">
              {storeSettings.booking_policy}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
