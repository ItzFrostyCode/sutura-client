import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Loader2, CalendarPlus } from 'lucide-react';
import {
  CustomerData, BranchData, AppointmentType,
  APPOINTMENT_TYPES, TYPE_CONFIG, TYPE_DEFAULT_DURATIONS
} from './appointmentHelpers';

interface FollowUpAppointmentModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly customers?: CustomerData[];
  readonly branches?: BranchData[];
  readonly todayStr: string;
  readonly minTimeFor: (dateStr: string) => string | undefined;
  // Pre-fills and locks the customer when opened from a Job Order's own
  // page — the follow-up is already known to be about that job.
  readonly presetCustomerId?: number;
  readonly presetJobOrderId?: number;
  readonly presetCustomerName?: string;
  readonly onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  readonly isSubmitting: boolean;
  readonly error: string;
}

const defaultForm = {
  customer_id: '', appointment_type: 'fitting' as AppointmentType,
  store_branch_id: '', scheduled_date: '', scheduled_time: '', notes: '',
};

/**
 * Staff's narrow, purpose-built way to book a return visit — date/time/
 * purpose/notes/job_order_id only. Deliberately NOT the full owner/manager
 * AppointmentCreateModal (no payment_method/answers/priority/staff
 * assignment fields) — see docs/STAFF-WORKFLOW.md §17,
 * docs/CUSTOMER-WORKFLOW.md §7.4, and the backend's
 * StoreFollowUpAppointmentRequest/AppointmentController::createFollowUp.
 */
export default function FollowUpAppointmentModal({
  isOpen, onClose, customers = [], branches = [], todayStr, minTimeFor,
  presetCustomerId, presetJobOrderId, presetCustomerName,
  onSubmit, isSubmitting, error,
}: FollowUpAppointmentModalProps) {
  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData({
      ...defaultForm,
      customer_id: presetCustomerId?.toString() || '',
      scheduled_date: todayStr,
      store_branch_id: branches.length === 1 ? branches[0].id.toString() : '',
    });
  }, [isOpen, presetCustomerId, todayStr, branches]);

  const isValid = (presetJobOrderId || !!formData.customer_id)
    && !!formData.appointment_type && !!formData.scheduled_date && !!formData.scheduled_time
    && (branches.length <= 1 || !!formData.store_branch_id);

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onSubmit({
      customer_id: formData.customer_id || undefined,
      job_order_id: presetJobOrderId || undefined,
      appointment_type: formData.appointment_type,
      scheduled_at: `${formData.scheduled_date} ${formData.scheduled_time}:00`,
      duration_minutes: TYPE_DEFAULT_DURATIONS[formData.appointment_type],
      store_branch_id: formData.store_branch_id || undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Follow-Up Visit" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <p className="text-sm text-ink-muted">
          {presetCustomerName
            ? <>Book a return visit for <span className="font-semibold text-ink">{presetCustomerName}</span>. They&apos;ll be notified automatically.</>
            : 'Book a return visit — fitting, adjustment, consultation, or pickup coordination. The customer will be notified automatically.'}
        </p>

        {!presetJobOrderId && (
          <div>
            <label htmlFor="fu_customer_id" className="block text-sm font-medium text-ink-body mb-1">Customer <span className="text-rose-500">*</span></label>
            <select id="fu_customer_id" required value={formData.customer_id} onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
              className="w-full bg-canvas border border-line rounded-lg px-4 py-2 text-ink focus:outline-none focus:border-taupe">
              <option value="" disabled>Select a customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ''}</option>)}
            </select>
          </div>
        )}

        <div>
          <span className="block text-sm font-medium text-ink-body mb-1">What&apos;s this visit for? <span className="text-rose-500">*</span></span>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {APPOINTMENT_TYPES.map(t => {
              const tc = TYPE_CONFIG[t];
              return (
                <button
                  type="button" key={t}
                  onClick={() => setFormData({ ...formData, appointment_type: t })}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-[10px] font-semibold transition-all ${
                    formData.appointment_type === t
                      ? `${tc.bg} ${tc.border} ${tc.text} ring-2 ring-offset-1 ${tc.border.replace('border-', 'ring-')}`
                      : 'bg-white border-line text-ink-muted hover:border-taupe/40'
                  }`}
                >
                  {tc.icon}
                  {tc.label}
                </button>
              );
            })}
          </div>
        </div>

        {branches.length > 1 && (
          <div>
            <label htmlFor="fu_branch" className="block text-sm font-medium text-ink-body mb-1">Branch <span className="text-rose-500">*</span></label>
            <select id="fu_branch" required value={formData.store_branch_id} onChange={e => setFormData({ ...formData, store_branch_id: e.target.value })}
              className="w-full bg-canvas border border-line rounded-lg px-4 py-2 text-ink focus:outline-none focus:border-taupe">
              <option value="" disabled>Select branch...</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="fu_date" className="block text-sm font-medium text-ink-body mb-1">Date <span className="text-rose-500">*</span></label>
            <input id="fu_date" type="date" required min={todayStr} value={formData.scheduled_date}
              onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })}
              className="w-full bg-canvas border border-line rounded-lg px-4 py-2 text-ink focus:outline-none focus:border-taupe" />
          </div>
          <div>
            <label htmlFor="fu_time" className="block text-sm font-medium text-ink-body mb-1">Time <span className="text-rose-500">*</span></label>
            <input id="fu_time" type="time" required min={minTimeFor(formData.scheduled_date)} value={formData.scheduled_time}
              onChange={e => setFormData({ ...formData, scheduled_time: e.target.value })}
              className="w-full bg-canvas border border-line rounded-lg px-4 py-2 text-ink focus:outline-none focus:border-taupe" />
          </div>
        </div>

        <div>
          <label htmlFor="fu_notes" className="block text-sm font-medium text-ink-body mb-1">Notes (Optional)</label>
          <textarea id="fu_notes" rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
            className="w-full bg-canvas border border-line rounded-lg px-4 py-2 text-ink focus:outline-none focus:border-taupe resize-none"
            placeholder="e.g. Balik po kayo para sa fitting..." />
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-ink-body hover:bg-sunken transition-colors">Cancel</button>
          <button type="submit" disabled={!isValid || isSubmitting} className="bg-taupe hover:bg-taupe-hover text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-colors">
            {isSubmitting && <Loader2 size={15} className="animate-spin" />}
            <CalendarPlus size={14} /> Schedule Follow-Up
          </button>
        </div>
      </form>
    </Modal>
  );
}
