import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Ruler } from 'lucide-react';
import Modal from '@/components/Modal';
import InteractiveCalendar from '@/components/shared/InteractiveCalendar';
import BookingTypeSelector from '@/components/booking/steps/schedule/BookingTypeSelector';
import type { BookingTypeOption } from '@/components/booking/types';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useBranch } from '@/context/BranchContext';
import CustomerPicker from './CustomerPicker';
import PurposeLabelField from './PurposeLabelField';
import { WizardBar, WizardProgress } from './VisitWizardChrome';
import { getCustomerInitials, type Appointment, type CustomerData } from './appointmentHelpers';

// A follow-up is a shop visit. Fitting and pickup are made by the Job Order, never typed in.
const TYPES: BookingTypeOption[] = [
  { value: 'consultation', label: 'Consultation', duration: 30, icon: React.createElement(MessageSquare, { size: 18 }), hint: 'Talk through a new order, changes, or what to do next.' },
  { value: 'measurement', label: 'Measurement', duration: 60, icon: React.createElement(Ruler, { size: 18 }), hint: 'Take, or take again, the customer’s measurements.' },
  { value: 'other', label: 'Other', duration: 30, icon: React.createElement(MessageSquare, { size: 18 }), hint: 'Something else. Say what it is for.' },
];
const OCCUPYING = new Set(['pending', 'confirmed', 'in_progress']);
const NOTES_MAX = 120;

interface FollowUpAppointmentModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly customers?: CustomerData[];
  readonly todayStr: string;
  readonly minTimeFor?: (dateStr: string) => string | undefined;
  // Pre-fills and locks the customer when opened from a Job Order's own page: the follow-up is already about that job.
  readonly presetCustomerId?: number;
  readonly presetJobOrderId?: number;
  readonly presetCustomerName?: string;
  readonly onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  readonly isSubmitting: boolean;
  readonly error: string;
}

const blank = { customer_id: '', type: 'consultation', purpose_label: '', date: '', time: '', notes: '' };

/**
 * The shop books a return visit with the same pickers a customer sees when booking: the purpose as choices, and the one
 * calendar that shows open days and free times (hours, closures and the visits already booked). Only what a follow-up
 * needs: customer, purpose, when, a note. The branch is the one that holds the customer's order (the server decides).
 */
export default function FollowUpAppointmentModal({
  isOpen, onClose, customers = [], todayStr, presetCustomerId, presetJobOrderId, presetCustomerName, onSubmit, isSubmitting, error,
}: FollowUpAppointmentModalProps) {
  const { store } = useAuthStore();
  const { selectedBranchId } = useBranch();
  const [form, setForm] = useState(blank);
  const [booked, setBooked] = useState<Appointment[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  // The branch this follow-up will be booked at (the server's rule), so the calendar shows that branch's free times.
  const [branchId, setBranchId] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1); // eslint-disable-line react-hooks/set-state-in-effect
    setForm({ ...blank, customer_id: presetCustomerId?.toString() || '', date: todayStr });
  }, [isOpen, presetCustomerId, todayStr]);

  // Free times depend on what is already booked, so ask for it whoever opened this (the job order page has no list of its own).
  useEffect(() => {
    if (!isOpen || !store?.id) return;
    let live = true;
    api.get(`/stores/${store.id}/appointments`).then((res) => { if (live) setBooked(res.data?.data ?? []); }).catch(() => { if (live) setBooked([]); });
    return () => { live = false; };
  }, [isOpen, store?.id]);

  useEffect(() => {
    const customerId = presetCustomerId?.toString() || form.customer_id;
    if (!isOpen || !store?.id || (!customerId && !presetJobOrderId)) return;
    let live = true;
    api.get(`/stores/${store.id}/appointments/follow-up-branch`, { params: { customer_id: customerId || undefined, job_order_id: presetJobOrderId || undefined } })
      .then((res) => { if (live) setBranchId(res.data?.data?.branch_id ?? null); })
      .catch(() => { if (live) setBranchId(null); });
    return () => { live = false; };
  }, [isOpen, store?.id, presetCustomerId, presetJobOrderId, form.customer_id]);

  const type = TYPES.find((t) => t.value === form.type) ?? TYPES[0];
  const slots = useMemo(
    () => booked.filter((a) => OCCUPYING.has(a.status)).map((a) => ({ scheduled_at: a.scheduled_at, duration_minutes: a.duration_minutes, store_branch_id: a.store_branch_id ?? null, status: a.status === 'pending' ? 'confirmed' : a.status })),
    [booked],
  );

  // Opened from a customer's appointment or order: the visit is for that customer, so there is nobody to choose.
  const locked = Boolean(presetCustomerId || presetJobOrderId);
  const who = Boolean(presetJobOrderId || form.customer_id);
  const detailsOk = who && (form.type !== 'other' || form.purpose_label.trim() !== '');
  const whenOk = !!form.date && !!form.time;
  const valid = detailsOk && whenOk;
  const customerName = presetCustomerName || customers.find((c) => String(c.id) === form.customer_id)?.name || 'The customer';

  const submit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (step !== 3 || !valid) return;
    void onSubmit({
      customer_id: form.customer_id || undefined,
      job_order_id: presetJobOrderId || undefined,
      appointment_type: form.type,
      purpose_label: form.type === 'other' ? form.purpose_label.trim() : undefined,
      scheduled_at: `${form.date} ${form.time}:00`,
      notes: form.notes.trim() || undefined,
    });
  };

  const footer = (
    <WizardBar
      step={step} formId="follow-up-form" submitting={isSubmitting} submitLabel="Schedule follow-up"
      nextLabel={step === 1 ? 'Continue' : 'Review & Confirm'} nextDisabled={step === 1 ? !detailsOk : step === 2 ? !whenOk : !valid}
      onNext={() => setStep((st) => (st === 1 ? 2 : 3))}
    />
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule follow-up visit" maxWidth="max-w-2xl" footer={footer} onBack={() => (step === 1 ? onClose() : setStep((st) => (st === 3 ? 2 : 1)))}>
      <form id="follow-up-form" onSubmit={submit} className="space-y-5">
        {error && <div role="alert" className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}
        <WizardProgress step={step} store={store?.name} />

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="mobile-h2 text-ink">Book a return visit</h2>
            {locked ? (
              <div className="flex items-center gap-3 rounded-xl border border-line bg-sunken p-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-semibold text-taupe">{getCustomerInitials(presetCustomerName)}</span>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-ink">{presetCustomerName || 'The customer'}</p>
                  <p className="text-xs text-ink-muted">Return visit. They are told as soon as it is booked.</p>
                </div>
              </div>
            ) : (
              <CustomerPicker customers={customers} value={form.customer_id} onChange={(id) => setForm({ ...form, customer_id: id })} />
            )}
            <div>
              <BookingTypeSelector availableBookingTypes={TYPES} appointmentType={form.type} onSelectType={(v) => setForm({ ...form, type: v })} title="What is this visit for?" />
              {form.type === 'other' && <PurposeLabelField value={form.purpose_label} onChange={(v) => setForm({ ...form, purpose_label: v })} />}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="mobile-h2 text-ink">Pick a time</h2>
            <div className="rounded-xl border border-line bg-surface p-4 shadow-xs sm:p-5">
              <InteractiveCalendar
                selectedBranchId={branchId ? String(branchId) : selectedBranchId ? String(selectedBranchId) : null}
                durationMinutes={type.duration}
                operatingHours={store?.operating_hours ?? null}
                specialHours={store?.special_hours ?? null}
                appointments={slots}
                mode="walk_in"
                selectedDate={form.date}
                selectedTime={form.time}
                onDateChange={(d) => setForm((f) => ({ ...f, date: d }))}
                onTimeChange={(t) => setForm((f) => ({ ...f, time: t }))}
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="fu_notes" className="mobile-caption block font-semibold text-ink-body">Notes <span className="font-normal text-ink-muted">(optional)</span></label>
                <span className={`mobile-caption ${form.notes.length >= NOTES_MAX ? 'font-semibold text-danger' : 'text-ink-faint'}`}>{form.notes.length} / {NOTES_MAX}</span>
              </div>
              <textarea
                id="fu_notes" rows={3} maxLength={NOTES_MAX} value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value.slice(0, NOTES_MAX) })}
                placeholder="e.g. Come back to take measurements"
                className="w-full resize-none rounded-xl border-2 border-line bg-white px-4 py-3 text-base leading-relaxed text-ink shadow-xs transition-colors hover:border-taupe/60 focus:border-taupe focus:outline-none focus:ring-2 focus:ring-taupe/10"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="mobile-h2 text-ink">Review</h2>
            <dl className="divide-y divide-line rounded-xl border border-line bg-surface text-sm shadow-xs">
              {[
                ['Customer', customerName],
                ['Visit', form.type === 'other' && form.purpose_label ? `Other — ${form.purpose_label}` : type.label],
                ['When', `${new Date(`${form.date}T${form.time}`).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · ${type.duration} min`],
                ...(form.notes.trim() ? [['Notes', form.notes.trim()]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 px-4 py-3">
                  <dt className="text-ink-muted">{k}</dt>
                  <dd className="text-right font-semibold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mobile-caption text-ink-muted">The customer is told right away. Nothing is paid.</p>
          </div>
        )}
      </form>
    </Modal>
  );
}
