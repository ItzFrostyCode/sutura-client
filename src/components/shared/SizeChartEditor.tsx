import React, { useState, useEffect } from 'react';
import { ImagePlus, Loader2, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import api from '@/lib/axios';
import GuideImageField from './GuideImageField';
import ChartImageViewer, { CHART_FRAME } from './ChartImageViewer';
import ConfirmDialog from '@/components/ConfirmDialog';

export interface SizeChartRow {
  size: string;
  values: string[];
}

export interface SizeChartValue {
  /** The first chart image (kept for everything that shows only one). */
  image_url: string | null;
  /** All chart images, in order. Only used with `multipleImages`. */
  image_urls?: string[];
  columns: string[];
  rows: SizeChartRow[];
}

/** Most reference chart images one record can hold (server: StoreServiceRequest). */
export const MAX_CHART_IMAGES = 10;

export const emptySizeChart: SizeChartValue = { image_url: null, columns: [], rows: [] };

// The implicit single row used by 'single-row' mode — there's no "size" to
// label since it's one person's own measurements, not a table of sizes.
const SINGLE_ROW_KEY = 'value';

interface SizeChartEditorProps {
  readonly mode: 'table' | 'single-row';
  readonly value: SizeChartValue;
  readonly onChange: (value: SizeChartValue) => void;
  readonly storeId: number;
  readonly title?: string;
  readonly description?: string;
  readonly columnPlaceholder?: string;
  /** Allow several reference chart images (e.g. Men's and Women's sizing). */
  readonly multipleImages?: boolean;
}

export default function SizeChartEditor({
  mode,
  value,
  onChange,
  storeId,
  title = 'Size Chart',
  description = 'Show customers exactly how you measure — upload your own reference chart image and/or build a size & measurement table.',
  columnPlaceholder = 'e.g. Chest (in)',
  multipleImages = false,
}: SizeChartEditorProps) {
  const [showBuilder, setShowBuilder] = useState(!!(value.image_url || value.columns.length > 0));
  const [uploading, setUploading] = useState(false);
  // Multi-image mode: which slot is uploading (an index, or 'new' for + Add image).
  const [uploadingSlot, setUploadingSlot] = useState<number | 'new' | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [activeChart, setActiveChart] = useState(0);
  const [newColumnInput, setNewColumnInput] = useState('');
  const [newRowSizeInput, setNewRowSizeInput] = useState('');
  const [addingColumn, setAddingColumn] = useState(false);
  const [addingRow, setAddingRow] = useState(false);
  const [editingColumnIndex, setEditingColumnIndex] = useState<number | null>(null);
  const [renameColumnValue, setRenameColumnValue] = useState('');
  const [editingRowKey, setEditingRowKey] = useState<string | null>(null);
  const [renameRowValue, setRenameRowValue] = useState('');

  const { image_url: imageUrl, columns, rows } = value;

  // `value` often arrives a tick after mount (the parent form populates it
  // from a fetched record via its own effect), so the useState initializer
  // above can lock in "collapsed" before the real data shows up. Force it
  // open once data appears — never force it closed, so a user's manual
  // "Hide" click is still respected afterward.
  useEffect(() => {
    const openIfPopulated = () => {
      if (imageUrl || columns.length > 0) {
        setShowBuilder(true);
      }
    };
    openIfPopulated();
  }, [imageUrl, columns.length]);

  const handleImageUpload = async (file: File | undefined) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      const res = await api.post(`/stores/${storeId}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange({ ...value, image_url: res.data.data?.url || res.data.url || null });
    } catch {
      // silently fail
    } finally {
      setUploading(false);
    }
  };

  // ── Multi-image mode ──
  const images = value.image_urls ?? (imageUrl ? [imageUrl] : []);
  const chartIdx = Math.min(activeChart, Math.max(0, images.length - 1));
  const setImages = (list: string[]) =>onChange({ ...value, image_urls: list, image_url: list[0] ?? null });

  const uploadChart = async (file: File | undefined, slot: number | 'new') => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    setUploadingSlot(slot);
    setUploadError('');
    try {
      const res = await api.post(`/stores/${storeId}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url: string | null = res.data.data?.url || res.data.url || null;
      if (!url) throw new Error('no url');
      setImages(slot === 'new' ? [...images, url] : images.map((u, i) => (i === slot ? url : u)));
      // Show the chart just added.
      if (slot === 'new') setActiveChart(images.length);
    } catch {
      setUploadError('That image could not be uploaded. Try again, or use a smaller JPG or PNG.');
    } finally {
      setUploadingSlot(null);
    }
  };

  const addImageButton = images.length < MAX_CHART_IMAGES ? (
    <label className="h-11 px-4 border border-line-strong bg-white text-sm font-medium text-ink flex items-center gap-2 cursor-pointer hover:bg-sunken has-[input:disabled]:opacity-60 has-[input:disabled]:cursor-wait">
      {uploadingSlot === 'new' ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
      {uploadingSlot === 'new' ? 'Uploading…' : 'Add image'}
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={uploadingSlot !== null}
        onChange={(e) => { void uploadChart(e.target.files?.[0], 'new'); e.target.value = ''; }}
      />
    </label>
  ) : null;

  const ensureSingleRow =(cols: string[]): SizeChartRow[] =>
    mode === 'single-row' ? [{ size: SINGLE_ROW_KEY, values: cols.map((_, i) => rows[0]?.values[i] ?? '') }] : rows;

  const addColumn = () => {
    const label = newColumnInput.trim();
    if (!label || columns.includes(label)) return;
    const newColumns = [...columns, label];
    const newRows = mode === 'single-row'
      ? [{ size: SINGLE_ROW_KEY, values: [...(rows[0]?.values ?? []), ''] }]
      : rows.map(r => ({ ...r, values: [...r.values, ''] }));
    onChange({ ...value, columns: newColumns, rows: newRows });
    setNewColumnInput('');
  };

  const removeColumn = (index: number) => {
    const newColumns = columns.filter((_, i) => i !== index);
    const newRows = rows.map(r => ({ ...r, values: r.values.filter((_, i) => i !== index) }));
    onChange({ ...value, columns: newColumns, rows: newRows });
  };

  const startRenameColumn = (index: number, currentName: string) => {
    setEditingColumnIndex(index);
    setRenameColumnValue(currentName);
  };

  const commitRenameColumn = () => {
    const newName = renameColumnValue.trim();
    const index = editingColumnIndex;
    setEditingColumnIndex(null);
    if (index === null || !newName) return;
    // Renaming to a name that collides with another column would silently merge
    // two distinct measurements — cancel instead of guessing which one to keep.
    if (columns.some((c, i) => i !== index && c === newName)) return;
    onChange({ ...value, columns: columns.map((c, i) => (i === index ? newName : c)) });
  };

  const addRow = () => {
    const size = newRowSizeInput.trim();
    if (!size || rows.some(r => r.size === size)) return;
    onChange({ ...value, rows: [...rows, { size, values: columns.map(() => '') }] });
    setNewRowSizeInput('');
  };

  const removeRow = (size: string) => {
    onChange({ ...value, rows: rows.filter(r => r.size !== size) });
  };

  const startRenameRow = (size: string) => {
    setEditingRowKey(size);
    setRenameRowValue(size);
  };

  const commitRenameRow = () => {
    const newName = renameRowValue.trim();
    const originalKey = editingRowKey;
    setEditingRowKey(null);
    if (originalKey === null || !newName) return;
    if (newName !== originalKey && rows.some(r => r.size === newName)) return;
    onChange({ ...value, rows: rows.map(r => (r.size === originalKey ? { ...r, size: newName } : r)) });
  };

  const [confirmClear, setConfirmClear] = useState(false);

  const resetTable = () => {
    onChange({ ...value, columns: [], rows: [] });
    setNewColumnInput('');
    setNewRowSizeInput('');
    setAddingColumn(false);
    setAddingRow(false);
  };

  const updateCell = (rowIndex: number, colIndex: number, val: string) => {
    const effectiveRows = mode === 'single-row' ? ensureSingleRow(columns) : rows;
    onChange({
      ...value,
      rows: effectiveRows.map((r, i) => (i === rowIndex ? { ...r, values: r.values.map((v, j) => (j === colIndex ? val : v)) } : r)),
    });
  };

  const labelClass = 'block text-xs font-semibold text-ink-muted mb-1 uppercase tracking-wider';
  const displayRows = mode === 'single-row' ? ensureSingleRow(columns) : rows;
  const singleRowValues = displayRows[0]?.values ?? [];

  return (
    <div className="border-t border-line pt-4 mt-2">
      <div className="flex items-center justify-between mb-1">
        <div>
          <span className={labelClass}>{title} <span className="text-ink-faint normal-case font-normal">(optional)</span></span>
          <p className="text-[11px] text-ink-faint mt-0.5 max-w-md">{description}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowBuilder(prev => !prev)}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-taupe/10 text-taupe text-xs font-semibold hover:bg-taupe/20 transition-colors focus:outline-none"
        >
          {showBuilder ? 'Hide' : `+ Add ${title}`}
        </button>
      </div>

      {showBuilder && (
        <div className="space-y-5 mt-3">
          {multipleImages ? (
            <div className="max-w-md">
              <label className={labelClass}>Reference Chart Images</label>
              <p className="text-[11px] text-ink-faint mb-2">
                Add more than one if you need to, e.g. separate Men&apos;s and Women&apos;s sizing. Customers flip through them with the arrows, in this order.
              </p>
              {/* One fixed-size frame + one controls row for any number of
                  charts, so this box is the same height with 0, 1 or 10. */}
              <div className="space-y-2">
                {images.length === 0 ? (
                  <label className={`w-full ${CHART_FRAME} bg-sunken border border-dashed border-line-strong flex flex-col items-center justify-center gap-2 text-ink-muted cursor-pointer hover:bg-line/40 hover:text-taupe transition-colors`}>
                    {uploadingSlot !== null ? <Loader2 size={28} className="animate-spin text-taupe" /> : <ImagePlus size={32} strokeWidth={1.5} />}
                    <span className="text-xs font-medium">{uploadingSlot !== null ? 'Uploading…' : 'Add a chart image'}</span>
                    <input type="file" accept="image/*" className="sr-only" disabled={uploadingSlot !== null}
                      onChange={(e) => { void uploadChart(e.target.files?.[0], 'new'); e.target.value = ''; }} />
                  </label>
                ) : (
                  <ChartImageViewer images={images} index={chartIdx} onIndexChange={setActiveChart} />
                )}
                <div className="flex flex-wrap gap-2">
                  {images.length > 0 && (
                    <>
                      <label className="h-11 px-4 border border-line-strong bg-white text-sm font-medium text-ink flex items-center gap-2 cursor-pointer hover:bg-sunken">
                        {uploadingSlot === chartIdx ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                        {uploadingSlot === chartIdx ? 'Uploading…' : 'Replace'}
                        <input type="file" accept="image/*" className="sr-only" disabled={uploadingSlot !== null}
                          onChange={(e) => { void uploadChart(e.target.files?.[0], chartIdx); e.target.value = ''; }} />
                      </label>
                      <button
                        type="button"
                        onClick={() => { setImages(images.filter((_, j) => j !== chartIdx)); setActiveChart(Math.max(0, chartIdx - 1)); }}
                        className="h-11 px-4 border border-line-strong bg-white text-sm font-medium text-danger flex items-center gap-2 cursor-pointer hover:bg-danger/5"
                      >
                        <Trash2 size={15} /> Remove
                      </button>
                    </>
                  )}
                  {addImageButton}
                </div>
                <p className="text-[11px] text-ink-faint">
                  {images.length > 1
                    ? `Showing chart ${chartIdx + 1} of ${images.length}. Replace and Remove apply to this one.`
                    : images.length >= MAX_CHART_IMAGES ? `That's the most (${MAX_CHART_IMAGES}).` : ' '}
                </p>
              </div>
              {uploadError && <p role="alert" className="mt-2 text-xs text-danger">{uploadError}</p>}
            </div>
          ) : (
            <div className="max-w-md">
              <label className={labelClass}>Reference Chart Image</label>
              <GuideImageField
                imageUrl={imageUrl ?? ''}
                uploading={uploading}
                alt="Reference chart"
                onUpload={handleImageUpload}
                onRemove={() => onChange({ ...value, image_url: null })}
              />
            </div>
          )}

          {mode === 'table' ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass}>Measurement Table</label>
                {(columns.length > 0 || rows.length > 0) && (
                  <button type="button" onClick={() => setConfirmClear(true)} className="text-[11px] font-semibold text-danger hover:underline focus:outline-none">
                    Clear table
                  </button>
                )}
              </div>
              <p className="text-[11px] text-ink-faint mb-2">
                Click the <strong>+</strong> at the top-right to add a measurement column (e.g. &quot;Chest (in)&quot;), or at the bottom to add a size row (e.g. &quot;Medium&quot;). Click the <strong>×</strong> next to a row or column name to remove it.
              </p>

              <div className="overflow-x-auto border border-line rounded-lg">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-canvas">
                      <th className="px-2 py-1.5 text-left font-semibold text-ink-muted">Size</th>
                      {columns.map((col, ci) => (
                        <th key={col} className="px-2 py-1.5 text-left font-semibold text-ink-muted">
                          {editingColumnIndex === ci ? (
                            <input
                              autoFocus
                              type="text"
                              value={renameColumnValue}
                              onChange={(e) => setRenameColumnValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); commitRenameColumn(); }
                                if (e.key === 'Escape') { setEditingColumnIndex(null); }
                              }}
                              onBlur={commitRenameColumn}
                              className="w-20 px-1 py-0.5 bg-white border border-taupe rounded text-xs focus:outline-none"
                            />
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="truncate cursor-text" onDoubleClick={() => startRenameColumn(ci, col)} title="Double-click to rename">
                                {col}
                              </span>
                              <button type="button" onClick={() => removeColumn(ci)} title={`Remove ${col} column`} className="shrink-0 text-ink-faint hover:text-danger focus:outline-none">
                                <X size={10} />
                              </button>
                            </div>
                          )}
                        </th>
                      ))}
                      <th className="px-2 py-1.5 w-10">
                        {addingColumn ? (
                          <input
                            autoFocus
                            type="text"
                            value={newColumnInput}
                            onChange={(e) => setNewColumnInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { e.preventDefault(); addColumn(); }
                              if (e.key === 'Escape') { setNewColumnInput(''); setAddingColumn(false); }
                            }}
                            onBlur={() => { if (!newColumnInput.trim()) setAddingColumn(false); }}
                            placeholder={columnPlaceholder}
                            className="w-24 px-1.5 py-1 bg-white border border-taupe rounded text-xs focus:outline-none"
                          />
                        ) : (
                          <button type="button" onClick={() => setAddingColumn(true)} title="Add column" className="w-6 h-6 flex items-center justify-center rounded bg-taupe/10 text-taupe hover:bg-taupe/20 transition-colors focus:outline-none">
                            <Plus size={12} />
                          </button>
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, ri) => (
                      <tr key={row.size} className="border-t border-line">
                        <td className="px-2 py-1 font-semibold text-ink whitespace-nowrap">
                          {editingRowKey === row.size ? (
                            <input
                              autoFocus
                              type="text"
                              value={renameRowValue}
                              onChange={(e) => setRenameRowValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); commitRenameRow(); }
                                if (e.key === 'Escape') { setEditingRowKey(null); }
                              }}
                              onBlur={commitRenameRow}
                              className="w-20 px-1 py-0.5 bg-white border border-taupe rounded text-xs focus:outline-none"
                            />
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="truncate cursor-text" onDoubleClick={() => startRenameRow(row.size)} title="Double-click to rename">
                                {row.size}
                              </span>
                              <button type="button" onClick={() => removeRow(row.size)} title={`Remove ${row.size} row`} className="shrink-0 text-ink-faint hover:text-danger focus:outline-none">
                                <X size={10} />
                              </button>
                            </div>
                          )}
                        </td>
                        {row.values.map((val, ci) => (
                          <td key={`${row.size}-${ci}`} className="px-2 py-1">
                            <input
                              type="text"
                              value={val ?? ''}
                              onChange={(e) => updateCell(ri, ci, e.target.value)}
                              className="w-16 px-1 py-0.5 bg-surface border border-line rounded text-xs focus:outline-none focus:border-taupe"
                            />
                          </td>
                        ))}
                        <td></td>
                      </tr>
                    ))}
                    <tr className="border-t border-line">
                      <td className="px-2 py-1.5" colSpan={columns.length + 2}>
                        {addingRow ? (
                          <input
                            autoFocus
                            type="text"
                            value={newRowSizeInput}
                            onChange={(e) => setNewRowSizeInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { e.preventDefault(); addRow(); }
                              if (e.key === 'Escape') { setNewRowSizeInput(''); setAddingRow(false); }
                            }}
                            onBlur={() => { if (!newRowSizeInput.trim()) setAddingRow(false); }}
                            placeholder="Medium"
                            className="w-24 px-1.5 py-1 bg-white border border-taupe rounded text-xs focus:outline-none"
                          />
                        ) : (
                          <button type="button" onClick={() => setAddingRow(true)} className="flex items-center gap-1 text-taupe text-xs font-semibold hover:underline focus:outline-none">
                            <Plus size={12} /> Add size row
                          </button>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass}>Measurement Fields</label>
                {columns.length > 0 && (
                  <button type="button" onClick={() => setConfirmClear(true)} className="text-[11px] font-semibold text-danger hover:underline focus:outline-none">
                    Clear all
                  </button>
                )}
              </div>
              <p className="text-[11px] text-ink-faint mb-2">
                Add whatever measurement fields you need — double-click a field name to rename it, click <strong>×</strong> to remove it.
              </p>
              <div className="space-y-2">
                {columns.map((col, ci) => (
                  <div key={col} className="flex items-center gap-2">
                    <div className="w-40 shrink-0">
                      {editingColumnIndex === ci ? (
                        <input
                          autoFocus
                          type="text"
                          value={renameColumnValue}
                          onChange={(e) => setRenameColumnValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); commitRenameColumn(); }
                            if (e.key === 'Escape') { setEditingColumnIndex(null); }
                          }}
                          onBlur={commitRenameColumn}
                          className="w-full px-2 py-1.5 bg-white border border-taupe rounded-lg text-xs focus:outline-none"
                        />
                      ) : (
                        <span
                          className="text-xs font-medium text-ink-body cursor-text truncate block"
                          onDoubleClick={() => startRenameColumn(ci, col)}
                          title="Double-click to rename"
                        >
                          {col}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={singleRowValues[ci] ?? ''}
                      onChange={(e) => updateCell(0, ci, e.target.value)}
                      placeholder="—"
                      className="flex-1 px-3 py-1.5 bg-surface border border-line rounded-lg text-xs focus:outline-none focus:border-taupe"
                    />
                    <button type="button" onClick={() => removeColumn(ci)} title={`Remove ${col}`} className="shrink-0 text-ink-faint hover:text-danger focus:outline-none">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <div>
                  {addingColumn ? (
                    <input
                      autoFocus
                      type="text"
                      value={newColumnInput}
                      onChange={(e) => setNewColumnInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); addColumn(); }
                        if (e.key === 'Escape') { setNewColumnInput(''); setAddingColumn(false); }
                      }}
                      onBlur={() => { if (!newColumnInput.trim()) setAddingColumn(false); }}
                      placeholder={columnPlaceholder}
                      className="w-48 px-3 py-1.5 bg-white border border-taupe rounded-lg text-xs focus:outline-none"
                    />
                  ) : (
                    <button type="button" onClick={() => setAddingColumn(true)} className="flex items-center gap-1 text-taupe text-xs font-semibold hover:underline focus:outline-none">
                      <Plus size={12} /> Add measurement field
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <ConfirmDialog
        isOpen={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          resetTable();
          setConfirmClear(false);
        }}
        tone="danger"
        title={mode === 'table' ? 'Clear the whole table?' : 'Clear all measurement fields?'}
        message={
          mode === 'table'
            ? 'This removes every measurement column and size row you added. The reference chart image is not affected, and nothing changes for customers until you save.'
            : 'This removes every measurement field you added, along with anything already filled in. Nothing changes for customers until you save.'
        }
        confirmLabel={mode === 'table' ? 'Clear table' : 'Clear all'}
      />
    </div>
  );
}
