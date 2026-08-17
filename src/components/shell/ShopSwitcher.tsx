'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronsUpDown, Check, Search, Building2, MapPin, Settings } from 'lucide-react';
import { useBranch } from '@/context/BranchContext';
import { useAuthStore } from '@/store/useAuthStore';
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier';

/**
 * Header identity control: shop name + plan tier + branch switcher in one
 * unit, so the two things an owner needs to know at a glance ("which shop,
 * which plan") and the one thing they change often (branch) live together
 * instead of as three separate widgets.
 *
 * The tier reads as a bare badge — BASIC / PRO / PREMIUM — with no "plan"
 * label, since the word adds nothing next to the tier name itself.
 */
export default function ShopSwitcher() {
  const { shop } = useAuthStore();
  const { branches, selectedBranchId, setSelectedBranchId } = useBranch();
  const { tier, loading: tierLoading } = useSubscriptionTier();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

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

  if (!shop?.id) return null;

  const activeBranch = selectedBranchId === null
    ? null
    : branches.find(b => b.id === selectedBranchId);

  const filtered = query.trim()
    ? branches.filter(b => b.name.toLowerCase().includes(query.trim().toLowerCase()))
    : branches;

  return (
    <div className="relative flex items-center gap-2 min-w-0" ref={ref}>
      {/* Name and tier are labels, not controls — only the chevron is
          interactive, so the hover state lands on the thing you can actually
          click instead of highlighting the whole identity block. */}
      <span className="text-sm font-semibold text-ink truncate max-w-[120px] sm:max-w-[220px]">
        {shop.name}
      </span>

      {!tierLoading && (
        <span className="hidden sm:inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-ink-muted border border-line rounded-full px-2 py-0.5 shrink-0">
          {tier}
        </span>
      )}

      <button
        type="button"
        onClick={() => { setOpen(o => !o); setQuery(''); }}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Switch branch"
        title="Switch branch"
        className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-colors shrink-0 ${
          open
            ? 'bg-sunken border-line-strong text-ink'
            : 'border-transparent text-ink-faint hover:bg-sunken hover:border-line hover:text-ink-muted'
        }`}
      >
        <ChevronsUpDown size={14} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-[280px] bg-surface border border-line rounded-xl overflow-hidden z-50 animate-rise"
        >
          {branches.length > 4 && (
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line">
              <Search size={14} className="text-ink-faint shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Find branch…"
                aria-label="Find branch"
                className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
              />
            </div>
          )}

          <div className="max-h-[280px] overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => { setSelectedBranchId(null); setOpen(false); }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm transition-colors text-left min-h-[42px] ${
                selectedBranchId === null ? 'text-ink font-semibold bg-canvas' : 'text-ink-body hover:bg-canvas'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Building2 size={15} className="text-ink-muted shrink-0" />
                <span className="truncate">All Branches</span>
              </span>
              {selectedBranchId === null && <Check size={15} className="text-taupe shrink-0" />}
            </button>

            {filtered.map(b => (
              <button
                key={b.id}
                type="button"
                onClick={() => { setSelectedBranchId(b.id); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm transition-colors text-left min-h-[42px] ${
                  selectedBranchId === b.id ? 'text-ink font-semibold bg-canvas' : 'text-ink-body hover:bg-canvas'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <MapPin size={15} className="text-ink-muted shrink-0" />
                  <span className="truncate">{b.name}</span>
                </span>
                {selectedBranchId === b.id && <Check size={15} className="text-taupe shrink-0" />}
              </button>
            ))}

            {filtered.length === 0 && (
              <p className="px-3 py-4 text-xs text-ink-faint text-center">No branch matches that.</p>
            )}
          </div>

          <div className="border-t border-line">
            <Link
              href="/dashboard/branches"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-ink-body hover:bg-canvas hover:text-ink transition-colors min-h-[42px]"
            >
              <Settings size={15} className="text-ink-muted" />
              Manage branches
            </Link>
          </div>
        </div>
      )}

      {/* Screen readers get the active branch; sighted users see it in the
          dropdown's checkmark rather than duplicated in the trigger. */}
      <span className="sr-only">
        Current branch: {activeBranch?.name ?? 'All branches'}
      </span>
    </div>
  );
}
