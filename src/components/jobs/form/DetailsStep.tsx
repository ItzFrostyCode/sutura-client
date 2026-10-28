import { AlertTriangle } from 'lucide-react';
import { FIELD, LABEL, Chip } from './FormStep';
import ServiceQuestions from './ServiceQuestions';
import type { JobCreateForm } from './useJobCreateForm';

/** What the chosen service needs to know: its questions, the garment's condition (repairs), the fabric, and whether it is a team order. */
export default function DetailsStep({ form }: Readonly<{ form: JobCreateForm }>) {
  const { service, formData, set, isRepair } = form;
  const ownFabric = formData.material_source === 'customer_supplied';

  if (!service) return <p className="text-sm text-ink-faint">Choose a service above and its details appear here.</p>;

  return (
    <div className="space-y-5">
      <ServiceQuestions
        fields={service.custom_fields ?? []}
        values={form.customFieldValues}
        onChange={(label, value) => form.setCustomFieldValues((prev) => ({ ...prev, [label]: value }))}
      />

      {isRepair && (
        <div>
          <label htmlFor="damage_notes" className={LABEL}>Condition of the garment as received <span className="text-danger">*</span></label>
          <textarea
            id="damage_notes" rows={2} required value={form.damageNotes} onChange={(e) => form.setDamageNotes(e.target.value)}
            placeholder="Stains, tears, missing buttons — or “no visible damage”. Protects the shop if the customer disputes it later."
            className={`${FIELD} h-auto min-h-20 resize-y py-2`}
          />
          <label htmlFor="local_adjustment" className={`${LABEL} mt-4`}>Where and how much to change <span className="font-normal text-espresso/60">(optional)</span></label>
          <textarea
            id="local_adjustment" rows={2} maxLength={500} value={form.customFieldValues.local_adjustment ?? ''}
            onChange={(e) => form.setCustomFieldValues((prev) => ({ ...prev, local_adjustment: e.target.value }))}
            placeholder="A fit change needs only the part being changed, not full measurements: e.g. hem the pants to 38 in, shorten the sleeves 1 in."
            className={`${FIELD} h-auto resize-y py-2`}
          />
        </div>
      )}

      <div>
        <span className={LABEL}>Fabric</span>
        <div className="flex flex-wrap gap-2">
          <Chip active={!ownFabric} onClick={() => set({ material_source: 'store_supplied' })}>Shop’s fabric</Chip>
          <Chip active={ownFabric} onClick={() => set({ material_source: 'customer_supplied' })}>Customer’s own fabric / garment</Chip>
        </div>
        {ownFabric && (
          <p className="mt-2 flex items-start gap-2 text-sm text-espresso/70">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            Add a photo of what they brought under Photos and notes, so the cutter does not reach for shop stock.
          </p>
        )}
      </div>

      {form.isBulk ? (
        <p className="text-sm text-espresso/70">This is a team order: the people and how many pieces each needs are listed in the next step, Sizing.</p>
      ) : (
        <div className="sm:max-w-56">
          <label htmlFor="quantity" className={LABEL}>How many pieces?</label>
          <input id="quantity" type="number" inputMode="numeric" min="1" step="1" value={formData.quantity} onChange={(e) => set({ quantity: e.target.value })} className={FIELD} />
          <p className="mt-1 text-sm text-espresso/60">The garments to make in all. Who wears them is the next step.</p>
        </div>
      )}
    </div>
  );
}
