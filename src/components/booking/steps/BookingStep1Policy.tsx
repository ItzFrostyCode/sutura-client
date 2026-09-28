'use client';

import React, { useState } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';
import { StoreSettings, BookingTypeOption } from '../types';
import BookingTypeSelector from './schedule/BookingTypeSelector';

interface BookingStep1PolicyProps {
  readonly storeSettings: StoreSettings | null;
  readonly availableBookingTypes: BookingTypeOption[];
  readonly appointmentType: string;
  readonly setAppointmentType: (val: string) => void;
  readonly showExistingOrderToggle: boolean;
  readonly hasExistingOrder: boolean;
  readonly setHasExistingOrder: (val: boolean) => void;
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
  showExistingOrderToggle,
  hasExistingOrder,
  setHasExistingOrder,
}: BookingStep1PolicyProps) {
  const [policyOpen, setPolicyOpen] = useState(false);

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="mobile-h2 text-ink">What are you coming in for?</h2>

      {/* Sets expectations up front, before the customer picks a purpose —
          a customer coming from a catalog item ("Book a Fitting") can easily
          read this as an online-checkout flow otherwise, then be surprised
          later that there's no delivery and they have to show up themselves. */}
      <div className="flex items-start gap-2.5 p-3 bg-sunken border border-line text-xs text-ink-body">
        <MapPin size={15} className="text-taupe shrink-0 mt-0.5" />
        <p>
          This books an in-person visit, not a delivery — once the store accepts your request,
          you&apos;ll need to go to the shop yourself on the scheduled date to be measured or fitted.
        </p>
      </div>

      <BookingTypeSelector
        availableBookingTypes={availableBookingTypes}
        appointmentType={appointmentType}
        onSelectType={setAppointmentType}
        showExistingOrderToggle={showExistingOrderToggle}
        hasExistingOrder={hasExistingOrder}
        onToggleExistingOrder={() => setHasExistingOrder(true)}
      />

      {storeSettings?.booking_policy && (
        <div className="border border-line rounded-none overflow-hidden">
          <button
            type="button"
            onClick={() => setPolicyOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer"
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
