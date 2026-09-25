import { useState } from 'react';
import { Plus, X } from 'lucide-react';

export interface RosterRow {
  name: string;
  size: string;
  values: string[];
}

export interface RosterValue {
  columns: string[];
  rows: RosterRow[];
}

export const emptyRoster: RosterValue = { columns: [], rows: [] };

interface BulkRosterEditorProps {
  readonly sizes: string[];
  readonly value: RosterValue;
  readonly onChange: (value: RosterValue) => void;
}

// Same add-row / add-column / double-click-to-rename interaction pattern as
// SizeChartEditor, but shaped for a bulk-order roster: each row is a PERSON
// (Name, required Size picked from the item's real sizes), not a size-chart
// measurement row — a fixed "Size" column keeps the store owner's cutting
// list accurate even as customers add free-form extra columns of their own
// (jersey number, nickname, etc.) on top.
export default function BulkRosterEditor({ sizes, value, onChange }: BulkRosterEditorProps) {
  const { columns, rows } = value;
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnInput, setNewColumnInput] = useState('');
  const [editingColumnIndex, setEditingColumnIndex] = useState<number | null>(null);
  const [renameColumnValue, setRenameColumnValue] = useState('');

  const addColumn = () => {
    const label = newColumnInput.trim();
    if (!label || columns.includes(label)) return;
    onChange({
      columns: [...columns, label],
      rows: rows.map(r => ({ ...r, values: [...r.values, ''] })),
    });
    setNewColumnInput('');
  };

  const removeColumn = (index: number) => {
    onChange({
      columns: columns.filter((_, i) => i !== index),
      rows: rows.map(r => ({ ...r, values: r.values.filter((_, i) => i !== index) })),
    });
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
    if (columns.some((c, i) => i !== index && c === newName)) return;
    onChange({ ...value, columns: columns.map((c, i) => (i === index ? newName : c)) });
  };

  const addRow = () => {
    onChange({
      ...value,
      rows: [...rows, { name: `Person ${rows.length + 1}`, size: '', values: columns.map(() => '') }],
    });
  };

  const removeRow = (index: number) => {
    onChange({ ...value, rows: rows.filter((_, i) => i !== index) });
  };

  const updateRowName = (index: number, name: string) => {
    onChange({ ...value, rows: rows.map((r, i) => (i === index ? { ...r, name } : r)) });
  };

  const updateRowSize = (index: number, size: string) => {
    onChange({ ...value, rows: rows.map((r, i) => (i === index ? { ...r, size } : r)) });
  };

  const updateCell = (rowIndex: number, colIndex: number, val: string) => {
    onChange({
      ...value,
      rows: rows.map((r, i) => (i === rowIndex ? { ...r, values: r.values.map((v, j) => (j === colIndex ? val : v)) } : r)),
    });
  };

  return (
    <div>
      <div className="overflow-x-auto border border-line rounded-lg">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-canvas">
              <th className="px-2 py-1.5 text-left font-semibold text-ink-muted">Name</th>
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
                    placeholder="e.g. Jersey #"
                    className="w-20 px-1.5 py-1 bg-white border border-taupe rounded text-xs focus:outline-none"
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
              <tr key={ri} className="border-t border-line">
                <td className="px-2 py-1">
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => updateRowName(ri, e.target.value)}
                    className="w-20 px-1 py-0.5 bg-surface border border-line rounded text-xs focus:outline-none focus:border-taupe"
                  />
                </td>
                <td className="px-2 py-1">
                  <select
                    value={row.size}
                    onChange={(e) => updateRowSize(ri, e.target.value)}
                    className={`w-20 px-1 py-0.5 bg-surface border rounded text-xs focus:outline-none focus:border-taupe ${row.size ? 'border-line text-ink' : 'border-taupe text-ink-faint'}`}
                  >
                    <option value="" disabled>Select</option>
                    {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                {row.values.map((val, ci) => (
                  <td key={ci} className="px-2 py-1">
                    <input
                      type="text"
                      value={val ?? ''}
                      onChange={(e) => updateCell(ri, ci, e.target.value)}
                      className="w-16 px-1 py-0.5 bg-surface border border-line rounded text-xs focus:outline-none focus:border-taupe"
                    />
                  </td>
                ))}
                <td className="px-2 py-1 text-center">
                  <button type="button" onClick={() => removeRow(ri)} title="Remove row" className="shrink-0 text-ink-faint hover:text-danger focus:outline-none">
                    <X size={12} />
                  </button>
                </td>
              </tr>
            ))}
            <tr className="border-t border-line">
              <td className="px-2 py-1.5" colSpan={columns.length + 3}>
                <button type="button" onClick={addRow} className="flex items-center gap-1 text-taupe text-xs font-semibold hover:underline focus:outline-none">
                  <Plus size={12} /> Add person
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
