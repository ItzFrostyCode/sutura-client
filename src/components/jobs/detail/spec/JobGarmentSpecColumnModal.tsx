'use client';

import React, { useState } from 'react';
import { X, Plus, Edit2, AlertTriangle } from 'lucide-react';
import { GarmentSpecColumn } from '../../jobTypes';

interface JobGarmentSpecColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (column: GarmentSpecColumn) => void;
  editingColumn?: GarmentSpecColumn | null;
  existingColumns: GarmentSpecColumn[];
}

export default function JobGarmentSpecColumnModal({
  isOpen,
  onClose,
  onSave,
  editingColumn,
  existingColumns,
}: JobGarmentSpecColumnModalProps) {
  const [label, setLabel] = useState(editingColumn?.label || '');
  const [type, setType] = useState<'text' | 'number' | 'select'>(editingColumn?.type || 'text');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = label.trim();
    if (!cleanLabel) {
      setError('Column title is required.');
      return;
    }

    const key = cleanLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const isDuplicate = existingColumns.some(
      (c) => c.key === key && (!editingColumn || c.id !== editingColumn.id)
    );

    if (isDuplicate) {
      setError('A column with this title already exists.');
      return;
    }

    onSave({
      id: editingColumn?.id || `col_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      key: editingColumn?.key || key,
      label: cleanLabel,
      type,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-espresso/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface border border-line rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-canvas">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-surface border border-line flex items-center justify-center text-taupe">
              {editingColumn ? <Edit2 size={15} /> : <Plus size={15} />}
            </div>
            <h3 className="text-sm font-bold text-ink">
              {editingColumn ? 'Edit Column Label' : 'Add Specification Column'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="col-label" className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
              Column Title
            </label>
            <input
              id="col-label"
              type="text"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Player Name, Collar Style, Inseam"
              className="w-full bg-canvas border border-line focus:border-taupe rounded-xl px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
              autoFocus
            />
            {error && (
              <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                <AlertTriangle size={12} /> {error}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="col-type" className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
              Field Format
            </label>
            <select
              id="col-type"
              value={type}
              onChange={(e) => setType(e.target.value as 'text' | 'number' | 'select')}
              className="w-full bg-canvas border border-line focus:border-taupe rounded-xl px-3 py-2.5 text-xs text-ink focus:outline-none"
            >
              <option value="text">Text / Notes (standard)</option>
              <option value="number">Numeric (e.g. Jersey #, Measurement)</option>
              <option value="select">Dropdown / Selection</option>
            </select>
          </div>

          <div className="pt-3 border-t border-line flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-ink-body hover:bg-canvas rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-espresso hover:bg-espresso/90 text-white rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              {editingColumn ? 'Update Column' : 'Add Column'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
