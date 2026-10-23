import React from 'react';
import { Check } from 'lucide-react';

interface ReadyStepRowProps {
  readonly n: number;
  readonly title: string;
  readonly done: boolean;
  readonly children: React.ReactNode;
}

/** One numbered step of "Getting ready": a circle, its name, and what to do about it underneath. */
export default function ReadyStepRow({ n, title, done, children }: ReadyStepRowProps) {
  return (
    <li className="flex gap-4 px-5 py-4 sm:px-6">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${done ? 'bg-taupe-dark text-white' : 'border border-line-strong text-ink-muted'}`}>
        {done ? <Check size={15} strokeWidth={2.5} /> : n}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-[15px] font-medium text-ink">{title}</p>
        {children}
      </div>
    </li>
  );
}
