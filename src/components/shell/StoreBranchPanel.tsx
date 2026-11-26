'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, Search, Building2, MapPin, Settings, Star } from 'lucide-react';
import { useBranch } from '@/context/BranchContext';
import { useAuthStore } from '@/store/useAuthStore';
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier';

/** The trigger in the header carries this attribute so a click on it is not treated as "outside". */
export const SHOP_TRIGGER_ATTR = 'data-shop-trigger';

function Row({ active, onClick, icon, children }: Readonly<{ active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-3 text-left text-sm transition-colors ${
        active ? 'bg-sunken font-semibold text-ink' : 'text-ink-body hover:bg-sunken'
      }`}
    >
      <span className="flex min-w-0 items-center gap-2.5">{icon}<span className="truncate">{children}</span></span>
      {active && <Check size={15} className="shrink-0 text-taupe" />}
    </button>
  );
}

const Label = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">{children}</p>
);

/**
 * The shop menu. It opens in the side rail, in place of the navigation, at the rail's own width (a full-height
 * panel under the header, like a workspace switcher), so it lines up with the header box above it. On a phone it
 * slides over the page instead.
 */
export default function StoreBranchPanel({ onClose }: Readonly<{ onClose: () => void }>) {
  const { store } = useAuthStore();
  const { branches, selectedBranchId, setSelectedBranchId } = useBranch();
  const { tier, loading: tierLoading } = useSubscriptionTier();
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Element;
      if (ref.current?.contains(t) || t.closest(`[${SHOP_TRIGGER_ATTR}]`)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const all = Array.isArray(branches) ? branches : [];
  const q = query.trim().toLowerCase();
  const shown = q ? all.filter(b => b.name.toLowerCase().includes(q)) : all;
  const main = shown.find(b => b.is_main);
  const satellites = shown.filter(b => !b.is_main);
  const pick = (id: number | null) => { setSelectedBranchId(id); onClose(); };

  return (
    <div ref={ref} role="menu" className="flex h-full flex-col bg-surface animate-rise">
      <div className="border-b border-line px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-ink">{store?.name}</p>
            <p className="text-xs text-ink-muted">Store locations &amp; branch network</p>
          </div>
          {!tierLoading && (
            <span className="shrink-0 rounded-full bg-sunken px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-taupe-dark">{tier}</span>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {all.length > 4 && (
          <label className="mx-1 mt-3 flex h-11 items-center gap-2 rounded-lg border border-line bg-white px-3">
            <Search size={15} className="shrink-0 text-ink-faint" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find branch" aria-label="Find branch"
              className="w-full bg-transparent text-base text-ink placeholder:text-ink-faint focus:outline-none sm:text-sm" />
          </label>
        )}

        <div className="pt-3">
          <Row active={selectedBranchId === null} onClick={() => pick(null)} icon={<Building2 size={16} className="shrink-0 text-ink-muted" />}>
            All branches (combined)
          </Row>
        </div>

        {main && (
          <>
            <Label>Main branch</Label>
            <Row active={selectedBranchId === main.id} onClick={() => pick(main.id)} icon={<Star size={16} className="shrink-0 fill-amber-400 text-amber-500" />}>{main.name}</Row>
          </>
        )}

        {satellites.length > 0 && (
          <>
            <Label>Satellite branches ({satellites.length})</Label>
            {satellites.map(b => (
              <Row key={b.id} active={selectedBranchId === b.id} onClick={() => pick(b.id)} icon={<MapPin size={16} className="shrink-0 text-ink-muted" />}>{b.name}</Row>
            ))}
          </>
        )}

        {shown.length === 0 && <p className="px-3 py-4 text-center text-sm text-ink-muted">No branch matches that.</p>}
      </div>

      <div className="border-t border-line p-2">
        <Link href="/dashboard/branches" onClick={onClose} className="flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm text-ink-body transition-colors hover:bg-sunken hover:text-ink">
          <Settings size={16} className="text-ink-muted" />
          Manage branches &amp; satellites
        </Link>
      </div>
    </div>
  );
}
