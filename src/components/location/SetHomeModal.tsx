'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { X, MapPin, Map as MapIcon, ChevronRight } from 'lucide-react';
import type { SavedLocation, HomeLocation } from '@/lib/customerLocation';

const LocationPicker = dynamic(() => import('@/components/discovery/LocationPicker'), { ssr: false });

interface SetHomeModalProps {
  readonly existing: HomeLocation | null;
  readonly onClose: () => void;
  readonly onSave: (loc: HomeLocation) => void;
}

export default function SetHomeModal({ existing, onClose, onSave }: SetHomeModalProps) {
  const [label, setLabel] = useState(existing?.label ?? 'My Home');
  const [chosen, setChosen] = useState<SavedLocation | null>(
    existing
      ? { lat: existing.lat, lng: existing.lng, address: existing.address, district: existing.district }
      : null
  );
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const frame = document.getElementById('mobile-frame-container');
    const prevFrameOverflow = frame ? frame.style.overflow : '';
    if (frame) {
      frame.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      if (frame) {
        frame.style.overflow = prevFrameOverflow;
      }
    };
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pointer-events-auto touch-none overscroll-contain">
        <button
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-default border-none p-0 focus:outline-none touch-none"
        />

        <div
          className="relative z-10 flex w-[calc(100%-32px)] max-w-[420px] touch-auto flex-col space-y-5 overflow-hidden rounded-[28px] bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h2 className="mobile-h3 text-ink">{existing ? 'Edit Home Address' : 'Set Home Address'}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>

          <div>
            <label htmlFor="home-label-input" className="text-xs font-semibold text-ink-muted mb-1.5 block">Label</label>
            <input
              id="home-label-input"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. My Home, Office, School"
              className="h-14 w-full rounded-2xl bg-sunken px-4 text-base text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-line-strong"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-muted mb-1.5 block">Address</label>
            {chosen ? (
              <div
                onClick={() => setShowPicker(true)}
                className="group flex min-h-[56px] w-full cursor-pointer items-start justify-between gap-3 rounded-2xl bg-sunken p-4 text-left transition-colors hover:bg-sunken-hover"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <MapPin size={20} className="mt-0.5 shrink-0 text-taupe" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">{chosen.address.split(',')[0]}</p>
                    <p className="mobile-caption text-ink-muted line-clamp-2 mt-0.5">{chosen.address}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPicker(true);
                  }}
                  className="flex min-h-[44px] shrink-0 items-center gap-1 self-center pl-1 text-sm text-taupe transition-colors hover:text-taupe-hover"
                >
                  <MapIcon size={14} />
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="flex min-h-[56px] w-full items-center justify-between gap-3 rounded-2xl bg-sunken p-4 text-left transition-colors hover:bg-sunken-hover"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <MapIcon size={20} className="shrink-0 text-taupe" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">Choose on Map</p>
                    <p className="mobile-caption text-ink-muted truncate">Pin your address on map</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-ink-faint shrink-0" />
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={!chosen}
            onClick={() => {
              if (!chosen) return;
              onSave({ ...chosen, label: label.trim() || 'My Home' });
            }}
            className="h-[52px] w-full rounded-full bg-ink text-base font-semibold text-white transition-colors hover:bg-taupe disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save Home Address
          </button>
        </div>
      </div>

      {showPicker && (
        <LocationPicker
          initial={chosen}
          confirmLabel="Set this Address"
          onClose={() => setShowPicker(false)}
          onConfirm={(pickedLoc) => {
            setChosen(pickedLoc);
            setShowPicker(false);
          }}
        />
      )}
    </>
  );
}
