'use client';

import { useAuthStore } from '@/store/useAuthStore';
import type { ServiceCharges, ServiceDraft } from './serviceEditing';

const FIELD = 'h-12 w-full min-w-0 rounded-xl border border-line bg-surface px-4 text-base text-ink focus:border-ink focus:outline-none';
const peso = (n: number) => `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;

const RUSH_CHOICES: { value: ServiceCharges['rush']; label: string }[] = [
  { value: 'shop', label: 'Same as the shop' },
  { value: 'custom', label: 'Its own rush fee' },
  { value: 'none', label: 'No rush for this service' },
];

/**
 * What changes this service's price, each with the result worked out on the spot from its first priced option:
 * rush (the shop's rule, its own % or ₱ per piece, or none) and the pesos off when the customer brings their own fabric.
 * The same numbers reach the online order, the walk-in form and the quotation (App\Support\RushFee on the server).
 */
export default function ServiceChargesEditor({ d, patch }: Readonly<{ d: ServiceDraft; patch: (p: Partial<ServiceDraft>) => void }>) {
  const store = useAuthStore((s) => s.store) as { rush_available?: boolean; rush_fee_mode?: string; rush_fee_percent?: number | string; rush_fee_per_piece?: number | string } | null;
  const c = d.charges;
  const set = (p: Partial<ServiceCharges>) => patch({ charges: { ...c, ...p } });

  // The example price: the first option with a price, else the service's own price.
  const first = d.tiers.find((t) => Number(t.amount) > 0);
  const example = first ? { label: first.label || 'This option', price: Number(first.amount) } : Number(d.base_price) > 0 ? { label: 'The service', price: Number(d.base_price) } : null;

  const shopRule = !store?.rush_available ? 'The shop takes no rush orders.'
    : store.rush_fee_mode === 'per_piece' ? `The shop adds ${peso(Number(store.rush_fee_per_piece) || 0)} per piece.`
      : `The shop adds ${Number(store.rush_fee_percent ?? 30)}% of the price.`;
  const rushAdd = (price: number) => {
    if (c.rush === 'none') return null;
    if (c.rush === 'custom') return c.rushMode === 'per_piece' ? Number(c.rushPerPiece) || 0 : (price * (Number(c.rushPercent) || 0)) / 100;
    if (!store?.rush_available) return null;
    return store.rush_fee_mode === 'per_piece' ? Number(store.rush_fee_per_piece) || 0 : (price * Number(store.rush_fee_percent ?? 30)) / 100;
  };
  const add = example ? rushAdd(example.price) : null;
  const fabric = Number(c.ownFabric) || 0;

  return (
    <div className="space-y-6 border-t border-line pt-5">
      <fieldset>
        <legend className="text-base font-medium text-ink">Rush order</legend>
        <p className="mb-2 text-sm text-ink-muted">Some work is harder to rush. {shopRule}</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Rush order">
          {RUSH_CHOICES.map((r) => (
            <button key={r.value} type="button" role="radio" aria-checked={c.rush === r.value} onClick={() => set({ rush: r.value })}
              className={`min-h-12 rounded-xl border px-3 text-sm font-medium ${c.rush === r.value ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink hover:border-line-strong'}`}>
              {r.label}
            </button>
          ))}
        </div>
        {c.rush === 'custom' && (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select value={c.rushMode} onChange={(e) => set({ rushMode: e.target.value as ServiceCharges['rushMode'] })} aria-label="Rush fee by" className={FIELD}>
              <option value="percent">A percentage of the price</option>
              <option value="per_piece">Pesos for every piece</option>
            </select>
            {c.rushMode === 'percent'
              ? <input type="number" inputMode="decimal" min={1} max={200} value={c.rushPercent} onChange={(e) => set({ rushPercent: e.target.value })} placeholder="% e.g. 30" aria-label="Rush percentage" className={FIELD} />
              : <input type="number" inputMode="decimal" min={1} value={c.rushPerPiece} onChange={(e) => set({ rushPerPiece: e.target.value })} placeholder="₱ per piece" aria-label="Rush pesos per piece" className={FIELD} />}
          </div>
        )}
        {example && (
          <p className="mt-2 text-sm text-ink-body" aria-live="polite">
            {add == null ? `${example.label} cannot be rushed.` : `${example.label} ${peso(example.price)} → rush ${peso(example.price + add)} (+${peso(add)} per piece). A repeat customer pays half the rush.`}
          </p>
        )}
      </fieldset>

      <div>
        <label htmlFor="svc-own-fabric" className="text-base font-medium text-ink">Customer brings own fabric</label>
        <p className="mb-2 text-sm text-ink-muted">Pesos taken off each piece. Leave empty if the price stays the same.</p>
        <input id="svc-own-fabric" type="number" inputMode="decimal" min={0} value={c.ownFabric} onChange={(e) => set({ ownFabric: e.target.value })} placeholder="₱ off per piece" className={`${FIELD} sm:max-w-xs`} />
        {example && fabric > 0 && (
          <p className="mt-2 text-sm text-ink-body" aria-live="polite">{example.label} {peso(example.price)} → {peso(Math.max(0, example.price - fabric))} with their fabric.</p>
        )}
      </div>
    </div>
  );
}
