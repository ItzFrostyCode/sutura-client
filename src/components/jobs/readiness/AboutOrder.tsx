import React from 'react';
import { ChevronDown, Info } from 'lucide-react';

/** Who makes it and who it is for, folded by default: it is background for the step you are on, not another thing to do. */
export default function AboutOrder({ summary, children }: Readonly<{ summary: string; children: React.ReactNode }>) {
  return (
    <details className="group rounded-2xl border border-line bg-surface shadow-2xs">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 py-3 sm:px-6 [&::-webkit-details-marker]:hidden">
        <Info size={18} aria-hidden className="shrink-0 text-ink-muted" />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-ink">About this order</span>
          <span className="block truncate text-[13px] text-ink-muted">{summary}</span>
        </span>
        <ChevronDown size={18} aria-hidden className="shrink-0 text-ink-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-line p-4 sm:p-5">{children}</div>
    </details>
  );
}
