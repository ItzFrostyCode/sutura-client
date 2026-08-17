import React, { useState, useEffect } from 'react';
import { Loader2, Upload, Image as ImageIcon, Plus, X } from 'lucide-react';
import api from '@/lib/axios';

export interface SizeChartRow {
  size: string;
  values: string[];
}

export interface SizeChartValue {
  image_url: string | null;
  columns: string[];
  rows: SizeChartRow[];
}

export const emptySizeChart: SizeChartValue = { image_url: null, columns: [], rows: [] };

// The implicit single row used by 'single-row' mode — there's no "size" to
// label since it's one person's own measurements, not a table of sizes.
const SINGLE_ROW_KEY = 'value';

interface SizeChartEditorProps {
  readonly mode: 'table' | 'single-row';
  readonly value: SizeChartValue;
  readonly onChange: (value: SizeChartValue) => void;
  readonly shopId: number;
  readonly title?: string;
  readonly description?: string;
  readonly columnPlaceholder?: string;
}

export default function SizeChartEditor({
  mode,
  value,
  onChange,
  shopId,
  title = 'Size Chart',
  description = 'Show customers exactly how you measure — upload your own reference chart image and/or build a size & measurement table.',
  columnPlaceholder = 'e.g. Chest (in)',
}: SizeChartEditorProps) {
  const [showBuilder, setShowBuilder] = useState(!!(value.image_url || value.columns.length > 0));
  const [uploading, setUploading] = useState(false);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      const res = await api.post(`/shops/${shopId}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange({ ...value, image_url: res.data.data?.url || res.data.url || null });
    } catch {
      // silently fail
    } finally {
      setUploading(false);
    }
  };

  const ensureSingleRow = (cols: string[]): SizeChartRow[] =>
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
          <div className="max-w-xs">
            <label className={labelClass}>Reference Chart Image</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-line border-dashed rounded-xl relative overflow-hidden group bg-canvas/50">
              <div className="space-y-1 text-center relative z-10">
                {uploading ? (
                  <Loader2 className="mx-auto h-8 w-8 text-ink-faint animate-spin" />
                ) : imageUrl ? (
                  <div className="flex flex-col items-center">
                    <ImageIcon className="mx-auto h-8 w-8 text-sage mb-2" />
                    <span className="text-sm text-sage font-medium">Image uploaded</span>
                    <button type="button" onClick={() => onChange({ ...value, image_url: null })} className="mt-2 text-xs text-danger hover:text-[#91544A] font-medium focus:outline-none">Remove image</button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-8 w-8 text-ink-faint" />
                    <div className="flex text-sm text-ink-muted justify-center">
                      <label htmlFor={`size-chart-image-${title}`} className="relative cursor-pointer bg-transparent rounded-md font-medium text-taupe hover:underline focus-within:outline-none">
                        <span>Upload a file</span>
                        <input id={`size-chart-image-${title}`} name="size-chart-image" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                      </label>
                    </div>
                    <p className="text-xs text-ink-faint">PNG, JPG up to 2MB</p>
                  </>
                )}
              </div>
              {imageUrl && (
                <img src={imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-10 transition-opacity" />
              )}
            </div>
          </div>

          {mode === 'table' ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass}>Measurement Table</label>
                {(columns.length > 0 || rows.length > 0) && (
                  <button type="button" onClick={resetTable} className="text-[11px] font-semibold text-danger hover:underline focus:outline-none">
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
                  <button type="button" onClick={resetTable} className="text-[11px] font-semibold text-danger hover:underline focus:outline-none">
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
    </div>
  );
}
