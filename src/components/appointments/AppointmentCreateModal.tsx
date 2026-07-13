import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Loader2, UserPlus } from 'lucide-react';
import { useBranch } from '@/context/BranchContext';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Appointment, CustomerData, BranchData, StaffData, AppointmentType,
  APPOINTMENT_TYPES, TYPE_CONFIG, TYPE_DEFAULT_DURATIONS
} from './appointmentHelpers';
import { roleLabel } from '@/components/staff/staffHelpers';
import CustomerFormModal from '@/components/customers/CustomerFormModal';
import InteractiveCalendar from '@/components/shared/InteractiveCalendar';

interface AppointmentCreateModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly editingApt?: Appointment | null;
  readonly customers?: CustomerData[];
  readonly branches?: BranchData[];
  readonly staff?: StaffData[];
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
  customer_id: '', appointment_type: 'consultation' as AppointmentType,
  shop_branch_id: '', scheduled_date: '', scheduled_time: '',
  duration_minutes: String(TYPE_DEFAULT_DURATIONS.consultation), assigned_staff_id: '', notes: '',
};

export default function AppointmentCreateModal({
  isOpen, onClose, editingApt, customers = [], branches = [], staff = [], appointments = [], onSubmit, onCreateCustomer, isSubmitting, error
}: AppointmentCreateModalProps) {
  const [formData, setFormData] = useState(defaultForm);
  const { selectedBranchId } = useBranch();
  const { shop } = useAuthStore();

  // 3-step wizard — same shape as the public customer booking page, minus
  // the Payment step (the owner isn't paying themselves for a walk-in).
  const [step, setStep] = useState(1);

  // Exclude the appointment being edited from its own conflict check —
  // otherwise its already-booked slot would look occupied by itself.
  const calendarAppointments = appointments
    .filter(a => OCCUPYING_STATUSES.has(a.status) && a.id !== editingApt?.id)
    .map(a => ({ scheduled_at: a.scheduled_at, duration_minutes: a.duration_minutes, shop_branch_id: a.shop_branch_id ?? null }));

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
      setFormData({
        customer_id: custId,
        appointment_type: editingApt.appointment_type,
        shop_branch_id: editingApt.shop_branch_id?.toString() || '',
        scheduled_date: d.toISOString().split('T')[0],
        scheduled_time: d.toTimeString().substring(0, 5),
        duration_minutes: (editingApt.duration_minutes || TYPE_DEFAULT_DURATIONS[editingApt.appointment_type]).toString(),
        assigned_staff_id: editingApt.assigned_staff_id?.toString() || '',
        notes: editingApt.notes || '',
      });
    } else {
      const defaultBranchId = selectedBranchId?.toString() || '';
      setFormData({
        ...defaultForm,
        shop_branch_id: defaultBranchId || (branches.length === 1 ? branches[0].id.toString() : '')
      });
    }
  }, [editingApt, isOpen, customers, branches, selectedBranchId]);

  // Step 1 (Who & What) — just Customer + Type now; Service/Garment Category/
  // Job Order linking were removed (finalized later at Job Order creation, or
  // — for Fitting — auto-linked by the system when a job becomes Ready for
  // Fitting, see JobOrderController@update on the backend).
  const step1Valid = !!formData.customer_id && !!formData.appointment_type;

  const step2Valid = !!formData.scheduled_date && !!formData.scheduled_time
    && (branches.length <= 1 || !!formData.shop_branch_id);

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const payload = {
      customer_id: formData.customer_id,
      appointment_type: formData.appointment_type,
      scheduled_at: `${formData.scheduled_date} ${formData.scheduled_time}:00`,
      duration_minutes: Number.parseInt(formData.duration_minutes, 10) || TYPE_DEFAULT_DURATIONS[formData.appointment_type],
      notes: formData.notes || null,
      shop_branch_id: formData.shop_branch_id || null,
      assigned_staff_id: formData.assigned_staff_id || null,
    };
    onSubmit(payload);
  };

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title={editingApt ? 'Edit Appointment' : 'Schedule Appointment'} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        {/* Step indicator — same "Back / Step X of 3" pattern as the public
            customer booking wizard, minus its Payment step (not applicable
            here — the owner isn't paying themselves for a walk-in). */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EBE6E0]">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="text-sm font-medium text-[#827A73] hover:text-[#2D2A26] transition-colors"
            >
              ← Back
            </button>
          ) : <span />}
          <span className="text-xs font-semibold text-[#A8A19A] uppercase tracking-wider">Step {step} of 3</span>
        </div>

        {/* STEP 1: Customer & Appointment Type */}
        {step === 1 && (
        <div className="space-y-4">
        {/* Customer */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="customer_id" className="block text-sm font-medium text-[#524A44]">Customer <span className="text-rose-500">*</span></label>
            <button
              type="button"
              onClick={() => setShowAddCustomer(true)}
              className="flex items-center gap-1 text-xs font-semibold text-taupe hover:underline"
            >
              <UserPlus size={12} /> Add New Customer
            </button>
          </div>
          <select id="customer_id" required value={formData.customer_id} onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
            className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]">
            <option value="" disabled>Select a customer</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Appointment Type — reserves time for a consultation/measurement/
            fitting/alteration/pickup only. Service, Garment Category, and
            Job Order linking are finalized later during Job Order creation
            (or, for Fitting, auto-linked by the system) — not captured here. */}
        <div>
          <span className="block text-sm font-medium text-[#524A44] mb-1">Appointment Type <span className="text-rose-500">*</span></span>
          <div className="grid grid-cols-5 gap-2">
            {APPOINTMENT_TYPES.map(t => {
              const tc = TYPE_CONFIG[t];
              return (
                <button
                  type="button" key={t}
                  onClick={() => setFormData({
                    ...formData,
                    appointment_type: t,
                    // Duration auto-calculates from the appointment type —
                    // there's no manual Duration selector anymore.
                    duration_minutes: String(TYPE_DEFAULT_DURATIONS[t]),
                  })}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-[10px] font-semibold transition-all ${
                    formData.appointment_type === t
                      ? `${tc.bg} ${tc.border} ${tc.text} ring-2 ring-offset-1 ${tc.border.replace('border-', 'ring-')}`
                      : 'bg-white border-[#EBE6E0] text-[#827A73] hover:border-[#9A8073]/40'
                  }`}
                >
                  {tc.icon}
                  {tc.label}
                </button>
              );
            })}
          </div>
        </div>
        </div>
        )}

        {/* STEP 2: Schedule */}
        {step === 2 && (
        <div className="space-y-4">
        {/* Duration is auto-calculated from the Appointment Type chosen in
            Step 1 (see TYPE_DEFAULT_DURATIONS) — no manual selector. */}
        <p className="text-xs text-[#827A73] -mt-1">
          Duration: <span className="font-semibold text-[#524A44]">{formData.duration_minutes} minutes</span> (auto-set for {TYPE_CONFIG[formData.appointment_type].label})
        </p>

        {/* Branch (multi-branch only) — set before the calendar so slots are
            already filtered to this branch's own existing bookings. */}
        {branches.length > 1 && (
          <div>
            <label htmlFor="shop_branch_id" className="block text-sm font-medium text-[#524A44] mb-1">Branch <span className="text-rose-500">*</span></label>
            <select id="shop_branch_id" required value={formData.shop_branch_id} onChange={e => setFormData({ ...formData, shop_branch_id: e.target.value })}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]">
              <option value="" disabled>Select branch...</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}

        {/* Date & Time — same interactive calendar the customer-facing
            booking page uses, so the owner sees the shop's own existing
            appointments/operating hours instead of guessing at a blank date/time input. */}
        <div>
          <InteractiveCalendar
            selectedBranchId={formData.shop_branch_id || null}
            durationMinutes={Number.parseInt(formData.duration_minutes, 10) || 60}
            operatingHours={shop?.operating_hours ?? null}
            specialHours={shop?.special_hours ?? null}
            appointments={calendarAppointments}
            loadingAppts={false}
            selectedDate={formData.scheduled_date}
            selectedTime={formData.scheduled_time}
            onDateChange={date => setFormData(prev => ({ ...prev, scheduled_date: date }))}
            onTimeChange={time => setFormData(prev => ({ ...prev, scheduled_time: time }))}
          />
        </div>
        </div>
        )}

        {/* STEP 3: Details & Confirmation — no payment step here; the owner
            isn't paying themselves for a walk-in, unlike the public booking
            page's own Step 3. Priority is no longer set at booking time —
            only the Shop Owner sets it later, during Job Order approval. */}
        {step === 3 && (
        <div className="space-y-4">
        {/* Assign Staff */}
        {staff.length > 0 && (
          <div>
            <label htmlFor="assigned_staff_id" className="block text-sm font-medium text-[#524A44] mb-1">Assign Staff (Optional)</label>
            <select id="assigned_staff_id" value={formData.assigned_staff_id} onChange={e => setFormData({ ...formData, assigned_staff_id: e.target.value })}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]">
              <option value="">Unassigned</option>
              {staff.map(s => {
                const roles = [s.role, ...(s.additional_roles || [])].filter((r): r is string => Boolean(r)).map(roleLabel).join(', ');
                const name = s.user?.name || `Staff #${s.user_id}`;
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
          <label htmlFor="notes" className="block text-sm font-medium text-[#524A44] mb-1">Notes (Optional)</label>
          <textarea id="notes" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
            rows={2} className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073] resize-none"
            placeholder="Any special notes or instructions..." />
        </div>
        </div>
        )}

        {/* Footer navigation — Next Step on 1 & 2, actual submit only on 3 */}
        <div className="pt-2 flex justify-end gap-3">
          {step === 1 && (
            <>
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:bg-[#F0EAE3] transition-colors">Cancel</button>
              <button
                type="button"
                disabled={!step1Valid}
                onClick={() => setStep(2)}
                className="bg-[#9A8073] hover:bg-[#9A8073]/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
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
              className="bg-[#9A8073] hover:bg-[#9A8073]/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Next Step →
            </button>
          )}
          {step === 3 && (
            <button type="submit" disabled={isSubmitting} className="bg-[#9A8073] hover:bg-[#9A8073]/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
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
