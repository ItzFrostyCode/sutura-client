import { garmentLabel } from '@/lib/garmentTaxonomy';
import { BTN } from '@/components/shared/plainForm';
import FormStep from './FormStep';
import MeasureGuide from './MeasureGuide';
import MeasurementField from './MeasurementField';
import type { JobCreateForm } from './useJobCreateForm';

const REQUIREMENT: Record<string, string> = {
  existing: 'This service uses the measurements the customer already has on file.',
  shop: 'This service is measured at the shop: pick how below.',
};

/**
 * One person's sizing: a saved profile, new measurements (Custom Fit), a standard size, or measuring later.
 * A service that needs no measuring shows one line and a button instead of the whole form, so nothing here looks required when it is not.
 * A team order is sized per person in the Team list instead (see SizingStep).
 */
export default function MeasurementSection({ form }: Readonly<{ form: JobCreateForm }>) {
  const { service, design, formData, set } = form;
  const customerName = form.customers.find((c) => c.id.toString() === formData.customer_id)?.name;

  if (form.measurementHidden) {
    return (
      <FormStep title="Sizing" hint="This service needs no body measurements. The details it asks for (questions, condition, photos) are still filled in.">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-espresso/70">You can go on without them, or still note a size.</p>
          <button type="button" onClick={() => form.setAddMeasurements(true)} className={BTN}>Add a size or measurements</button>
        </div>
      </FormStep>
    );
  }

  const optional = form.measurementNeed === 'none';
  return (
    <FormStep
      title="Sizing"
      hint={optional ? 'Not required for this service, but you can add a size or measurements.' : (REQUIREMENT[form.measurementNeed] ?? 'Saved, new or standard size.')}
      action={optional ? <button type="button" onClick={() => form.setAddMeasurements(false)} className={BTN}>Hide</button> : undefined}
    >
      <MeasureGuide design={design} service={service} />
      <MeasurementField
        customerId={formData.customer_id}
        customerName={customerName}
        defaultUnit={form.store?.default_measurement_unit === 'cm' ? 'cm' : 'in'}
        styleOptions={service?.roster_fields?.find((f) => f.label === 'Style' && f.type === 'select')?.options}
        storeId={form.store?.id}
        appointmentId={form.appointmentId}
        targetTitle={garmentLabel(formData.garment_type) ?? (formData.garment_type || service?.name)}
        measurements={form.measurements}
        selectedId={formData.measurement_id}
        onSelect={(id) => set({ measurement_id: id })}
        standardSize={form.standardSize}
        onStandardSize={form.setStandardSize}
        areaLocked={form.areaLocked}
        standardSizeBottom={form.standardSizeBottom}
        onStandardSizeBottom={form.setStandardSizeBottom}
        measurementMode={form.measurementMode}
        onMeasurementModeChange={form.setMeasurementMode}
        inlineMeasurement={form.inlineMeasurement}
        onInlineMeasurementChange={form.setInlineMeasurement}
        persons={form.inlineMeasurements}
        activePersonIndex={form.activePersonIndex}
        onSelectPerson={form.setActivePersonIndex}
        onUpdatePerson={form.updatePersonMeasurement}
      />
    </FormStep>
  );
}
