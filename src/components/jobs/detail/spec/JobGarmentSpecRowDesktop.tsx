'use client';

import React from 'react';
import { CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { GarmentSpecColumn, GarmentSpecRow } from '../../jobTypes';

interface JobGarmentSpecRowDesktopProps {
  row: GarmentSpecRow;
  index: number;
  columns: GarmentSpecColumn[];
  onCellChange: (rowId: string, columnKey: string, value: string) => void;
  onToggleComplete: (rowId: string) => void;
  onDeleteRow: (rowId: string) => void;
  /** Production has started (or the order is closed): the row is only shown. */
  locked?: boolean;
}

export default function JobGarmentSpecRowDesktop({
  row,
  index,
  columns,
  onCellChange,
  onToggleComplete,
  onDeleteRow,
  locked = false,
}: JobGarmentSpecRowDesktopProps) {
  const isDone = Boolean(row.completed);

  return (
    <tr className={`border-b border-line/60 transition-colors ${isDone ? 'bg-emerald-50/30' : 'hover:bg-canvas/40'}`}>
      {/* 1. Completion status */}
      <td className="py-2.5 px-3 w-10 text-center">
        <button
          type="button"
          disabled={locked}
          onClick={() => onToggleComplete(row.id)}
          title={isDone ? 'Mark as in-progress' : 'Mark as completed'}
          className="text-taupe hover:scale-110 transition-transform cursor-pointer"
        >
          {isDone ? (
            <CheckCircle2 size={16} className="text-emerald-600" />
          ) : (
            <Circle size={16} className="text-line-strong hover:text-taupe" />
          )}
        </button>
      </td>

      {/* 2. Row sequence number */}
      <td className="py-2.5 px-2.5 w-10 text-center font-mono text-[11px] text-ink-faint">
        {index + 1}
      </td>

      {/* 3. Dynamic Columns */}
      {columns.map((col) => {
        const val = (row[col.key] as string) ?? '';
        return (
          <td key={col.id} className="py-2 px-2.5 min-w-[120px]">
            {col.key === 'measure_area' ? (
              <select
                aria-label={col.label} value={val} disabled={locked} onChange={(e) => onCellChange(row.id, col.key, e.target.value)}
                className="w-full bg-surface border border-line focus:border-taupe rounded-lg px-2.5 py-1.5 text-xs text-ink focus:outline-none"
              >
                <option value="">—</option>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="both">Top &amp; Bottom</option>
              </select>
            ) : (
            <input
              type={col.type === 'number' ? 'text' : 'text'}
              inputMode={col.type === 'number' ? 'numeric' : 'text'}
              value={val}
              onChange={(e) => onCellChange(row.id, col.key, e.target.value)}
              readOnly={locked}
              placeholder={locked ? '' : `Enter ${col.label.toLowerCase()}...`}
              className={`w-full bg-surface border border-line focus:border-taupe rounded-lg px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:outline-none transition-colors ${
                isDone ? 'line-through text-ink-muted' : ''
              }`}
            />
            )}
          </td>
        );
      })}

      {/* 4. Delete Row action */}
      <td className="py-2.5 px-2.5 w-12 text-center">
        {!locked && (
          <button
            type="button"
            onClick={() => onDeleteRow(row.id)}
            title="Remove row"
            className="w-7 h-7 rounded-lg text-ink-muted hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        )}
      </td>
    </tr>
  );
}
