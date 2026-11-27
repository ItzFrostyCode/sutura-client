'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PanelLeft } from 'lucide-react';

export type SidebarMode = 'expanded' | 'collapsed' | 'hover';

interface SidebarControlProps {
  readonly mode: SidebarMode;
  readonly onChange: (mode: SidebarMode) => void;
}

const OPTIONS: { id: SidebarMode; label: string }[] = [
  { id: 'expanded', label: 'Expanded' },
  { id: 'collapsed', label: 'Collapsed' },
  { id: 'hover', label: 'Expand on hover' },
];

/**
 * Sidebar width control, pinned to the bottom of the rail. Three explicit
 * modes rather than a binary toggle — "expand on hover" is the one people
 * actually want on a laptop: permanent icons, labels on demand, no click.
 */
export default function SidebarControl({ mode, onChange }: SidebarControlProps) {
  const [open, setOpen] = useState(false);
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

  return (
    <div className="relative" ref={ref}>
      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 mb-2 w-[196px] bg-surface border border-line rounded-xl overflow-hidden z-50 animate-rise"
        >
          <p className="px-3 py-2.5 text-xs font-medium text-ink-muted border-b border-line">
            Sidebar control
          </p>
          <div className="py-1">
            {OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { onChange(opt.id); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors min-h-[42px] ${
                  mode === opt.id ? 'text-ink font-semibold' : 'text-ink-body hover:bg-canvas'
                }`}
              >
                <span
                  aria-hidden
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${mode === opt.id ? 'bg-taupe' : 'bg-transparent'}`}
                />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="Sidebar control"
        aria-expanded={open}
        title="Sidebar control"
        className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-faint hover:text-ink hover:bg-sunken transition-colors"
      >
        <PanelLeft size={17} />
      </button>
    </div>
  );
}
