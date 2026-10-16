'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, Monitor, MoreHorizontal, Settings } from 'lucide-react';

interface InboxMenuProps {
  readonly canMarkAll: boolean;
  readonly canClear?: boolean;
  readonly onMarkAll: () => void;
  readonly onClear?: () => void;
  /** In the bell's drop-down: also offer the full Notifications page. */
  readonly showOpenAll?: boolean;
  readonly onLeave?: () => void;
}

const item = 'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-ink transition-colors hover:bg-sunken active:bg-sunken';

/** The ⋯ button beside the title, as on Facebook: mark all as read, notification settings, open notifications (in the drop-down). */
export default function InboxMenu({ canMarkAll, onMarkAll, showOpenAll = false, onLeave }: InboxMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label="Notification options" aria-expanded={open} className="flex h-11 w-11 items-center justify-center rounded-full bg-sunken text-ink transition-opacity active:opacity-70">
        <MoreHorizontal size={20} />
      </button>
      {open && (
        <div className="card-soft absolute right-0 top-12 z-30 w-64 p-1.5">
          {canMarkAll && <button type="button" className={item} onClick={() => { onMarkAll(); setOpen(false); }}><Check size={18} /> Mark all as read</button>}
          <Link href="/account/settings/notifications" className={item} onClick={() => { setOpen(false); onLeave?.(); }}><Settings size={18} /> Notification settings</Link>
          {showOpenAll && <Link href="/notifications" className={item} onClick={() => { setOpen(false); onLeave?.(); }}><Monitor size={18} /> Open Notifications</Link>}
        </div>
      )}
    </div>
  );
}
