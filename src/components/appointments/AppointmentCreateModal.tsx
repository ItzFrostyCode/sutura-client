import WalkInKindFields from './WalkInKindFields';
import CustomerPicker from './CustomerPicker';
import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Loader2 } from 'lucide-react';
import { useBranch } from '@/context/BranchContext';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Appointment, CustomerData, BranchData, StaffData, ServiceData, AppointmentType,
  TYPE_CONFIG, TYPE_DEFAULT_DURATIONS, getLocalDateString
} from './appointmentHelpers';
import { roleLabel } from '@/components/staff/staffHelpers';
import CustomerFormModal from '@/components/customers/CustomerFormModal';
import InteractiveCalendar from '@/components/shared/InteractiveCalendar';

interface AppointmentCreateModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly editingApt?: Appointment | null;
  /** A customer to start with (Book appointment from their profile). */
  readonly presetCustomerId?: string;
  readonly customers?: CustomerData[];
  readonly branches?: BranchData[];
  readonly staff?: StaffData[];
  readonly services?: ServiceData[];
  readonly appointments?: Appointment[];
  readonly onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  readonly onCreateCustomer: (payload: Record<string, string | null>) => Promise<CustomerData>;
  readonly isSubmitting: boolean;
  readonly error: string;
}

// Only these represent genuinely occupied time — a cancelled/no-show slot
// shouldn't block a new booking at the same time.
const OCCUPYING_STATUSES = new Set(['pending', 'confirmed', 'in_progress']);

const defaultForm = {
  kind: 'shop' as 'service' | 'shop', service_id: '', when: 'later' as 'now' | 'later',
  customer_id: '', appointment_type: 'consultation' as AppointmentType,
  store_branch_id: '', scheduled_date: '', scheduled_time: '',
  duration_minutes: String(TYPE_DEFAULT_DURATIONS.consultation), assigned_staff_id: '', notes: '', purpose_label: '',
};

export default function AppointmentCreateModal({
  isOpen, onClose, editingApt, presetCustomerId = '', customers = [], branches = [], staff = [], services = [], appointments = [], onSubmit, onCreateCustomer, isSubmitting, error
}: AppointmentCreateModalProps) {
  const [formData, setFormData] = useState(defaultForm);
  const { selectedBranchId } = useBranch();
  const { store } = useAuthStore();

  // 3-step wizard — same shape as the public customer booking page, minus
  // the Payment step (the owner isn't paying themselves for a walk-in).
  const [step, setStep] = useState(1);

  // Exclude the appointment being edited from its own conflict check —
  // otherwise its already-booked slot would look occupied by itself.
  const calendarAppointments = appointments
    .filter(a => OCCUPYING_STATUSES.has(a.status) && a.id !== editingApt?.id)
    .map(a => ({
      scheduled_at: a.scheduled_at,
      duration_minutes: a.duration_minutes,
      store_branch_id: a.store_branch_id ?? null,
      status: a.status,
    }));

  // Quick "Add New Customer" — lets the owner register a first-time walk-in
  // without abandoning the appointment they're already mid-way through.
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [addCustomerError, setAddCustomerError] = useState('');

  const handleAddCustomer = async (payload: Record<string, string | null>) => {
    setAddingCustomer(true);
    setAddCustomerError('');
    try {
      const newCustomer = await onCreateCustomer(payload);
      setFormData(prev => ({ ...prev, customer_id: newCustomer.id.toString() }));
      setShowAddCustomer(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setAddCustomerError(e.response?.data?.message || 'Failed to create customer.');
    } finally {
      setAddingCustomer(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStep(1);
    if (editingApt) {
      const d = new Date(editingApt.scheduled_at);
      const custId = editingApt.customer?.id?.toString() || '';
      const localDate = getLocalDateString(d);
      const today = getLocalDateString(new Date());
      setFormData({
        kind: editingApt.kind === 'service' ? 'service' : 'shop',
        service_id: editingApt.service?.id?.toString() || '',
        when: 'later',
        customer_id: custId,
        appointment_type: editingApt.appointment_type,
        store_branch_id: editingApt.store_branch_id?.toString() || '',
        scheduled_date: localDate < today ? today : localDate,
        scheduled_time: d.toTimeString().substring(0, 5),
        duration_minutes: (editingApt.duration_minutes || TYPE_DEFAULT_DURATIONS[editingApt.appointment_type]).toString(),
        assigned_staff_id: editingApt.assigned_staff_id?.toString() || '',
        notes: editingApt.notes || '',
        purpose_label: editingApt.purpose_label || '',
      });
    } else {
      const defaultBranchId = selectedBranchId?.toString() || '';
      const today = getLocalDateString(new Date());
      setFormData({
        ...defaultForm,
        customer_id: presetCustomerId,
        scheduled_date: today,
        store_branch_id: defaultBranchId || (branches.length === 1 ? branches[0].id.toString() : '')
      });
    }
  }, [editingApt, isOpen, customers, branches, selectedBranchId, presetCustomerId]);

  // Step 1 (Who & What) — just Customer + Type now; Service/Garment Category/
  // Job Order linking were removed (finalized later at Job Order creation, or
  // — for Fitting — auto-linked by the system when a job becomes Ready for
  // Fitting, see JobOrderController@update on the backend).
  const step1Valid = !!formData.customer_id && !!formData.appointment_type
    && (formData.kind !== 'service' || !!formData.service_id)
    && (formData.appointment_type !== 'other' || formData.purpose_label.trim() !== '');

  const step2Valid = !!formData.scheduled_date && !!formData.scheduled_time;

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const now = new Date();
    const date = formData.when === 'now' ? getLocalDateString(now) : formData.scheduled_date;
    const time = formData.when === 'now' ? now.toTimeString().substring(0, 5) : formData.scheduled_time;
    const common = {
      customer_id: formData.customer_id,
      appointment_type: formData.appointment_type,
      purpose_label: formData.appointment_type === 'other' ? formData.purpose_label.trim() : null,
      scheduled_at: `${date} ${time}:00`,
      notes: formData.notes || null,
      store_branch_id: formData.store_branch_id || null,
      assigned_staff_id: formData.assigned_staff_id || null,
    };
    // A new visit: the server picks the length (one table for online and walk-in) and, for a service, the purpose.
    onSubmit(editingApt
      ? { ...common, duration_minutes: Number.parseInt(formData.duration_minutes, 10) || TYPE_DEFAULT_DURATIONS[formData.appointment_type] }
      : { ...common, kind: formData.kind, service_id: formData.kind === 'service' ? formData.service_id : null });
  };

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title={editingApt ? 'Edit Appointment' : 'Schedule Appointment'} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        {/* Step indicator — same "Back / Step X of 3" pattern as the public
            customer booking wizard, minus its Payment step (not applicable
            here — the owner isn't paying themselves for a walk-in). */}
        <div className="flex items-center justify-between pb-3 border-b border-line">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="text-sm font-medium text-ink-muted hover:text-ink transition-colors"
            >
              ← Back
            </button>
          ) : <span />}
          <span className="text-xs font-semibold text-ink-faint uppercase tracking-wider">Step {step} of 3</span>
        </div>

        {/* STEP 1: Customer & Appointment Type */}
        {step === 1 && (
        <div className="space-y-4">
        <CustomerPicker customers={customers} value={formData.customer_id} onChange={(id) => setFormData(prev => ({ ...prev, customer_id: id }))} onAdd={() => setShowAddCustomer(true)} />

        {/* Service or Shop, then the purpose. Fitting and pickup are made by the Production Order, never typed in. */}
        <WalkInKindFields
          form={formData}
          services={services}
          onChange={(patch) => setFormData(prev => {
            const next = { ...prev, ...patch };
            next.duration_minutes = String(TYPE_DEFAULT_DURATIONS[next.appointment_type]);
            return next;
          })}
        />
        </div>
        )}

        {/* STEP 2: Schedule */}
        {step === 2 && (
        <div className="space-y-4">
        {/* Duration is auto-calculated from the Appointment Type chosen in
            Step 1 (see TYPE_DEFAULT_DURATIONS) — no manual selector. */}
        {!editingApt && (
          <div className="grid grid-cols-2 gap-2">
            {([['now', 'Customer is here now'], ['later', 'Book a time']] as const).map(([v, text]) => (
              <button type="button" key={v}
                onClick={() => setFormData(prev => v === 'now'
                  ? { ...prev, when: 'now', scheduled_date: getLocalDateString(new Date()), scheduled_time: new Date().toTimeString().substring(0, 5) }
                  : { ...prev, when: 'later' })}
                className={`min-h-12 border text-sm font-semibold transition-colors ${formData.when === v ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink-muted hover:border-ink/40'}`}>
                {text}
              </button>
            ))}
          </div>
        )}
        <p className="text-xs text-ink-muted">
          {formData.when === 'now'
            ? 'For a customer standing at the shop right now. The visit starts at this minute, no date or time to pick.'
            : 'Pick a day and a free time. Use this when the customer will come later.'}
        </p>
        <p className="text-xs text-ink-muted -mt-1">
          Duration: <span className="font-semibold text-ink-body">{formData.duration_minutes} minutes</span> (auto-set for {TYPE_CONFIG[formData.appointment_type].label})
        </p>

        {/* No branch question: the visit is at the branch you are working in. */}

        {/* Date & Time — same interactive calendar the customer-facing
            booking page uses, so the owner sees the store's own existing
            appointments/operating hours instead of guessing at a blank date/time input. */}
        {formData.when === 'later' && (
        <div>
          <InteractiveCalendar
            selectedBranchId={formData.store_branch_id || null}
            durationMinutes={Number.parseInt(formData.duration_minutes, 10) || 60}
            operatingHours={store?.operating_hours ?? null}
            specialHours={store?.special_hours ?? null}
            appointments={calendarAppointments}
            loadingAppts={false}
            selectedDate={formData.scheduled_date}
            selectedTime={formData.scheduled_time}
            mode="walk_in"
            onDateChange={date => setFormData(prev => ({ ...prev, scheduled_date: date }))}
            onTimeChange={time => setFormData(prev => ({ ...prev, scheduled_time: time }))}
          />
        </div>
        )}
        </div>
        )}

        {/* STEP 3: Details & Confirmation — no payment step here; the owner
            isn't paying themselves for a walk-in, unlike the public booking
            page's own Step 3. Priority is no longer set at booking time —
            only the Store Owner sets it later, during Job Order approval. */}
        {step === 3 && (
        <div className="space-y-4">
        {/* Assign Staff */}
        {staff.length > 0 && (
          <div>
            <label htmlFor="assigned_staff_id" className="block text-sm font-medium text-ink-body mb-1">Assign Staff (Optional)</label>
            <select id="assigned_staff_id" value={formData.assigned_staff_id} onChange={e => setFormData({ ...formData, assigned_staff_id: e.target.value })}
              className="w-full bg-canvas border border-line rounded-lg px-4 py-2 text-ink focus:outline-none focus:border-taupe">
              <option value="">Unassigned</option>
              {staff.map(s => {
                const roles = [s.role, ...(s.additional_roles || [])].filter((r): r is string => Boolean(r)).map(roleLabel).join(', ');
                const name = s.user?.name || `Staff #${s.user_id}`;
                // Same reasoning as the Job Order staff dropdown — staff
                // pinned to a branch can only be assigned to that branch's
                // appointments, so surface it here instead of a rejection
                // after the fact.
                return (
                  <option key={s.user_id} value={s.user_id}>
                    {roles ? `[${roles}] ${name}` : name}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-ink-body mb-1">Notes (Optional)</label>
          <textarea id="notes" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
            rows={2} className="w-full bg-canvas border border-line rounded-lg px-4 py-2 text-ink focus:outline-none focus:border-taupe resize-none"
            placeholder="Any special notes or instructions..." />
        </div>
        </div>
        )}

        {/* Footer navigation — Next Step on 1 & 2, actual submit only on 3 */}
        <div className="pt-2 flex justify-end gap-3">
          {step === 1 && (
            <>
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-ink-body hover:bg-sunken transition-colors">Cancel</button>
              <button
                type="button"
                disabled={!step1Valid}
                onClick={() => setStep(2)}
                className="bg-taupe hover:bg-taupe/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Next Step →
              </button>
            </>
          )}
          {step === 2 && (
            <button
              type="button"
              disabled={!step2Valid}
              onClick={() => setStep(3)}
              className="bg-taupe hover:bg-taupe/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Next Step →
            </button>
          )}
          {step === 3 && (
            <button type="submit" disabled={isSubmitting} className="bg-taupe hover:bg-taupe/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              {editingApt ? 'Save Changes' : 'Save Appointment'}
            </button>
          )}
        </div>
      </form>
    </Modal>

    <CustomerFormModal
      isOpen={showAddCustomer}
      onClose={() => { setShowAddCustomer(false); setAddCustomerError(''); }}
      editingCustomer={null}
      onSubmit={handleAddCustomer}
      isSubmitting={addingCustomer}
      error={addCustomerError}
    />
    </>
  );
}
