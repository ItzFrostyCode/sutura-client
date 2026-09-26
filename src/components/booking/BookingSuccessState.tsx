'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, MapPin, Calendar, Clock, Shirt } from 'lucide-react';
import BookingHeader from './BookingHeader';
import { Branch } from './types';

interface BookingSuccessStateProps {
  readonly storeId: string;
  readonly storeName?: string;
  readonly appointmentType?: string;
  readonly selectedBranch?: Branch | null;
  readonly date?: string;
  readonly time?: string;
  readonly formatDatePreview?: (d: string) => string;
  readonly formatTimePreview?: (t: string) => string;
  readonly materialSource?: 'own' | 'shop' | '';
}

// Pending, not confirmed — the backend hasn't accepted this appointment yet
// (Appointment::STATUSES starts at 'pending'). This screen never claims
// "Confirmed"; it shows the same visit details the customer just submitted
// (where/when/why/what to bring) so nothing disappears the moment the form
// closes, matching what a real physical visit needs regardless of status.
export default function BookingSuccessState({
  storeId,
  storeName,
  appointmentType,
  selectedBranch,
  date,
  time,
  formatDatePreview,
  formatTimePreview,
  materialSource,
}: BookingSuccessStateProps) {
  const router = useRouter();
  const hasDetails = !!(appointmentType || selectedBranch || date);

  return (
    <div className="min-h-dvh flex flex-col bg-canvas text-ink">
      <BookingHeader onBack={() => router.push(`/store/${storeId}?tab=catalog`)} />
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="max-w-md w-full bg-surface p-6 sm:p-8 rounded-2xl border border-line">
          <div className="text-center">
            <div className="w-16 h-16 bg-sage/20 text-sage rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Appointment Request Sent</h2>
            <p className="text-ink-muted mb-6 text-sm">
              Waiting for {storeName || 'the store'} to confirm your slot. You&apos;ll see the update in
              My Appointments once they respond.
            </p>
          </div>

          {hasDetails && (
            <div className="space-y-3 text-left border-t border-line pt-5 mb-6">
              {appointmentType && (
                <div className="flex items-center gap-2.5">
                  <Shirt size={16} className="text-taupe shrink-0" />
                  <span className="text-sm text-ink-body">
                    Purpose: <span className="font-semibold text-ink capitalize">{appointmentType}</span>
                  </span>
                </div>
              )}
              {selectedBranch && (
                <div className="flex items-start gap-2.5">
                  <MapPin size={16} className="text-taupe shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-semibold text-ink">{selectedBranch.name}</span>
                    {selectedBranch.distanceKm !== null && selectedBranch.distanceKm !== undefined && (
                      <span className="text-ink-faint">
                        {' '}
                        —{' '}
                        {selectedBranch.distanceKm < 1
                          ? `${Math.round(selectedBranch.distanceKm * 1000)}m away`
                          : `${selectedBranch.distanceKm.toFixed(1)} km away`}
                      </span>
                    )}
                    {selectedBranch.address && <p className="text-ink-faint mt-0.5">{selectedBranch.address}</p>}
                  </div>
                </div>
              )}
              {date && formatDatePreview && (
                <div className="flex items-center gap-2.5">
                  <Calendar size={16} className="text-taupe shrink-0" />
                  <span className="text-sm text-ink-body">
                    {formatDatePreview(date)}
                    {time && formatTimePreview ? ` • ${formatTimePreview(time)}` : ''}
                  </span>
                </div>
              )}
              {time && !date && <Clock size={16} className="text-taupe shrink-0" />}
            </div>
          )}

          {materialSource && (
            <div className="bg-sunken border border-line rounded-xl p-4 mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-faint mb-2">What to Bring</p>
              {materialSource === 'own' ? (
                <p className="text-sm text-ink flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-sage shrink-0" /> Your fabric/sample
                </p>
              ) : (
                <p className="text-sm text-ink-muted">
                  The shop will discuss material options with you during your visit.
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => router.push(`/store/${storeId}?tab=catalog`)}
            className="w-full bg-sunken hover:bg-line text-ink font-medium py-3 rounded-lg transition-colors cursor-pointer text-sm"
          >
            Back to Catalog
          </button>
        </div>
      </div>
    </div>
  );
}
