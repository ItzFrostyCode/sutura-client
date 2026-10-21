'use client';

import React from 'react';
import { X } from 'lucide-react';

interface SizeRowItemProps {
  readonly label: string;
  readonly extra: number;
  readonly onUpdateExtra: (val: string) => void;
  readonly onRemove: () => void;
}

export default function SizeRowItem({
  label,
  extra,
  onUpdateExtra,
  onRemove,
}: SizeRowItemProps) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-semibold text-ink w-16 truncate">{label}</span>
        {extra > 0 ? (
          <span className="text-xs px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-900 font-medium">
            +₱{extra.toLocaleString('en-PH')} per pc
          </span>
        ) : (
          <span className="text-xs text-ink-muted">Base price (no extra)</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-ink-muted">+₱</span>
          <input
            type="number"
            min="0"
            value={extra > 0 ? extra : ''}
            onChange={(e) => onUpdateExtra(e.target.value)}
            placeholder="0"
            aria-label={`Extra charge for size ${label}`}
            className="w-20 h-9 px-2 bg-surface border border-line text-sm text-ink focus:outline-none focus:border-taupe text-right"
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove size ${label}`}
          className="w-9 h-9 flex items-center justify-center text-ink-muted hover:text-danger cursor-pointer transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
