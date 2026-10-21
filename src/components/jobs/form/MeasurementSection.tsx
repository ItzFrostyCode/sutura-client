import FormStep from './FormStep';
import MeasureGuide from './MeasureGuide';
import MeasurementField from './MeasurementField';
import type { JobCreateForm } from './useJobCreateForm';

const REQUIREMENT: Record<string, string> = {
  none: 'Not required for this service.',
  existing: 'This service needs the customer’s saved measurements.',
  shop: 'This service is measured at the shop.',
};

/** The customer's measurements for this order: saved ones in view, record new ones, or a standard size — with the shop's own how-to-measure guide. */
export default function MeasurementSection({ form }: Readonly<{ form: JobCreateForm }>) {
  const { service, design, formData, set, isBulk } = form;
  const customerName = form.customers.find((c) => c.id.toString() === formData.customer_id)?.name;
  const hint = isBulk ? 'Measured per person in the Team list.' : (service?.measurement_requirement && REQUIREMENT[service.measurement_requirement]) || 'Saved, new or standard size.';

  return (
    <FormStep title="Customer measurements" hint={hint}>
      {isBulk ? (
        <>
          <MeasureGuide design={design} service={service} />
          <p className="text-sm text-ink-body">Every person on a team order is a row in the Team list. Pick a size, or <strong>Custom Fit</strong> and type that person’s measurements right under their row — no need to leave this page.</p>
        </>
      ) : (
        <>
          <MeasureGuide design={design} service={service} />
          <MeasurementField
            customerId={formData.customer_id}
            customerName={customerName}
            defaultUnit={form.store?.default_measurement_unit === 'cm' ? 'cm' : 'in'}
            styleOptions={service?.roster_fields?.find((f) => f.label === 'Style' && f.type === 'select')?.options}
            storeId={form.store?.id}
            appointmentId={form.appointmentId}
            targetTitle={service?.name ?? formData.garment_type}
            measurements={form.measurements}
            selectedId={formData.measurement_id}
            onSelect={(id) => set({ measurement_id: id })}
            standardSize={form.standardSize}
            onStandardSize={form.setStandardSize}
            measurementMode={form.measurementMode}
            onMeasurementModeChange={form.setMeasurementMode}
            inlineMeasurement={form.inlineMeasurement}
            onInlineMeasurementChange={form.setInlineMeasurement}
            persons={form.inlineMeasurements}
            activePersonIndex={form.activePersonIndex}
            onSelectPerson={form.setActivePersonIndex}
            onAddPerson={form.addPersonToMeasure}
            onRemovePerson={form.removePersonToMeasure}
            onUpdatePerson={form.updatePersonMeasurement}
          />
        </>
      )}
    </FormStep>
  );
}
