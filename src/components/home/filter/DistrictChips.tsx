'use client';

import { useEffect, useRef } from 'react';
import { DAVAO_DISTRICTS } from '@/lib/davaoLocations';
import { useMouseScroll } from '@/hooks/useMouseScroll';

interface DistrictChipsProps {
  /** The chosen district, '' = all of Davao City. */
  readonly value: string;
  readonly onChange: (district: string) => void;
  /** One scrolling row (the map panel) instead of wrapping lines (the Filters sheet). */
  readonly row?: boolean;
}

const chip = (on: boolean) =>
  `flex h-11 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-sm transition-colors ${
    on ? 'border-ink bg-ink font-semibold text-white' : 'border-line bg-surface text-ink hover:border-ink'
  }`;

/**
 * Thesis objective "Map-Based Interface: filter shops by area" — Davao City's 11 districts, the same list as the
 * landing page's "Shops by district". Picking one filters the shops (server `?district=`, StoreBranch::placeFilter) and
 * the map outlines Davao City and highlights that district (DistrictHighlight). Tapping the chosen one again, or
 * "All Davao", clears it.
 *
 * The scrolling row: swipe on a phone or tablet; with a mouse, drag it or use the wheel (useMouseScroll). No arrow
 * buttons — the owner prefers the row clean (2026-11-10).
 */
export default function DistrictChips({ value, onChange, row = false }: DistrictChipsProps) {
  const ref = useRef<HTMLDivElement>(null);
  useMouseScroll(ref);

  // The chosen district (e.g. from a "Shops by district" link) is brought into view, not left cut off at the edge.
  useEffect(() => {
    if (!row) return;
    const box = ref.current;
    const on = box?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!on || !box) return;
    const left = on.offsetLeft - box.offsetLeft;
    if (left < box.scrollLeft || left + on.offsetWidth > box.scrollLeft + box.clientWidth) {
      box.scrollTo({ left: Math.max(0, left - 16), behavior: 'smooth' });
    }
  }, [row, value]);

  return (
    <div
      ref={ref}
      role="group"
      aria-label="Shops by district"
      className={row ? '-mx-3 flex select-none gap-2 overflow-x-auto px-3 pb-1 hide-scrollbar' : 'flex flex-wrap gap-2'}
    >
      <button type="button" aria-pressed={!value} onClick={() => onChange('')} className={chip(!value)}>
        All Davao
      </button>
      {DAVAO_DISTRICTS.map((d) => (
        <button key={d} type="button" aria-pressed={value === d} onClick={() => onChange(value === d ? '' : d)} className={chip(value === d)}>
          {d}
        </button>
      ))}
    </div>
  );
}
