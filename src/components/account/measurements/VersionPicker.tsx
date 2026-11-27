'use client';

import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { MyMeasurement } from './measurementAccountTypes';

/**
 * Which version of a measurement profile is shown. One fixed-size control however many versions there are (2 or 50+):
 * ‹ older · a dropdown to jump to any version (newest first) · newer ›. One version just reads "Version 1".
 * "Latest" marks the newest; `usedId` marks the one a job order was made with, with a link back to it.
 * `versions` are oldest first (version 1 = index 0).
 */
export default function VersionPicker({ versions, selectedId, onSelect, usedId }: {
  readonly versions: MyMeasurement[];
  readonly selectedId: number;
  readonly onSelect: (id: number) => void;
  readonly usedId?: number;
}) {
  const total = versions.length;
  const index = Math.max(0, versions.findIndex((v) => v.id === selectedId));
  const usedIndex = usedId ? versions.findIndex((v) => v.id === usedId) : -1;
  const tags = [
    total > 1 && index === total - 1 ? 'Latest' : null,
    usedId === selectedId ? 'Used for this order' : null,
  ].filter(Boolean);
  const arrow = 'flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface hover:text-ink disabled:pointer-events-none disabled:opacity-30';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {total > 1 ? (
        <div className="flex items-center rounded-full bg-sunken p-0.5">
          <button type="button" onClick={() => onSelect(versions[index - 1].id)} disabled={index === 0} aria-label="Older version" className={arrow}>
            <ChevronLeft size={16} />
          </button>
          <label className="relative">
            <span className="sr-only">Version</span>
            <select
              value={selectedId}
              onChange={(e) => onSelect(Number(e.target.value))}
              className="h-8 cursor-pointer appearance-none rounded-full bg-surface pl-3 pr-7 text-xs font-semibold text-ink shadow-[0_1px_3px_rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-line-strong"
            >
              {[...versions].reverse().map((v) => {
                const n = versions.indexOf(v) + 1;
                return <option key={v.id} value={v.id}>Version {n} of {total}{n === total ? ' · latest' : ''}{v.id === usedId ? ' · this order' : ''}</option>;
              })}
            </select>
            <ChevronDown size={12} aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          </label>
          <button type="button" onClick={() => onSelect(versions[index + 1].id)} disabled={index === total - 1} aria-label="Newer version" className={arrow}>
            <ChevronRight size={16} />
          </button>
        </div>
      ) : (
        <span className="rounded-full bg-sunken px-3 py-1 text-xs font-semibold text-ink-muted">Version 1</span>
      )}
      {tags.map((t) => <span key={t} className="rounded-full bg-taupe/10 px-2 py-0.5 text-[11px] font-semibold text-taupe-dark">{t}</span>)}
      {usedId && usedIndex >= 0 && usedId !== selectedId && (
        <button type="button" onClick={() => onSelect(usedId)} className="text-xs font-semibold text-taupe underline underline-offset-2">
          Show the one used for this order (v{usedIndex + 1})
        </button>
      )}
    </div>
  );
}
