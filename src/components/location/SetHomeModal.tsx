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
          className="relative bg-surface rounded-2xl shadow-2xl flex flex-col w-[calc(100%-32px)] max-w-[420px] overflow-hidden z-10 animate-in zoom-in-95 duration-200 border border-line p-5 space-y-4 touch-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-2 border-b border-line/60">
            <h2 className="mobile-h3 font-bold text-ink">{existing ? 'Edit Home Address' : 'Set Home Address'}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-10 h-10 -mr-1 flex items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-sunken transition-colors cursor-pointer"
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
              className="w-full bg-sunken border border-line rounded-xl px-3.5 py-3 text-base text-ink placeholder:text-ink-faint focus:outline-none focus:border-taupe"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-muted mb-1.5 block">Address</label>
            {chosen ? (
              <div
                onClick={() => setShowPicker(true)}
                className="w-full flex items-start justify-between gap-3 p-3 bg-sunken border border-line rounded-xl hover:border-taupe cursor-pointer transition-all text-left group min-h-[56px]"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-full bg-taupe/10 flex items-center justify-center shrink-0 mt-0.5 text-taupe">
                    <MapPin size={16} />
                  </div>
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
                  className="shrink-0 text-xs font-semibold text-taupe hover:underline flex items-center gap-1 self-center pl-1 py-1 cursor-pointer"
                >
                  <MapIcon size={14} />
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="w-full flex items-center justify-between gap-3 p-3.5 bg-sunken border border-line rounded-xl hover:border-taupe hover:bg-taupe/5 transition-all text-left cursor-pointer min-h-[56px]"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-full bg-taupe/10 flex items-center justify-center shrink-0 text-taupe">
                    <MapIcon size={16} />
                  </div>
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
            className="w-full btn-primary-mobile bg-taupe hover:bg-taupe-hover text-white text-base font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer active:scale-[0.99]"
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
