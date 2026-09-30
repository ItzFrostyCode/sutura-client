'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowLeft, Locate as LocateIcon, MapPin, Check } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import type { MapBranch } from './types';

interface CatalogFindSidebarProps {
  readonly branches: MapBranch[];
  readonly selectedId: number | null;
  readonly onSelect: (id: number | null) => void;
  readonly selected: MapBranch | null;
  readonly userPos: { lat: number; lng: number } | null;
  readonly onLocate: () => void;
  readonly locating: boolean;
  readonly locateError: string;
  readonly image: string;
  readonly itemName: string;
  readonly itemPrice: string | number;
  readonly onBook: () => void;
}

const dirHref = (b: MapBranch, pos: { lat: number; lng: number } | null) =>
  `https://www.google.com/maps/dir/?api=1&${pos ? `origin=${pos.lat},${pos.lng}&` : ''}destination=${b.latitude},${b.longitude}`;

// Tablet/desktop (768px+) side panel of Find a Branch — same shape as the /map page:
// branches to choose from on top, the design and its actions pinned at the bottom.
export default function CatalogFindSidebar({ branches, selectedId, onSelect, selected, userPos, onLocate, locating, locateError, image, itemName, itemPrice, onBook }: Readonly<CatalogFindSidebarProps>) {
  return (
    <aside className="hidden md:flex absolute top-16 right-0 bottom-0 w-[380px] z-[1000] flex-col bg-canvas border-l border-line">
      <div className="px-5 py-4 border-b border-line flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Branches</p>
        <button
          type="button"
          onClick={onLocate}
          disabled={locating}
          className="h-9 px-3 border border-line-strong bg-white text-xs font-semibold text-ink flex items-center gap-1.5 cursor-pointer hover:bg-sunken disabled:opacity-50"
        >
          <LocateIcon size={14} className={locating ? 'animate-pulse' : ''} /> {userPos ? 'Located' : 'Near me'}
        </button>
      </div>
      {locateError && <p className="px-5 pt-2 text-xs text-danger">{locateError}</p>}

      <ul className="flex-1 overflow-y-auto divide-y divide-line">
        {branches.length === 0 ? (
          <li className="px-5 py-8 text-sm text-ink-faint">No branch locations available.</li>
        ) : branches.map((b) => {
          const on = b.id === selectedId;
          return (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => onSelect(on ? null : b.id)}
                aria-pressed={on}
                className={`w-full text-left px-5 min-h-16 py-3 flex items-center gap-3 cursor-pointer transition-colors ${on ? 'bg-white border-l-2 border-ink' : 'hover:bg-sunken border-l-2 border-transparent'}`}
              >
                <MapPin size={16} className="text-taupe shrink-0" />
                <span className="flex-1 min-w-0 text-sm font-semibold text-ink truncate">{b.name}</span>
                {on && <Check size={16} className="text-ink shrink-0" />}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-line bg-white p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 overflow-hidden border border-line shrink-0 bg-sunken">
            {image && <Image src={getMediaUrl(image)} alt={itemName} fill className="object-cover object-top" />}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-ink">₱{Number(itemPrice).toLocaleString()}</p>
            <p className="text-sm font-semibold text-ink-body truncate">{itemName}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {selected ? (
            <a href={dirHref(selected, userPos)} target="_blank" rel="noopener noreferrer" className="flex-1 h-12 border border-line-strong hover:border-ink text-ink-body text-sm font-medium flex items-center justify-center">Direction</a>
          ) : (
            <button type="button" disabled title="Choose a branch first" className="flex-1 h-12 bg-sunken text-ink-faint text-sm font-medium cursor-not-allowed">Direction</button>
          )}
          <button type="button" onClick={onBook} className="flex-[1.3] h-12 bg-ink hover:bg-taupe text-white text-sm font-semibold flex items-center justify-center whitespace-nowrap transition-colors cursor-pointer">Book a Fitting</button>
        </div>
      </div>
    </aside>
  );
}

export function CatalogFindHeader({ onClose, count }: Readonly<{ onClose: () => void; count: number }>) {
  return (
    <header className="hidden md:flex absolute top-0 left-0 right-0 h-16 z-[1100] items-center gap-3 px-6 border-b border-line bg-canvas">
      <button type="button" onClick={onClose} aria-label="Back" className="p-1.5 text-ink-muted hover:text-ink rounded-lg hover:bg-sunken transition-colors cursor-pointer">
        <ArrowLeft size={18} />
      </button>
      <div className="flex flex-col">
        <span className="flex items-center gap-1.5 text-sm font-bold text-ink tracking-tight"><MapPin size={14} /> Find a Branch</span>
        <span className="text-[11px] text-ink-faint leading-none">Select a branch to book your fitting</span>
      </div>
      <span className="ml-auto text-[11px] font-semibold text-ink-muted bg-sunken px-2.5 py-1">{count} {count === 1 ? 'branch' : 'branches'}</span>
    </header>
  );
}
