'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronsUpDown, Check, Search, Building2, MapPin, Settings, Star } from 'lucide-react';
import { useBranch } from '@/context/BranchContext';
import { useAuthStore } from '@/store/useAuthStore';
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier';

/**
 * Header identity control: store name + plan tier + branch switcher in one
 * unit. The trigger explicitly displays BOTH the store name and the active
 * branch (with Main Branch / Satellite distinction) so users and panels
 * see the current location immediately without hovering.
 */
export default function StoreSwitcher() {
  const { store } = useAuthStore();
  const { branches, selectedBranchId, setSelectedBranchId } = useBranch();
  const { tier, loading: tierLoading } = useSubscriptionTier();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const safeBranches = Array.isArray(branches) ? branches : [];

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!store?.id) return null;

  const activeBranch = selectedBranchId === null
    ? null
    : safeBranches.find(b => b.id === selectedBranchId);

  const filtered = query.trim()
    ? safeBranches.filter(b => b.name.toLowerCase().includes(query.trim().toLowerCase()))
    : safeBranches;

  const mainBranch = filtered.find(b => b.is_main);
  const satelliteBranches = filtered.filter(b => !b.is_main);

  return (
    <div className="relative flex items-center min-w-0 flex-1" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setQuery(''); }}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Switch branch location"
        title={`${store.name} • ${activeBranch ? activeBranch.name : 'All Locations'}`}
        className={`flex items-center justify-between gap-2 min-w-0 flex-1 px-2.5 py-1.5 rounded-lg transition-colors text-left cursor-pointer ${
          open ? 'bg-sunken text-ink' : 'hover:bg-sunken text-ink'
        }`}
      >
        <div className="flex flex-col min-w-0 flex-1 leading-tight">
          <span className="text-xs font-bold truncate text-ink">
            {store.name}
          </span>
          <div className="flex items-center gap-1 text-[11px] font-medium text-ink-muted mt-0.5 truncate">
            {activeBranch ? (
              activeBranch.is_main ? (
                <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 font-semibold truncate">
                  <Star size={10} className="fill-amber-500 text-amber-500 shrink-0" />
                  <span className="truncate">{activeBranch.name}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-taupe font-semibold truncate">
                  <MapPin size={10} className="shrink-0" />
                  <span className="truncate">{activeBranch.name}</span>
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1 text-ink-muted truncate">
                <Building2 size={10} className="shrink-0" />
                <span>All Locations ({safeBranches.length})</span>
              </span>
            )}
          </div>
        </div>
        <ChevronsUpDown size={13} className="text-ink-muted shrink-0" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-2 w-[280px] sm:w-[320px] bg-surface border border-line rounded-xl shadow-xl z-50 animate-rise overflow-hidden"
        >
          {/* Store Name & Plan Tier Header */}
          <div className="px-3.5 py-2.5 bg-canvas/70 border-b border-line flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-ink truncate">{store.name}</p>
              <p className="text-[10px] text-ink-muted">Store Locations & Branch Network</p>
            </div>
            {!tierLoading && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-taupe bg-taupe/10 border border-taupe/20 rounded-md px-2 py-0.5 shrink-0">
                {tier}
              </span>
            )}
          </div>

          {safeBranches.length > 4 && (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-line bg-surface">
              <Search size={14} className="text-ink-faint shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Find branch…"
                aria-label="Find branch"
                className="w-full bg-transparent text-xs text-ink placeholder:text-ink-faint focus:outline-none"
              />
            </div>
          )}

          <div className="max-h-[300px] overflow-y-auto py-1">
            {/* All Branches Option */}
            <button
              type="button"
              onClick={() => { setSelectedBranchId(null); setOpen(false); }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs transition-colors text-left min-h-[38px] ${
                selectedBranchId === null ? 'text-ink font-semibold bg-canvas' : 'text-ink-body hover:bg-canvas'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Building2 size={14} className="text-ink-muted shrink-0" />
                <span className="truncate">All Branches (Consolidated View)</span>
              </span>
              {selectedBranchId === null && <Check size={14} className="text-taupe shrink-0" />}
            </button>

            {/* 🌟 Primary Headquarters Section */}
            {mainBranch && (
              <div className="mt-1 pt-1 border-t border-line/60">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  <Star size={10} className="fill-amber-500 text-amber-500" />
                  <span>Headquarters</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedBranchId(mainBranch.id); setOpen(false); }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs transition-colors text-left min-h-[38px] ${
                    selectedBranchId === mainBranch.id ? 'text-ink font-semibold bg-canvas' : 'text-ink-body hover:bg-canvas'
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Star size={14} className="fill-amber-400 text-amber-500 shrink-0" />
                    <span className="truncate">{mainBranch.name}</span>
                  </span>
                  {selectedBranchId === mainBranch.id && <Check size={14} className="text-taupe shrink-0" />}
                </button>
              </div>
            )}

            {/* 🏢 Satellite Branches Section */}
            {satelliteBranches.length > 0 && (
              <div className="mt-1 pt-1 border-t border-line/60">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  Satellite Branches ({satelliteBranches.length})
                </div>
                {satelliteBranches.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => { setSelectedBranchId(b.id); setOpen(false); }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs transition-colors text-left min-h-[38px] ${
                      selectedBranchId === b.id ? 'text-ink font-semibold bg-canvas' : 'text-ink-body hover:bg-canvas'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <MapPin size={14} className="text-ink-muted shrink-0" />
                      <span className="truncate">{b.name}</span>
                    </span>
                    {selectedBranchId === b.id && <Check size={14} className="text-taupe shrink-0" />}
                  </button>
                ))}
              </div>
            )}

            {filtered.length === 0 && (
              <p className="px-3 py-3 text-xs text-ink-faint text-center">No branch matches that.</p>
            )}
          </div>

          <div className="border-t border-line bg-canvas/30">
            <Link
              href="/dashboard/branches"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-ink-body hover:bg-canvas hover:text-ink transition-colors min-h-[38px]"
            >
              <Settings size={14} className="text-ink-muted" />
              Manage branches & satellites
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
