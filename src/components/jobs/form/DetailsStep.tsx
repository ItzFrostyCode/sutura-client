import { AlertTriangle } from 'lucide-react';
import { serviceHasType } from '@/components/jobs/jobHelpers';
import { FIELD, LABEL, Chip } from './FormStep';
import MeasurementField from './MeasurementField';
import ServiceQuestions from './ServiceQuestions';
import RosterEditor from './RosterEditor';
import ReferenceNotes from './ReferenceNotes';
import type { JobCreateForm } from './useJobCreateForm';

/** Everything the chosen service needs to know: questions, measurements, fabric, condition (repairs), team list (bulk), photo and notes. */
export default function DetailsStep({ form }: Readonly<{ form: JobCreateForm }>) {
  const { service, formData, set, isRepair, isBulk } = form;
  const needsMeasurements = !isBulk && service?.measurement_requirement !== 'none';
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

      {needsMeasurements && (
        <MeasurementField
          customerId={formData.customer_id} measurements={form.measurements} selectedId={formData.measurement_id}
          onSelect={(id) => set({ measurement_id: id })} standardSize={form.standardSize} onStandardSize={form.setStandardSize}
        />
      )}

      <div>
        <span className={LABEL}>Fabric</span>
        <div className="flex flex-wrap gap-2">
          <Chip active={!ownFabric} onClick={() => set({ material_source: 'store_supplied' })}>Shop’s fabric</Chip>
          <Chip active={ownFabric} onClick={() => set({ material_source: 'customer_supplied' })}>Customer’s own fabric / garment</Chip>
        </div>
        {ownFabric && (
          <p className="mt-2 flex items-start gap-2 text-xs text-amber-700">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            Add a photo of what they brought below, so the cutter does not reach for shop stock.
          </p>
        )}
      </div>

      {!isRepair && !serviceHasType(service, 'bulk_sublimation') && (
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink">
          <input type="checkbox" checked={form.bulkChosen} onChange={(e) => form.setBulkChosen(e.target.checked)} className="h-5 w-5 accent-taupe" />
          This is a team or group order (uniforms, jerseys) — list each person and size
        </label>
      )}
      {isBulk && (
        <RosterEditor
          teamName={form.teamName} onTeamName={form.setTeamName} roster={form.roster} onRoster={form.setRoster}
          newRow={form.blankRow} minQty={service.min_order_qty}
        />
      )}

      <ReferenceNotes
        storeId={form.store?.id} images={form.referenceImages} onImages={form.setReferenceImages} link={form.referenceLink}
        onLink={form.setReferenceLink} notes={formData.notes} onNotes={(v) => set({ notes: v })}
        photoLabel={isRepair ? 'Photo of the garment as received' : 'Photo of what they want'}
      />
    </div>
  );
}
