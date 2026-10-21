import { AlertTriangle } from 'lucide-react';
import { serviceHasType } from '@/components/jobs/jobHelpers';
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

      {!isRepair && !serviceHasType(service, 'bulk_sublimation') && (
        <div>
          <span className={LABEL}>People to measure</span>
          <div className="flex flex-wrap gap-2">
            <Chip active={!form.bulkChosen} onClick={() => { form.setBulkChosen(false); set({ quantity: String(Math.max(1, form.pricing.quantity)) }); }}>One person</Chip>
            <Chip active={form.bulkChosen} onClick={() => { form.setBulkChosen(true); const n = Math.max(2, Number(formData.quantity) || 1); form.setRoster((cur) => (cur.length >= n ? cur : [...cur, ...Array.from({ length: n - cur.length }, form.blankRow)])); }}>2 or more — list each person</Chip>
          </div>
        </div>
      )}
    </div>
  );
}
