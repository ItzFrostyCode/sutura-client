'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Table2,
  Plus,
  ArrowLeft,
  ArrowRight,
  Edit2,
  Trash2,
  Save,
  RotateCcw,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Job, GarmentSpecColumn, GarmentSpecRow, GarmentSpecTable, RosterItem } from '../../jobTypes';
import SectionHeader from '../../ui/SectionHeader';
import JobGarmentSpecRowDesktop from './JobGarmentSpecRowDesktop';
import JobGarmentSpecRowMobile from './JobGarmentSpecRowMobile';
import JobGarmentSpecColumnModal from './JobGarmentSpecColumnModal';
import { jobPieces } from '@/lib/orderSize';
import { detailsLocked } from '../../jobHelpers';

interface JobGarmentSpecTableCardProps {
  job: Job;
  onSaveSpecTable: (table: GarmentSpecTable) => Promise<void>;
  saving?: boolean;
  /** Used as the team list editor ("Edit team list"): its own title, and a Close back to the team list. */
  title?: string;
  subtitle?: string;
  onClose?: () => void;
}

// Service / Catalog-Aware Initial Columns Generator
function getInitialColumns(job: Job): GarmentSpecColumn[] {
  // 1. Saved Spec Table in custom_order_data
  const savedSpec = job.custom_order_data?.spec_table as GarmentSpecTable | undefined;
  if (savedSpec?.columns && Array.isArray(savedSpec.columns) && savedSpec.columns.length > 0) {
    return savedSpec.columns;
  }

  // 2. Existing Team Roster in custom_order_data
  const teamRoster = (job.custom_order_data?.team_roster || job.custom_order_data?.roster) as RosterItem[] | undefined;
  if (teamRoster && Array.isArray(teamRoster) && teamRoster.length > 0) {
    return [
      { id: 'col_player_name', key: 'player_name', label: 'Player Name', type: 'text' },
      { id: 'col_print_name', key: 'print_name', label: 'Print Name', type: 'text' },
      { id: 'col_number', key: 'number', label: 'Jersey #', type: 'text' },
      { id: 'col_size', key: 'size', label: 'Size', type: 'text' },
      { id: 'col_position', key: 'position', label: 'Position', type: 'text' },
      { id: 'col_remarks', key: 'remarks', label: 'Remarks / Notes', type: 'text' },
    ];
  }

  // 3. Service-level roster_fields
  const serviceRosterFields = (job.service as { roster_fields?: Array<{ id: string; label: string; type?: 'text' | 'number' | 'select' }> } | null)?.roster_fields;
  if (serviceRosterFields && Array.isArray(serviceRosterFields) && serviceRosterFields.length > 0) {
    return serviceRosterFields.map((f, idx) => ({
      id: f.id || `col_${idx}_${f.label.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      key: f.label.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      label: f.label,
      type: f.type || 'text',
    }));
  }

  // 4. Alteration / Repair jobs
  if (job.garment_category === 'alteration_repair') {
    return [
      { id: 'col_item', key: 'garment_item', label: 'Garment Piece', type: 'text' },
      { id: 'col_alteration', key: 'alteration_needed', label: 'Alteration Work', type: 'text' },
      { id: 'col_adjustment', key: 'target_adjustment', label: 'Specific Fitting / Pinning', type: 'text' },
      { id: 'col_notes', key: 'notes', label: 'Notes', type: 'text' },
    ];
  }

  // 5. Default Tailoring / Apparel
  return [
    { id: 'col_person', key: 'person_name', label: 'Person / Subject', type: 'text' },
    { id: 'col_item', key: 'garment_piece', label: 'Garment Type', type: 'text' },
    { id: 'col_size', key: 'size', label: 'Size / Spec', type: 'text' },
    { id: 'col_notes', key: 'notes', label: 'Fitting / Cut Notes', type: 'text' },
  ];
}

// Service / Catalog-Aware Initial Rows Generator
function getInitialRows(job: Job, columns: GarmentSpecColumn[]): GarmentSpecRow[] {
  // 1. A group order: its team list is the truth (done marks, pieces and profile links are kept there), every key carried along.
  const teamRoster = (job.custom_order_data?.team_roster || job.custom_order_data?.roster) as RosterItem[] | undefined;
  if (teamRoster && Array.isArray(teamRoster) && teamRoster.length > 0) {
    return teamRoster.map((r, idx) => {
      const { name, ...rest } = r as unknown as Record<string, unknown>;
      return { ...rest, id: `row_${idx}`, player_name: String(name ?? ''), completed: Boolean(r.completed) } as GarmentSpecRow;
    });
  }

  // 2. Saved Spec Table rows
  const savedSpec = job.custom_order_data?.spec_table as GarmentSpecTable | undefined;
  if (savedSpec?.rows && Array.isArray(savedSpec.rows) && savedSpec.rows.length > 0) {
    return savedSpec.rows;
  }

  // 3. Generate rows up to job quantity or 1
  const count = Math.max(1, Math.min(50, job.quantity || 1));
  const defaultPerson = job.customer?.name || 'Customer';
  const rows: GarmentSpecRow[] = [];
  for (let i = 0; i < count; i++) {
    const row: GarmentSpecRow = {
      id: `row_${Date.now()}_${i}`,
      completed: false,
    };
    if (columns.some((c) => c.key === 'person_name')) {
      row.person_name = i === 0 ? defaultPerson : `Subject ${i + 1}`;
    }
    if (columns.some((c) => c.key === 'player_name')) {
      row.player_name = i === 0 ? defaultPerson : '';
    }
    // What was entered when the order was made: the garment and its size, so this table is not blank.
    const cod = job.custom_order_data ?? {};
    const garment = typeof cod.garment_type === 'string' ? cod.garment_type : '';
    const standard = typeof cod.standard_size === 'string' ? cod.standard_size : '';
    const profile = job.measurement?.profile_name ?? '';
    if (garment && columns.some((c) => c.key === 'garment_piece')) row.garment_piece = garment;
    if (columns.some((c) => c.key === 'size')) row.size = standard || (profile ? `Measured: ${profile}` : '');
    rows.push(row);
  }
  return rows;
}

export default function JobGarmentSpecTableCard({
  job,
  onSaveSpecTable,
  saving = false,
  title = 'Per-Garment / Per-Person Specifications',
  subtitle = "Individualized size, cut, and personalization details per piece. Add or adjust columns to match this job's requirements.",
  onClose,
}: JobGarmentSpecTableCardProps) {
  const [columns, setColumns] = useState<GarmentSpecColumn[]>(() => getInitialColumns(job));
  const [rows, setRows] = useState<GarmentSpecRow[]>(() => getInitialRows(job, getInitialColumns(job)));
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<GarmentSpecColumn | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Sync state if job.custom_order_data updates from server
  useEffect(() => {
    const cols = getInitialColumns(job);
    setColumns(cols);
    setRows(getInitialRows(job, cols));
    setIsDirty(false);
  }, [job]);

  // Context category label
  const contextLabel = useMemo(() => {
    if (job.custom_order_data?.team_roster || job.custom_order_data?.roster) return 'Team Roster & Specs';
    if (job.garment_category === 'alteration_repair') return 'Alteration Piece List';
    return 'Garment Specifications';
  }, [job]);

  // Quantities
  const orderQty = job.quantity || 1;
  // Editable until production starts; from then on (and when closed) it is only shown.
  const locked = detailsLocked(job);
  const specRowsCount = rows.length;
  const completedCount = rows.filter((r) => r.completed).length;

  // Handle cell edit
  const handleCellChange = useCallback((rowId: string, columnKey: string, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [columnKey]: value } : r))
    );
    setIsDirty(true);
  }, []);

  // Handle row toggle complete
  const handleToggleComplete = useCallback((rowId: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, completed: !r.completed } : r))
    );
    setIsDirty(true);
  }, []);

  // Add new row
  const handleAddRow = () => {
    const newRow: GarmentSpecRow = {
      id: `row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      completed: false,
    };
    setRows((prev) => [...prev, newRow]);
    setIsDirty(true);
  };

  // Fill remaining rows to match order quantity
  const handleFillRemainingRows = () => {
    if (specRowsCount >= orderQty) return;
    const diff = orderQty - specRowsCount;
    const additions: GarmentSpecRow[] = [];
    for (let i = 0; i < diff; i++) {
      additions.push({
        id: `row_${Date.now()}_fill_${i}`,
        completed: false,
      });
    }
    setRows((prev) => [...prev, ...additions]);
    setIsDirty(true);
  };

  // Delete row
  const handleDeleteRow = useCallback((rowId: string) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
    setIsDirty(true);
  }, []);

  // Column operations
  const handleSaveColumn = (col: GarmentSpecColumn) => {
    if (editingColumn) {
      setColumns((prev) => prev.map((c) => (c.id === col.id ? col : c)));
    } else {
      setColumns((prev) => [...prev, col]);
    }
    setIsDirty(true);
    setEditingColumn(null);
  };

  const handleMoveColumn = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= columns.length) return;
    const updated = [...columns];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setColumns(updated);
    setIsDirty(true);
  };

  const handleRemoveColumn = (colId: string) => {
    if (columns.length <= 1) return;
    setColumns((prev) => prev.filter((c) => c.id !== colId));
    setIsDirty(true);
  };

  // Save full table
  const handleSave = async () => {
    await onSaveSpecTable({
      columns,
      rows,
    });
    setIsDirty(false);
    onClose?.();
  };

  // Discard changes
  const handleReset = () => {
    const cols = getInitialColumns(job);
    setColumns(cols);
    setRows(getInitialRows(job, cols));
    setIsDirty(false);
  };

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
      {/* 1. Header with Decoupled Quantity Badges */}
      <SectionHeader
        icon={Table2}
        title={title}
        subtitle={subtitle}
        badge={(
          <span className="text-[11px] font-semibold uppercase tracking-wider text-taupe bg-taupe/10 px-2 py-0.5 rounded-md">
            {contextLabel}
          </span>
        )}
        actions={(
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className="px-2.5 py-1 bg-sunken rounded-lg font-medium text-ink">
          Pieces: <strong className="text-ink font-semibold font-mono">{jobPieces(job)}</strong>
        </span>
        <span className="px-2.5 py-1 bg-sunken rounded-lg font-medium text-ink">
          Specs Defined: <strong className="text-ink font-semibold font-mono">{specRowsCount}</strong>
        </span>
        <span className={`px-2.5 py-1 rounded-lg font-medium ${
          completedCount === specRowsCount && specRowsCount > 0
            ? 'bg-emerald-500/10 text-emerald-800'
            : 'bg-sunken text-ink-muted'
        }`}>
          Completed: <strong className="font-semibold font-mono">{completedCount}/{specRowsCount}</strong>
        </span>
        {onClose && <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sunken">Close</button>}
      </div>
        )}
      />

      {locked && <p className="text-[13px] text-ink-muted">This order is being made (or is closed), so the specifications are now only shown.</p>}

      {/* 2. Action Toolbar */}
      {!locked && <div className="flex items-center justify-between gap-2.5 flex-wrap pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-espresso/[0.05] hover:bg-espresso/[0.09] text-xs font-medium text-ink transition-colors cursor-pointer"
          >
            <Plus size={13} className="text-taupe" />
            <span>Add Garment Row</span>
          </button>

          {specRowsCount < orderQty && (
            <button
              type="button"
              onClick={handleFillRemainingRows}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 text-xs font-medium text-amber-800 transition-colors cursor-pointer"
            >
              <Sparkles size={13} />
              <span>Fill Remaining Rows to Match Qty ({orderQty - specRowsCount} pcs)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setEditingColumn(null);
              setIsColumnModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-espresso/[0.05] hover:bg-espresso/[0.09] text-xs font-medium text-ink transition-colors cursor-pointer"
          >
            <Plus size={13} className="text-taupe" />
            <span>Add Column</span>
          </button>
        </div>

        {/* Save / Discard Bar */}
        <div className="flex items-center gap-2">
          {isDirty && (
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:text-ink cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-espresso hover:bg-espresso/90 text-white text-xs font-semibold shadow-2xs transition-colors disabled:opacity-40 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Saving Table…</span>
              </>
            ) : (
              <>
                <Save size={13} />
                <span>Save Specification Table</span>
              </>
            )}
          </button>
        </div>
      </div>}

      {/* 3. Desktop Table (>=640px) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-line bg-canvas">
              <th className="py-2.5 px-3 w-10 text-center font-semibold text-[10px] text-ink-muted uppercase">Done</th>
              <th className="py-2.5 px-2.5 w-10 text-center font-semibold text-[10px] text-ink-muted uppercase">#</th>
              {columns.map((col, idx) => (
                <th key={col.id} className="py-2.5 px-2.5 font-semibold text-[10px] text-ink-muted uppercase tracking-wider min-w-[120px]">
                  <div className="flex items-center justify-between gap-1 group">
                    <span className="truncate">{col.label}</span>
                    {!locked && <div className="flex items-center opacity-40 group-hover:opacity-100 transition-opacity">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveColumn(idx, 'left')}
                          title="Move column left"
                          className="p-0.5 hover:text-ink text-ink-muted cursor-pointer"
                        >
                          <ArrowLeft size={10} />
                        </button>
                      )}
                      {idx < columns.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveColumn(idx, 'right')}
                          title="Move column right"
                          className="p-0.5 hover:text-ink text-ink-muted cursor-pointer"
                        >
                          <ArrowRight size={10} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingColumn(col);
                          setIsColumnModalOpen(true);
                        }}
                        title="Rename column"
                        className="p-0.5 hover:text-taupe text-ink-muted cursor-pointer ml-0.5"
                      >
                        <Edit2 size={10} />
                      </button>
                      {columns.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveColumn(col.id)}
                          title="Remove column"
                          className="p-0.5 hover:text-rose-600 text-ink-muted cursor-pointer ml-0.5"
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>}
                  </div>
                </th>
              ))}
              <th className="py-2.5 px-2.5 w-12 text-center font-semibold text-[10px] text-ink-muted uppercase">Act</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <JobGarmentSpecRowDesktop
                key={row.id}
                row={row}
                index={idx}
                columns={columns}
                onCellChange={handleCellChange}
                onToggleComplete={handleToggleComplete}
                onDeleteRow={handleDeleteRow}
                locked={locked}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. Mobile Cards Representation (<640px) */}
      <div className="sm:hidden space-y-3">
        {rows.map((row, idx) => (
          <JobGarmentSpecRowMobile
            key={row.id}
            row={row}
            index={idx}
            columns={columns}
            onCellChange={handleCellChange}
            onToggleComplete={handleToggleComplete}
            onDeleteRow={handleDeleteRow}
            locked={locked}
          />
        ))}
      </div>

      {/* Empty State */}
      {rows.length === 0 && !locked && (
        <div className="text-center py-8 rounded-xl bg-sunken/70 space-y-2">
          <p className="text-xs text-ink-muted font-medium">No garment specification rows recorded yet.</p>
          <button
            type="button"
            onClick={handleAddRow}
            className="px-3.5 py-1.5 rounded-lg bg-espresso text-white text-xs font-semibold cursor-pointer"
          >
            + Add First Row
          </button>
        </div>
      )}

      {/* Helper Note */}
      <div className="flex items-center gap-1.5 text-[11px] text-ink-muted pt-1">
        <AlertCircle size={12} className="text-taupe shrink-0" />
        <span>
          Columns and rows are saved per Job Order. Future changes to catalog or service templates will not alter this table.
        </span>
      </div>

      {/* Column Modal */}
      <JobGarmentSpecColumnModal
        isOpen={isColumnModalOpen}
        onClose={() => {
          setIsColumnModalOpen(false);
          setEditingColumn(null);
        }}
        onSave={handleSaveColumn}
        editingColumn={editingColumn}
        existingColumns={columns}
      />
    </div>
  );
}
