'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LegalSectionData } from './legalTypes';
import { sectionsFor, type AudienceFilter } from './AudiencePicker';

const textOf = (s: LegalSectionData) =>
  `${s.title} ${s.blocks.map((b) => ('p' in b ? b.p : b.ul.join(' '))).join(' ')}`.toLowerCase();

/**
 * State for the legal reader: who is reading, what they typed in the search box, which sections are open, and which one
 * is on screen (so the contents list can follow the reader). A search opens every match.
 */
export function useLegalReader(sections: readonly LegalSectionData[]) {
  const [audience, setAudience] = useState<AudienceFilter>('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<ReadonlySet<number>>(new Set([sections[0]?.n]));
  const [active, setActive] = useState<number | null>(sections[0]?.n ?? null);

  const q = query.trim().toLowerCase();
  const visible = useMemo(() => sectionsFor(sections, audience).filter((s) => !q || textOf(s).includes(q)), [sections, audience, q]);
  const isOpen = (n: number) => q !== '' || open.has(n);

  const toggle = (n: number) => setOpen((cur) => { const next = new Set(cur); if (next.has(n)) next.delete(n); else next.add(n); return next; });
  const expandAll = () => setOpen(new Set(visible.map((s) => s.n)));
  const collapseAll = () => setOpen(new Set());
  const goTo = useCallback((n: number) => {
    setOpen((cur) => new Set(cur).add(n));
    requestAnimationFrame(() => document.getElementById(`s${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, []);

  // Follow the reader: the section nearest the top of the screen is the active one.
  useEffect(() => {
    const els = visible.map((s) => document.getElementById(`s${s.n}`)).filter((e): e is HTMLElement => !!e);
    if (els.length === 0) return;
    const io = new IntersectionObserver((entries) => {
      const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) setActive(Number(hit.target.id.slice(1)));
    }, { rootMargin: '-15% 0px -70% 0px' });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [visible]);

  return { audience, setAudience, query, setQuery, visible, isOpen, toggle, expandAll, collapseAll, goTo, active };
}

export type LegalReader = ReturnType<typeof useLegalReader>;
