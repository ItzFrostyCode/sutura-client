'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Locate as LocateIcon } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { MapBranch } from './types';

const FindLocationMap = dynamic(() => import('@/components/profile/FindLocationMap'), { ssr: false });

interface CatalogFindInStoreSheetProps {
  showFind: boolean;
  onClose: () => void;
  findInteractive: boolean;
  mapBranches: MapBranch[];
  findSheetBranchId: number | null;
  setFindSheetBranchId: (id: number | null) => void;
  selectedFindBranch: MapBranch | null;
  userPos: { lat: number; lng: number } | null;
  onLocate: () => void;
  locating: boolean;
  locateError: string;
  selectedImage: string;
  itemName: string;
  itemPrice: string | number;
  showBookConfirm: boolean;
  setShowBookConfirm: (show: boolean) => void;
  selectedDistanceKm: number | null;
  nearerBranchSuggestion: { branch: MapBranch; km: number } | null;
  showBranchPickModal: boolean;
  setShowBranchPickModal: (show: boolean) => void;
  bookConfirmHref: string;
}

export default function CatalogFindInStoreSheet({
  showFind,
  onClose,
  findInteractive,
  mapBranches,
  findSheetBranchId,
  setFindSheetBranchId,
  selectedFindBranch,
  userPos,
  onLocate,
  locating,
  locateError,
  selectedImage,
  itemName,
  itemPrice,
  showBookConfirm,
  setShowBookConfirm,
  selectedDistanceKm,
  nearerBranchSuggestion,
  showBranchPickModal,
  setShowBranchPickModal,
  bookConfirmHref,
}: CatalogFindInStoreSheetProps) {
  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ease-out bg-surface max-w-[599px] sm:max-w-2xl mx-auto border-x border-line ${
        showFind
          ? 'translate-y-0 opacity-100 visible pointer-events-auto'
          : 'translate-y-full opacity-0 invisible pointer-events-none'
      }`}
    >
      {/* Map */}
      <div className="absolute inset-0 bg-surface">
        {(showFind || findInteractive) && mapBranches.length > 0 ? (
          <FindLocationMap
            branches={mapBranches}
            selectedBranchId={findSheetBranchId}
            onSelectBranch={setFindSheetBranchId}
            userPosition={userPos}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full bg-sunken flex items-center justify-center text-sm text-ink-faint">
            {mapBranches.length > 0 ? 'Loading map…' : 'Location not available'}
          </div>
        )}
      </div>

      {/* Top row */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-9 h-9 rounded-full bg-ink/50 backdrop-blur-sm text-white flex items-center justify-center shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
        {mapBranches.length > 0 && (
          <select
            value={findSheetBranchId ?? ''}
            onChange={(e) => setFindSheetBranchId(e.target.value ? Number(e.target.value) : null)}
            className="flex-1 min-w-0 bg-ink/50 backdrop-blur-sm border border-white/20 rounded-none px-4 py-2 text-xs font-semibold text-white shadow-sm focus:outline-none"
          >
            <option value="">All Branches</option>
            {mapBranches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Floating place card */}
      <div
        className="absolute left-[10px] right-[10px] bottom-[10px] z-[1000] bg-surface rounded-none border border-line shadow-lg p-3"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <button
          type="button"
          onClick={onLocate}
          disabled={locating}
          aria-label={locating ? 'Locating…' : userPos ? 'Located' : 'Locate me'}
          className="absolute -top-[50px] right-0 z-[1000] w-10 h-10 rounded-full bg-ink/60 backdrop-blur-sm text-white shadow-md flex items-center justify-center transition-colors disabled:opacity-50"
        >
          <LocateIcon size={18} className={locating ? 'animate-pulse' : ''} />
        </button>

        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 rounded-none overflow-hidden border border-line shrink-0 bg-sunken">
            {selectedImage && (
              <Image src={getMediaUrl(selectedImage)} alt={itemName} fill className="object-cover object-top" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-ink">₱{Number(itemPrice).toLocaleString()}</p>
            <p className="text-sm font-semibold text-ink-body truncate">{itemName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          {selectedFindBranch ? (
            <a
              href={`https://www.google.com/maps/dir/?api=1&${userPos ? `origin=${userPos.lat},${userPos.lng}&` : ''}destination=${selectedFindBranch.latitude},${selectedFindBranch.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 border border-line-strong hover:border-ink text-ink-body font-medium py-2.5 transition-colors flex items-center justify-center rounded-none text-xs"
            >
              Direction
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="Choose a branch above first"
              className="flex-1 bg-sunken text-ink-faint font-medium py-2.5 rounded-none text-xs cursor-not-allowed"
            >
              Direction
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              selectedFindBranch ? setShowBookConfirm(true) : setShowBranchPickModal(true);
            }}
            className="flex-[1.3] bg-ink hover:bg-taupe text-white font-medium py-2.5 px-2 transition-colors flex items-center justify-center rounded-none text-xs whitespace-nowrap"
          >
            Book a Fitting
          </button>
        </div>
        {locateError && <p className="text-xs text-danger mt-2">{locateError}</p>}
      </div>

      {/* Book confirmation modal */}
      {showBookConfirm && selectedFindBranch && (
        <div
          className="fixed inset-0 z-[2000] bg-ink/50 flex items-end justify-center"
          onClick={() => setShowBookConfirm(false)}
        >
          <div
            className="bg-surface w-full max-w-[599px] mx-auto border-x border-line rounded-t-2xl p-4"
            style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-ink">Book at {selectedFindBranch.name}?</h3>
            <p className="text-sm text-ink-body mt-1">
              {selectedDistanceKm !== null
                ? `This branch is about ${selectedDistanceKm.toFixed(1)} km from your located position.`
                : "You're about to book a fitting at this branch."}
            </p>
            {nearerBranchSuggestion && (
              <p className="text-xs text-taupe bg-taupe/5 border border-taupe/20 rounded-none p-2.5 mt-3">
                💡 {nearerBranchSuggestion.branch.name} is closer to you ({nearerBranchSuggestion.km.toFixed(1)} km) — consider booking there instead.
              </p>
            )}
            <div className="flex items-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowBookConfirm(false)}
                className="flex-1 border border-line-strong hover:border-ink text-ink-body font-medium py-2.5 transition-colors flex items-center justify-center rounded-none text-xs"
              >
                Back
              </button>
              <Link
                href={bookConfirmHref}
                className="flex-[1.3] bg-ink hover:bg-taupe text-white font-medium py-2.5 transition-colors flex items-center justify-center rounded-none text-xs"
              >
                Continue
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Branch pick modal */}
      {showBranchPickModal && (
        <div
          className="fixed inset-0 z-[2000] bg-ink/50 flex items-end justify-center"
          onClick={() => setShowBranchPickModal(false)}
        >
          <div
            className="bg-surface w-full max-w-[599px] mx-auto border-x border-line rounded-t-2xl p-4"
            style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-ink">Which branch?</h3>
            <p className="text-sm text-ink-body mt-1">Choose which branch you&apos;d like to book a fitting at.</p>
            <div className="flex flex-col gap-2 mt-3">
              {mapBranches.map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setFindSheetBranchId(b.id);
                    setShowBranchPickModal(false);
                  }}
                  className="w-full text-left px-4 py-2.5 rounded-none border border-line-strong hover:border-ink text-sm font-semibold text-ink-body transition-colors"
                >
                  {b.name}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowBranchPickModal(false)}
              className="w-full text-center text-xs font-semibold text-ink-faint mt-4"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
