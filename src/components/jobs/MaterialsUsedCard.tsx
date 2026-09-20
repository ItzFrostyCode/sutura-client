'use client';

import { useState } from 'react';
import { Scissors, Plus, Trash2, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import type { Job } from '@/components/jobs/jobTypes';

interface MaterialsUsedCardProps {
  readonly shopId: number;
  readonly jobOrderId: number;
  readonly materials: NonNullable<Job['materials']>;
  readonly onChange: () => void;
}

// Per-order fabric/trim attribution — what was used on THIS job, logged
// typically by the cutter during cutting. Deliberately NOT a stock ledger:
// no shop-wide running balance is ever shown or computed anywhere from
// these rows (thesis Scope & Limitations excludes inventory entirely).
export default function MaterialsUsedCard({ shopId, jobOrderId, materials, onChange }: MaterialsUsedCardProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('yard');
  const [unitCost, setUnitCost] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const totalCost = materials.reduce((sum, m) => sum + (m.subtotal_cost ? Number(m.subtotal_cost) : 0), 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !quantity) return;
    setSaving(true);
    try {
      await api.post(`/shops/${shopId}/jobs/${jobOrderId}/materials`, {
        material_name: name.trim(),
        quantity_used: Number(quantity),
        unit,
        unit_cost: unitCost ? Number(unitCost) : null,
      });
      setName('');
      setQuantity('');
      setUnitCost('');
      setAdding(false);
      onChange();
    } catch {
      // Non-critical logging action — a failed attempt just leaves the form
      // open so the user can retry, same as this app's other lightweight forms.
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (materialId: number) => {
    setDeletingId(materialId);
    try {
      await api.delete(`/shops/${shopId}/jobs/${jobOrderId}/materials/${materialId}`);
      onChange();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Scissors size={14} className="text-taupe" />
          <h3 className="text-sm font-bold text-ink">Materials Used</h3>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs font-semibold text-taupe hover:text-taupe-hover"
          >
            <Plus size={13} /> Log Material
          </button>
        )}
      </div>

      {materials.length === 0 && !adding && (
        <p className="text-xs text-ink-faint">No materials logged for this order yet.</p>
      )}

      {materials.length > 0 && (
        <div className="space-y-2 mb-3">
          {materials.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2 text-xs bg-canvas border border-line rounded-lg px-3 py-2">
              <div className="min-w-0">
                <p className="font-semibold text-ink truncate">{m.material_name}</p>
                <p className="text-ink-faint">
                  {Number(m.quantity_used)} {m.unit}
                  {m.subtotal_cost !== null && ` · ₱${Number(m.subtotal_cost).toLocaleString()}`}
                  {m.logged_by && ` · ${m.logged_by.name}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(m.id)}
                disabled={deletingId === m.id}
                className="shrink-0 text-ink-faint hover:text-danger transition-colors disabled:opacity-50"
                aria-label="Remove"
              >
                {deletingId === m.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              </button>
            </div>
          ))}
          {totalCost > 0 && (
            <p className="text-[11px] text-ink-muted text-right">Total: ₱{totalCost.toLocaleString()}</p>
          )}
        </div>
      )}

      {adding && (
        <form onSubmit={handleAdd} className="space-y-2 pt-2 border-t border-line">
          <input
            type="text"
            required
            placeholder="Material (e.g. Navy Blue Wool Blend)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-canvas border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-taupe"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="Qty"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="px-2.5 py-1.5 bg-canvas border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-taupe"
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="px-2.5 py-1.5 bg-canvas border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-taupe"
            >
              <option value="yard">yard</option>
              <option value="meter">meter</option>
              <option value="piece">piece</option>
              <option value="roll">roll</option>
            </select>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="₱/unit"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              className="px-2.5 py-1.5 bg-canvas border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-taupe"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="px-3 py-1.5 bg-taupe hover:bg-taupe-hover text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
