'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  readonly icon: ReactNode;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  /** Override the icon box's bg/border classes — used where the icon color
   * itself carries meaning (e.g. varies by selected service type). */
  readonly iconBoxClassName?: string;
  readonly defaultOpen: boolean;
  /** When this flips from false to true (e.g. the user ticks "Bulk Order"),
   * the section expands once. Never force-closes a section the user opened
   * or collapsed manually. */
  readonly forceOpenWhen?: boolean;
  readonly children: ReactNode;
}

export default function CollapsibleSection({
  icon,
  title,
  description,
  iconBoxClassName,
  defaultOpen,
  forceOpenWhen,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    const expandIfForced = () => {
      if (forceOpenWhen) setOpen(true);
    };
    expandIfForced();
  }, [forceOpenWhen]);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 border-b border-line pb-3 text-left"
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBoxClassName ?? 'bg-taupe/10 border border-taupe/20'}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-ink-body">{title}</h3>
          {description && <p className="text-[11px] text-ink-faint mt-0.5">{description}</p>}
        </div>
        <ChevronDown
          size={16}
          className={`text-ink-faint shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="space-y-4">{children}</div>}
    </div>
  );
}
