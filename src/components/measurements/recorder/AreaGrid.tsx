'use client';

import React, { useState } from 'react';
import { Plus, Edit3, Check, Trash2 } from 'lucide-react';
import { BTN_ICON, BTN_PRIMARY, BTN_SM, PLAIN_FIELD } from '@/components/shared/plainForm';
import MeasureInput from './MeasureInput';
import { confirmDialog } from '@/store/useConfirmStore';

interface AreaGridProps {
  readonly title: string;
  readonly icon?: React.ReactNode;
  readonly area: 'top' | 'bottom';
  readonly columns: string[];
  readonly metrics: Record<string, string>;
  readonly onMetricChange: (metricKey: string, value: string) => void;
  readonly onAddColumn: (columnName: string) => void;
  readonly onRemoveColumn: (columnName: string) => void;
  readonly onRenameColumn?: (oldName: string, newName: string) => void;
  /** The unit the record is kept in; each field can still be set to the other one. */
  readonly unit?: 'in' | 'cm';
}

/**
 * Customizable measurement grid for a specific anatomical area (Top or Bottom).
 * Features direct cell entry, "+ Add Column" in the upper-right, and an Edit mode
 * for reconfiguring/removing fields without horizontal table scrolling.
 */
export default function AreaGrid({
  title,
  area,
  columns,
  metrics,
  onMetricChange,
  onAddColumn,
  onRemoveColumn,
  onRenameColumn,
  unit = 'in',
}: AreaGridProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [editingColName, setEditingColName] = useState<string | null>(null);
  const [renamedValue, setRenamedValue] = useState('');

  const handleAddSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = newColName.trim();
    if (!trimmed) return;
    onAddColumn(trimmed);
    setNewColName('');
    setIsAdding(false);
  };

  const handleStartRename = (col: string) => {
    setEditingColName(col);
    setRenamedValue(col);
  };

  const handleSaveRename = (oldCol: string) => {
    const trimmed = renamedValue.trim();
    if (trimmed && trimmed !== oldCol && onRenameColumn) {
      onRenameColumn(oldCol, trimmed);
    }
    setEditingColName(null);
  };

  const handleConfirmRemove = async (col: string) => {
    if (metrics[col] && metrics[col].trim() !== '') {
      const ok = await confirmDialog({ title: `Remove "${col}"?`, message: `It has a measurement of "${metrics[col]}", which is removed too.`, confirmLabel: 'Remove', danger: true });
      if (!ok) return;
    }
    onRemoveColumn(col);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-espresso">{title} <span className="text-sm font-normal text-espresso/60">({columns.length} field{columns.length !== 1 ? 's' : ''})</span></h3>
        <div className="flex flex-wrap items-center gap-2">
          {!isAdding ? (
            <button type="button" onClick={() => setIsAdding(true)} className={BTN_SM}><Plus size={14} />Add field</button>
          ) : (
            <form onSubmit={handleAddSubmit} className="flex items-center gap-2">
              <input type="text" value={newColName} onChange={(e) => setNewColName(e.target.value)} placeholder="Field name, e.g. Bicep" className={`${PLAIN_FIELD} h-9 w-44`} autoFocus />
              <button type="submit" disabled={!newColName.trim()} className={BTN_PRIMARY + ' h-9 px-3'}>Add</button>
              <button type="button" onClick={() => { setIsAdding(false); setNewColName(''); }} className={BTN_SM}>Cancel</button>
            </form>
          )}
          <button type="button" onClick={() => setIsEditing(!isEditing)} className={BTN_SM}>
            {isEditing ? <><Check size={14} />Done editing</> : <><Edit3 size={14} />Rename or remove fields</>}
          </button>
        </div>
      </div>

      {columns.length === 0 ? (
        <p className="text-sm text-espresso/60">No fields for {title.toLowerCase()} yet. Use Add field.</p>
      ) : (
        <div className="grid grid-cols-1 gap-y-4">
          {columns.map((col) => {
            const renaming = editingColName === col;
            return (
              <div key={col}>
                {renaming ? (
                  <div className="mb-1.5 flex items-center gap-1">
                    <input type="text" value={renamedValue} onChange={(e) => setRenamedValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRename(col); if (e.key === 'Escape') setEditingColName(null); }} className={`${PLAIN_FIELD} h-9`} autoFocus />
                    <button type="button" onClick={() => handleSaveRename(col)} aria-label="Save the new name" className={BTN_ICON}><Check size={14} /></button>
                  </div>
                ) : (
                  <div className="mb-1.5 flex items-center justify-between gap-1">
                    <label htmlFor={`m-${area}-${col}`} className="truncate text-sm font-medium text-espresso" title={col}>{col}</label>
                    {isEditing && (
                      <span className="flex shrink-0 gap-1">
                        {onRenameColumn && <button type="button" onClick={() => handleStartRename(col)} aria-label={`Rename ${col}`} title="Rename" className={BTN_ICON}><Edit3 size={14} /></button>}
                        <button type="button" onClick={() => handleConfirmRemove(col)} aria-label={`Remove ${col}`} title="Remove" className={BTN_ICON}><Trash2 size={14} /></button>
                      </span>
                    )}
                  </div>
                )}
                <MeasureInput id={`m-${area}-${col}`} label={col} value={metrics[col] ?? ''} recordUnit={unit} onChange={(v) => onMetricChange(col, v)} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
