'use client';

import { X, Plus, Trash2 } from 'lucide-react';
import type { StoreBranch } from './types';

export interface BulkRosterRow {
  name: string;
  size: string;
}

interface BulkOrderSheetProps {
  readonly show: boolean;
  readonly onClose: () => void;
  readonly itemName: string;
  readonly sizes: string[] | null | undefined;
  readonly minQty: number;
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
 * contract as-is (catalog_item_id, organization_name, store_branch_id,
 * roster[]{name,size}). No extra fields invented. Custom Bulk's possible
 * future needs (consultation/sample approval) are explicitly out of scope
 * here — docs/CUSTOMER-JOURNEY-TARGET.md §11.
 */
export default function BulkOrderSheet({
  show, onClose, itemName, sizes, minQty, branches, branchId, setBranchId,
  organizationName, setOrganizationName, roster, setRoster, submitting, error, onSubmit,
}: BulkOrderSheetProps) {
  if (!show) return null;

  const validCount = roster.filter((r) => r.size).length;

  const addRow = () => setRoster([...roster, { name: '', size: '' }]);
  const removeRow = (i: number) => setRoster(roster.filter((_, idx) => idx !== i));
  const updateRow = (i: number, patch: Partial<BulkRosterRow>) =>
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
            Requires at least {minQty} piece{minQty !== 1 ? 's' : ''}. Add each person&apos;s name (optional) and size.
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
            <div className="space-y-2">
              {roster.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
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
