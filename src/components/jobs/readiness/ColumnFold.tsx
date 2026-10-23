import React from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import SectionHeader from '../ui/SectionHeader';

interface ColumnFoldProps {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly subtitle?: React.ReactNode;
  readonly done: number;
  readonly total: number;
  /** Open (the column the order is in) or folded to its header with "x of y done" (an earlier column). */
  readonly folded: boolean;
  readonly children: React.ReactNode;
}

/** One column of the Steps tab: the current one is open, earlier ones fold to their header and "x of y done". Every column uses this. */
export default function ColumnFold({ icon, title, subtitle, done, total, folded, children }: ColumnFoldProps) {
  const count = `${done} of ${total} done`;
  return (
    <details open={!folded} className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-2xs">
      <summary className="cursor-pointer list-none px-5 py-4 sm:px-6 [&::-webkit-details-marker]:hidden">
        <SectionHeader
          icon={icon}
          title={title}
          subtitle={subtitle}
          badge={folded ? <span className="rounded-full bg-sage/10 px-2.5 py-0.5 text-xs font-medium text-sage">{count}</span> : undefined}
          actions={folded
            ? <ChevronDown size={18} aria-hidden className="shrink-0 text-ink-muted transition-transform group-open:rotate-180" />
            : <span className="shrink-0 text-[13px] text-ink-muted">{count}</span>}
        />
      </summary>
      <div className="border-t border-line">{children}</div>
    </details>
  );
}
