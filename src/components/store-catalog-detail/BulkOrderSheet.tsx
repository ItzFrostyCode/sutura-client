'use client';

import { X, Plus, Trash2 } from 'lucide-react';
import type { StoreBranch } from './types';

export interface RosterField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'radio' | 'checkbox';
  required: boolean;
  options?: string[];
}

export interface BulkRosterRow {
  name: string;
  size: string;
  [key: string]: string;
}

interface BulkOrderSheetProps {
  readonly show: boolean;
  readonly onClose: () => void;
  readonly itemName: string;
  readonly sizes: string[] | null | undefined;
  readonly minQty: number;
  // Extra per-person columns the shop owner defined on this bulk service
  // (e.g. "Jersey Number", "Position") — shown below Name/Size on each
  // roster row, alongside them, not replacing them.
  readonly rosterFields?: RosterField[];
  readonly branches: StoreBranch[];
  readonly branchId: number | null;
  readonly setBranchId: (id: number | null) => void;
  readonly organizationName: string;
  readonly setOrganizationName: (v: string) => void;
  readonly roster: BulkRosterRow[];
  readonly setRoster: (rows: BulkRosterRow[]) => void;
  readonly submitting: boolean;
  readonly error: string;
  readonly onSubmit: () => void;
}

/**
 * Standard Bulk customer entry point — calls the existing customerBulkOrder()
 * contract (catalog_item_id, organization_name, store_branch_id,
 * roster[]{name,size,...extra}). The backend already preserves whatever
 * extra keys a row carries beyond name/size (see JobOrderController::
 * customerBulkOrder's raw-input roster comment), so rosterFields here are
 * additive, not a contract change.
 */
export default function BulkOrderSheet({
  show, onClose, itemName, sizes, minQty, rosterFields = [], branches, branchId, setBranchId,
  organizationName, setOrganizationName, roster, setRoster, submitting, error, onSubmit,
}: BulkOrderSheetProps) {
  if (!show) return null;

  const validCount = roster.filter((r) => r.size).length;

  const emptyRow = (): BulkRosterRow => {
    const row: BulkRosterRow = { name: '', size: '' };
    rosterFields.forEach((f) => { row[f.id] = ''; });
    return row;
  };
  const addRow = () => setRoster([...roster, emptyRow()]);
  const removeRow = (i: number) => setRoster(roster.filter((_, idx) => idx !== i));
  const updateRow = (i: number, patch: Record<string, string>) =>
    setRoster(roster.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative w-full sm:max-w-md sm:rounded-2xl bg-surface border border-line rounded-t-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line shrink-0">
          <h3 className="mobile-h3 font-semibold text-ink">Bulk Order — {itemName}</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-ink-faint hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          <p className="mobile-caption text-ink-muted font-normal">
            Requires at least {minQty} piece{minQty !== 1 ? 's' : ''}. Add each person&apos;s name (optional) and size{rosterFields.length > 0 ? ', plus a few extra details' : ''}.
          </p>

          <div>
            <label htmlFor="bulk-org-name" className="mobile-caption font-semibold text-ink-muted block mb-1">
              Team / organization name (optional)
            </label>
            <input
              id="bulk-org-name"
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g. Grade 11 - St. Thomas"
              className="w-full h-11 px-3 bg-canvas border border-line focus:border-taupe focus:outline-none text-sm text-ink rounded-none"
            />
          </div>

          {branches.length > 1 && (
            <div>
              <label htmlFor="bulk-branch" className="mobile-caption font-semibold text-ink-muted block mb-1">Branch</label>
              <select
                id="bulk-branch"
                value={branchId ?? ''}
                onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : null)}
                className="w-full h-11 px-3 bg-canvas border border-line focus:border-taupe focus:outline-none text-sm text-ink rounded-none"
              >
                <option value="">Main branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="mobile-caption font-semibold text-ink-muted">Roster ({validCount})</span>
              <button type="button" onClick={addRow} className="flex items-center gap-1 text-xs font-semibold text-taupe hover:underline">
                <Plus size={12} /> Add person
              </button>
            </div>
            <div className="space-y-2.5">
              {roster.map((row, i) => (
                <div key={i} className="border border-line p-2 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateRow(i, { name: e.target.value })}
                      placeholder={`Person ${i + 1} (optional)`}
                      className="flex-1 min-w-0 h-10 px-2.5 bg-canvas border border-line focus:border-taupe focus:outline-none text-sm text-ink rounded-none"
                    />
                    <select
                      value={row.size}
                      onChange={(e) => updateRow(i, { size: e.target.value })}
                      className={`w-24 h-10 px-2 bg-canvas border focus:outline-none text-sm rounded-none ${row.size ? 'border-line text-ink' : 'border-taupe text-ink-faint'}`}
                    >
                      <option value="" disabled>Size</option>
                      {(sizes ?? []).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button type="button" onClick={() => removeRow(i)} disabled={roster.length <= 1} className="w-8 h-8 flex items-center justify-center shrink-0 text-ink-faint hover:text-danger disabled:opacity-30">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {rosterFields.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {rosterFields.map((f) => (
                        <input
                          key={f.id}
                          type={f.type === 'number' ? 'number' : 'text'}
                          value={row[f.id] ?? ''}
                          onChange={(e) => updateRow(i, { [f.id]: e.target.value })}
                          placeholder={f.label + (f.required ? ' *' : '')}
                          className="flex-1 min-w-[100px] h-9 px-2 bg-canvas border border-line focus:border-taupe focus:outline-none text-xs text-ink rounded-none"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}
        </div>

        <div className="p-4 border-t border-line shrink-0" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="w-full btn-primary-mobile bg-ink hover:bg-taupe text-white font-medium rounded-none text-sm disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : `Submit Bulk Order (${validCount} pcs)`}
          </button>
        </div>
      </div>
    </div>
  );
}
