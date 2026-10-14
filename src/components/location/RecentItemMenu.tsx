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
        className="flex h-11 w-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-sunken active:opacity-60"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="card-soft absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden p-1">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onUse();
            }}
            className="flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-3.5 text-sm text-ink transition-colors hover:bg-sunken"
          >
            <Navigation size={14} className="text-taupe" /> Use this
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-3.5 text-sm text-danger transition-colors hover:bg-danger/5"
          >
            <Trash2 size={14} /> Remove
          </button>
        </div>
      )}
    </div>
  );
}
