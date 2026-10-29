import { isWalkInEmail } from '@/components/customers/customerHelpers';
import FormStep from '../FormStep';
import CustomerStep from '../CustomerStep';
import ConsultationRecap from '../ConsultationRecap';
import type { JobCreateForm } from '../useJobCreateForm';

/** Step 1: who is paying and collecting. The wearers (the people who will be measured) come later, in Sizing. */
export default function StepCustomer({ form }: Readonly<{ form: JobCreateForm }>) {
  const { formData, set, appointment } = form;
  const placeholderVisit = !!appointment && isWalkInEmail(appointment.customer?.email);
  return (
    <div className="space-y-6">
      <FormStep title="Customer information" hint="Who is placing this order? Search for them, or add a new customer.">
        <CustomerStep
          customers={form.customers} customerId={formData.customer_id} onChange={(id) => set({ customer_id: id })} onAdd={form.addCustomer}
          locked={form.customerLocked && !placeholderVisit} unnamedVisit={placeholderVisit} appointment={appointment} fixed={!!appointment && !placeholderVisit}
          onUnlock={() => form.setCustomerLocked(false)} channel={form.intakeChannel} appointmentId={form.appointmentId}
        />
      </FormStep>
      {appointment && <ConsultationRecap appointment={appointment} />}
    </div>
  );
}
