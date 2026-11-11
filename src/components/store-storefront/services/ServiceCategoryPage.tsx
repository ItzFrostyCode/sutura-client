'use client';

import { useEffect } from 'react';
import { Check, X } from 'lucide-react';

export interface ServiceCategoryOption {
  readonly key: string;
  readonly label: string;
  readonly count: number;
}

interface ServiceCategoryPageProps {
  readonly open: boolean;
  readonly active: string;
  readonly options: ServiceCategoryOption[];
  readonly onPick: (key: string) => void;
  readonly onClose: () => void;
}

/**
 * "Service Categories", opened from the round filter button on a shop's Services tab: a full page (the same on a
 * phone, a tablet and desktop — the list sits in a centred column on wide screens) with one 56px row per category
 * and how many services it has. Picking one closes the page; the tab then scrolls down to those services.
 */
export default function ServiceCategoryPage({ open, active, options, onPick, onClose }: ServiceCategoryPageProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="service-categories-title" className="fixed inset-0 z-[70] flex flex-col bg-surface">
      <div className="border-b border-line">
        <div className="mx-auto flex h-14 w-full max-w-xl items-center justify-between px-4">
          <h2 id="service-categories-title" className="mobile-h3 font-semibold text-ink">Service Categories</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-sunken">
            <X size={22} aria-hidden />
          </button>
        </div>
      </div>
      <ul className="mx-auto w-full max-w-xl flex-1 overflow-y-auto px-4 py-2">
        {options.map((o) => {
          const on = o.key === active;
          return (
            <li key={o.key}>
              <button
                type="button"
                onClick={() => onPick(o.key)}
                aria-pressed={on}
                className={`flex min-h-14 w-full items-center gap-3 border-b border-line px-1 text-left transition-colors hover:bg-sunken/60 ${on ? 'font-semibold text-ink' : 'text-ink'}`}
              >
                <span className="mobile-body-md min-w-0 flex-1 break-words">{o.label}</span>
                <span className="mobile-body-sm shrink-0 tabular-nums text-ink-muted">{o.count}</span>
                <span className="flex w-6 shrink-0 justify-center text-taupe-dark">{on && <Check size={20} aria-hidden />}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
