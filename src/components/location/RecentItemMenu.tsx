'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MoreVertical, Navigation, Trash2 } from 'lucide-react';

interface RecentItemMenuProps {
  readonly onUse: () => void;
  readonly onDelete: () => void;
}

export default function RecentItemMenu({ onUse, onDelete }: RecentItemMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0 self-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="More options"
        className="w-8 h-8 flex items-center justify-center rounded-full text-ink-muted hover:bg-sunken active:opacity-60 transition-colors cursor-pointer"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-surface border border-line rounded-xl shadow-lg z-50 overflow-hidden">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onUse();
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-ink hover:bg-sunken transition-colors cursor-pointer"
          >
            <Navigation size={14} className="text-taupe" /> Use this
          </button>
          <div className="h-px bg-line" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-danger hover:bg-danger/5 transition-colors cursor-pointer"
          >
            <Trash2 size={14} /> Remove
          </button>
        </div>
      )}
    </div>
  );
}
