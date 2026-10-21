'use client';

import React from 'react';
import { ChevronsUpDown, Building2, MapPin, Star } from 'lucide-react';
import { useBranch } from '@/context/BranchContext';
import { useAuthStore } from '@/store/useAuthStore';
import { SHOP_TRIGGER_ATTR } from './StoreBranchPanel';

/**
 * Header identity control: the store name and the branch being viewed. Pressing it opens the shop menu in the side
 * rail (`StoreBranchPanel`, owned by the dashboard layout), so this is only the trigger.
 */
export default function StoreSwitcher({ open, onToggle }: Readonly<{ open: boolean; onToggle: () => void }>) {
  const { store } = useAuthStore();
  const { branches, selectedBranchId } = useBranch();
  const all = Array.isArray(branches) ? branches : [];

  if (!store?.id) return null;
  const active = selectedBranchId === null ? null : all.find(b => b.id === selectedBranchId);

  return (
    <button
      type="button"
      {...{ [SHOP_TRIGGER_ATTR]: '' }}
      onClick={onToggle}
      aria-expanded={open}
      aria-haspopup="menu"
      aria-label="Switch branch location"
      title={`${store.name} • ${active ? active.name : 'All locations'}`}
      className={`flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-ink transition-colors hover:bg-sunken ${open ? 'bg-sunken' : ''}`}
    >
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-xs font-semibold text-ink">{store.name}</span>
        <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-medium text-ink-muted">
          {active ? (
            <>
              {active.is_main ? <Star size={10} className="shrink-0 fill-amber-500 text-amber-500" /> : <MapPin size={10} className="shrink-0" />}
              <span className="truncate">{active.name}</span>
            </>
          ) : (
            <>
              <Building2 size={10} className="shrink-0" />
              <span>All locations ({all.length})</span>
            </>
          )}
        </span>
      </span>
      <ChevronsUpDown size={13} className="shrink-0 text-ink-muted" />
    </button>
  );
}
