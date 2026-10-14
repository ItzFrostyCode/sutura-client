import React from 'react';
import { Check, Minus } from 'lucide-react';
import type { ChecklistItem } from './readinessTypes';

interface ReadinessChecklistProps {
  readonly items: ChecklistItem[];
  /** The button (if any) that moves this step forward. */
  readonly renderAction: (item: ChecklistItem) => React.ReactNode;
}

/** The nine steps from "specs approved" to "production started", each with what is left and how to do it. */
export default function ReadinessChecklist({ items, renderAction }: ReadinessChecklistProps) {
  // The first step that is applicable and not done is "where you are now".
  const current = items.find((i) => i.applicable && !i.done)?.key;

  return (
    <ol className="divide-y divide-line">
      {items.map((item, index) => {
        const isCurrent = item.key === current;
        return (
          <li key={item.key} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${isCurrent ? 'bg-amber-50/50' : ''}`}>
            <span
              aria-hidden
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                !item.applicable ? 'border-line bg-sunken text-ink-faint'
                  : item.done ? 'border-emerald-600 bg-emerald-600 text-white'
                  : isCurrent ? 'border-amber-500 bg-white text-amber-700' : 'border-line bg-white text-ink-muted'
              }`}
            >
              {!item.applicable ? <Minus size={13} /> : item.done ? <Check size={14} /> : index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold ${item.applicable ? 'text-ink' : 'text-ink-faint'}`}>
                {item.label}
                <span className="sr-only">{item.done ? ' — done' : item.applicable ? ' — not done' : ' — not needed'}</span>
              </p>
              {(item.detail || !item.applicable) && (
                <p className="text-xs text-ink-muted">{item.applicable ? item.detail : 'Not needed for this order'}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">{renderAction(item)}</div>
          </li>
        );
      })}
    </ol>
  );
}
