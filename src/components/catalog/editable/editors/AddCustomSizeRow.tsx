'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { FIELD } from './fieldStyles';

interface AddCustomSizeRowProps {
  readonly newLabel: string;
  readonly newExtra: string;
  readonly onLabelChange: (val: string) => void;
  readonly onExtraChange: (val: string) => void;
  readonly onAdd: () => void;
}

export default function AddCustomSizeRow({
  newLabel,
  newExtra,
  onLabelChange,
  onExtraChange,
  onAdd,
}: AddCustomSizeRowProps) {
  return (
    <div className="pt-2">
      <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
        Add a custom size
      </label>
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
        <input
          value={newLabel}
          onChange={(e) => onLabelChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder="e.g. 4XL or 18.5"
          aria-label="New size name"
          className={`${FIELD} flex-1 min-w-[120px]`}
        />
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-ink-muted">+₱</span>
          <input
            type="number"
            min="0"
            value={newExtra}
            onChange={(e) => onExtraChange(e.target.value)}
            placeholder="Extra ₱"
            aria-label="Extra charge"
            className="w-24 h-12 px-3 bg-surface border border-line text-base text-ink focus:outline-none focus:border-taupe text-right"
          />
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="h-12 px-5 bg-taupe-dark text-white hover:bg-ink text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Plus size={16} /> Add size
        </button>
      </div>
    </div>
  );
}
