import { BTN_SM } from '@/components/shared/plainForm';
import { FIELD, LABEL } from './FormStep';
import { peso } from './jobFormHelpers';
import type { JobCreateForm } from './useJobCreateForm';

/**
 * The price as it stands right now, so the owner sees what the service (or design) costs before the last step.
 * It is the price of ONE piece × the pieces; type another amount when only part of the garment is made (a top only, a bottom only).
 */
export default function PriceNow({ form }: Readonly<{ form: JobCreateForm }>) {
  const { formData, set, pricing: p, design, service, isBulk } = form;
  // The service holds the price. A design only adds a charge to it, or asks for a quotation; it is never a second price list.
  const dp = design?.pricing ?? null;
  const serviceName = service?.name ?? 'the service';
  let basis = `Starts from the price of ${serviceName}.`;
  if (dp?.mode === 'extra' && dp.service_price != null) basis = `${serviceName} ${peso(dp.service_price)} + ${peso(dp.extra_charge ?? 0)} for this design.`;
  else if (dp?.mode === 'set' && dp.amount != null) basis = `This design has its own set price instead of the service price.`;
  else if (dp?.mode === 'quote') basis = 'This design is priced by quotation. Type the price you agreed, or leave it empty to quote it later.';
  const typed = formData.unit_price != null && formData.unit_price.trim() !== '';
  const shown = typed ? formData.unit_price! : p.suggestedUnit != null ? String(p.suggestedUnit) : '';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="unit_price" className={LABEL}>Price for each piece (₱)</label>
          <input id="unit_price" type="number" inputMode="decimal" min="0" step="0.01" value={shown} onChange={(e) => set({ unit_price: e.target.value })} placeholder="0.00" className={FIELD} />
        </div>
        <div>
          <span className={LABEL}>Total for {p.quantity} {p.quantity === 1 ? 'piece' : 'pieces'}</span>
          <p className="flex h-11 items-center text-base font-semibold text-espresso">{p.unit == null ? 'To be quoted' : peso(p.unit * p.quantity)}</p>
        </div>
      </div>
      <p className="text-sm text-espresso/60">
        {p.suggestedUnit == null && !typed && dp?.mode !== 'quote' ? `${serviceName} has no fixed price. Type the price you agreed, or leave it empty to quote later.` : basis}
        {' '}Making only a top or only a bottom? Type that price here.
        {isBulk && ' Every piece in the team list is counted in the next step.'}
      </p>
      {typed && <button type="button" onClick={() => set({ unit_price: null })} className={BTN_SM}>Use the {design && dp?.mode !== 'same' ? 'design' : 'service'} price again</button>}
    </div>
  );
}
