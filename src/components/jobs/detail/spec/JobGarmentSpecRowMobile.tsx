'use client';

import React from 'react';
import { CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { GarmentSpecColumn, GarmentSpecRow } from '../../jobTypes';

interface JobGarmentSpecRowMobileProps {
  row: GarmentSpecRow;
  index: number;
  columns: GarmentSpecColumn[];
  onCellChange: (rowId: string, columnKey: string, value: string) => void;
  onToggleComplete: (rowId: string) => void;
  onDeleteRow: (rowId: string) => void;
}

export default function JobGarmentSpecRowMobile({
  row,
  index,
  columns,
  onCellChange,
  onToggleComplete,
  onDeleteRow,
}: JobGarmentSpecRowMobileProps) {
  const isDone = Boolean(row.completed);

  return (
    <div
      className={`border rounded-xl p-3.5 space-y-3 transition-colors ${
        isDone ? 'bg-emerald-50/20 border-emerald-200/60' : 'bg-canvas border-line'
      }`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-line/60">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleComplete(row.id)}
            className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            {isDone ? (
              <CheckCircle2 size={16} className="text-emerald-600" />
            ) : (
              <Circle size={16} className="text-line-strong hover:text-taupe" />
            )}
            <span className={isDone ? 'text-emerald-700' : 'text-ink'}>
              Garment #{index + 1}
            </span>
          </button>
          {isDone && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Completed
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDeleteRow(row.id)}
          aria-label={`Remove garment row ${index + 1}`}
          className="text-ink-muted hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {columns.map((col) => {
          const val = (row[col.key] as string) ?? '';
          return (
            <div key={col.id} className="space-y-1">
              <label
                htmlFor={`mob-${row.id}-${col.key}`}
                className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block"
              >
                {col.label}
              </label>
              <input
                id={`mob-${row.id}-${col.key}`}
                type={col.type === 'number' ? 'text' : 'text'}
                inputMode={col.type === 'number' ? 'numeric' : 'text'}
                value={val}
                onChange={(e) => onCellChange(row.id, col.key, e.target.value)}
                placeholder={`Enter ${col.label.toLowerCase()}...`}
                className={`w-full bg-surface border border-line focus:border-taupe rounded-lg px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:outline-none transition-colors ${
                  isDone ? 'line-through text-ink-muted' : ''
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
