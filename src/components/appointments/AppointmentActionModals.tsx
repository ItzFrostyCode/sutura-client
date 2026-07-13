import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Loader2, RefreshCw, CheckSquare, X, Check, Scissors, Ruler } from 'lucide-react';
import {
  Appointment, JobOrderData,
  TypeBadge, StatusBadge
} from './appointmentHelpers';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

interface AppointmentActionModalsProps {
  // Modal visibility & active records
  readonly showReviewModal: boolean;
  readonly setShowReviewModal: (v: boolean) => void;
  readonly reviewApt: Appointment | null;
  readonly setReviewApt: (a: Appointment | null) => void;

  readonly showRescheduleModal: boolean;
  readonly setShowRescheduleModal: (v: boolean) => void;
  readonly rescheduleApt: Appointment | null;
  readonly setRescheduleApt: (a: Appointment | null) => void;

  readonly showCompleteModal: boolean;
  readonly setShowCompleteModal: (v: boolean) => void;
  readonly completeApt: Appointment | null;
  readonly setCompleteApt: (a: Appointment | null) => void;

  readonly showCancelModal: boolean;
  readonly setShowCancelModal: (v: boolean) => void;
  readonly cancelApt: Appointment | null;
  readonly setCancelApt: (a: Appointment | null) => void;

  readonly showViewModal: boolean;
  readonly setShowViewModal: (v: boolean) => void;
  readonly viewApt: Appointment | null;
  readonly setViewApt: (a: Appointment | null) => void;

  // Reference Data & Statuses
  readonly todayStr: string;
  readonly minTimeFor: (dateStr: string) => string;
  readonly isSubmitting: boolean;
  readonly actionLoadingId: number | null;

  // Async triggers
  readonly onConfirmReview: (aptId: number) => Promise<boolean>;
  readonly onRejectReview: (aptId: number) => Promise<boolean>;
  readonly onRescheduleSubmit: (aptId: number, date: string, time: string, notes: string) => Promise<void>;
  readonly onCompleteSubmit: (aptId: number, notes: string, jobOrderId: string, measurementAction: 'none' | 'record', outcome: string) => Promise<void>;
  readonly onCancelConfirm: (aptId: number) => Promise<void>;
  readonly onCreateJob: (apt: Appointment) => void;
}

export default function AppointmentActionModals({
  showReviewModal, setShowReviewModal, reviewApt, setReviewApt,
  showRescheduleModal, setShowRescheduleModal, rescheduleApt, setRescheduleApt,
  showCompleteModal, setShowCompleteModal, completeApt, setCompleteApt,
  showCancelModal, setShowCancelModal, cancelApt, setCancelApt,
  showViewModal, setShowViewModal, viewApt, setViewApt,
  todayStr, minTimeFor,
  isSubmitting, actionLoadingId,
  onConfirmReview, onRejectReview, onRescheduleSubmit, onCompleteSubmit, onCancelConfirm, onCreateJob
}: AppointmentActionModalsProps) {

  const { shop } = useAuthStore();

  // Local Form States
  const [rescheduleForm, setRescheduleForm] = useState({ scheduled_date: '', scheduled_time: '', notes: '' });
  const [completeForm, setCompleteForm] = useState<{ notes: string; job_order_id: string; measurement_action: 'none' | 'record'; outcome: string }>({
    notes: '', job_order_id: '', measurement_action: 'none', outcome: 'completed'
  });

  // Fitting/Pickup completion needs to link a job order, but the `jobOrders`
  // prop is just whatever page of the shop-wide list happens to be loaded
  // elsewhere (often only the 15 most recent) — not reliable for an older
  // order or a customer whose orders have scrolled off that page. Fetch this
  // customer's own job orders directly, scoped by customer_id, every time
  // the Complete modal opens for one of these two types.
  const [completionJobOrders, setCompletionJobOrders] = useState<JobOrderData[]>([]);
  const [loadingCompletionJobs, setLoadingCompletionJobs] = useState(false);

  // Sync Reschedule Form defaults when modal opens
  useEffect(() => {
    if (rescheduleApt) {
      const d = new Date(rescheduleApt.scheduled_at);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRescheduleForm({
        scheduled_date: d.toISOString().split('T')[0],
        scheduled_time: d.toTimeString().substring(0, 5),
        notes: rescheduleApt.notes || '',
      });
    }
  }, [rescheduleApt]);

  // Sync Complete Form defaults when modal opens
  useEffect(() => {
    if (completeApt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCompleteForm({ notes: '', job_order_id: '', measurement_action: 'none', outcome: 'completed' });
    }
  }, [completeApt]);

  // Fetch this specific customer's job orders when the Complete modal opens
  // for a Fitting or Pickup appointment — see completionJobOrders comment above.
  useEffect(() => {
    const customerId = completeApt?.customer?.id;
    const needsJobOrder = completeApt?.appointment_type === 'fitting' || completeApt?.appointment_type === 'pickup';
    if (!shop || !customerId || !needsJobOrder) {
      setCompletionJobOrders([]);
      return;
    }
    setLoadingCompletionJobs(true);
    api.get(`/shops/${shop.id}/jobs`, { params: { customer_id: customerId, per_page: 100 } })
      .then(res => setCompletionJobOrders(res.data?.data?.data || res.data?.data || []))
      .catch(() => setCompletionJobOrders([]))
      .finally(() => setLoadingCompletionJobs(false));
  }, [completeApt, shop]);

  const handleReschedule = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!rescheduleApt) return;
    onRescheduleSubmit(
      rescheduleApt.id,
      rescheduleForm.scheduled_date,
      rescheduleForm.scheduled_time,
      rescheduleForm.notes
    );
  };

  const handleComplete = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!completeApt) return;
    onCompleteSubmit(
      completeApt.id,
      completeForm.notes,
      completeForm.job_order_id,
      completeForm.measurement_action,
      completeForm.outcome
    );
  };

  return (
    <>
      {/* ── 1. Owner Review Modal ───────────────────────────────────────────── */}
      <Modal isOpen={showReviewModal} onClose={() => { setShowReviewModal(false); setReviewApt(null); }} title="Review Appointment">
        {reviewApt && (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#2D2A26]">{reviewApt.customer?.name}</h3>
                <p className="text-xs text-[#A8A19A]">{reviewApt.customer?.email}</p>
              </div>
              <StatusBadge status={reviewApt.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[11px] text-[#A8A19A] font-semibold uppercase tracking-wider">Type</p>
                <div className="mt-1"><TypeBadge type={reviewApt.appointment_type} /></div>
              </div>
              <div>
                <p className="text-[11px] text-[#A8A19A] font-semibold uppercase tracking-wider">Service</p>
                <p className="text-[#2D2A26] font-medium mt-1">{reviewApt.service?.name || <span className="italic text-[#A8A19A]">None</span>}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#A8A19A] font-semibold uppercase tracking-wider">Scheduled</p>
                <p className="text-[#2D2A26] font-medium mt-1">
                  {new Date(reviewApt.scheduled_at).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
                  {' at '}
                  {new Date(reviewApt.scheduled_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#A8A19A] font-semibold uppercase tracking-wider">Duration</p>
                <p className="text-[#2D2A26] font-medium mt-1">{reviewApt.duration_minutes ?? 60} minutes</p>
              </div>
              <div>
                <p className="text-[11px] text-[#A8A19A] font-semibold uppercase tracking-wider">Branch</p>
                <p className="text-[#2D2A26] font-medium mt-1">{reviewApt.branch?.name || 'Main Branch'}</p>
              </div>
              {reviewApt.assigned_staff && (
                <div>
                  <p className="text-[11px] text-[#A8A19A] font-semibold uppercase tracking-wider">Assigned Staff</p>
                  <p className="text-[#2D2A26] font-medium mt-1">{reviewApt.assigned_staff.name}</p>
                </div>
              )}
              {reviewApt.job_order && (
                <div>
                  <p className="text-[11px] text-[#A8A19A] font-semibold uppercase tracking-wider">Linked Job Order</p>
                  <p className="text-[#2D2A26] font-medium mt-1">
                    <a href={`/dashboard/jobs/${reviewApt.job_order.id}`} className="text-[#6B7FA8] hover:underline" target="_blank" rel="noopener noreferrer">
                      #{reviewApt.job_order.order_number || reviewApt.job_order.id}
                    </a>
                  </p>
                </div>
              )}
            </div>

            {reviewApt.notes && (
              <div>
                <p className="text-[11px] text-[#A8A19A] font-semibold uppercase tracking-wider mb-1">Notes from Customer</p>
                <div className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg p-3 text-sm text-[#2D2A26] whitespace-pre-wrap">{reviewApt.notes}</div>
              </div>
            )}

            {reviewApt.answers && Object.keys(reviewApt.answers).length > 0 && (
              <div>
                <p className="text-[11px] text-[#A8A19A] font-semibold uppercase tracking-wider mb-2">Booking Answers</p>
                <div className="space-y-2">
                  {Object.entries(reviewApt.answers).map(([q, a]) => (
                    <div key={q} className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg p-2.5">
                       <p className="text-xs font-semibold text-[#827A73]">{q}</p>
                       <p className="text-xs text-[#2D2A26] mt-0.5">{String(a)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2 border-t border-[#EBE6E0]">
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowRescheduleModal(true); setRescheduleApt(reviewApt); setShowReviewModal(false); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-[#6B7FA8] hover:bg-[#6B7FA8]/10 border border-[#6B7FA8]/20 transition-colors"
                >
                  <RefreshCw size={14} /> Propose New Time
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await onRejectReview(reviewApt.id);
                    if (ok) { setShowReviewModal(false); setReviewApt(null); }
                  }}
                  disabled={actionLoadingId === reviewApt.id}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                >
                  {actionLoadingId === reviewApt.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />} Reject
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    // Only close on success — a rejection (e.g. a double-
                    // booking conflict) needs to stay visible here so the
                    // owner can immediately react (e.g. Propose New Time)
                    // instead of it silently vanishing.
                    const ok = await onConfirmReview(reviewApt.id);
                    if (ok) { setShowReviewModal(false); setReviewApt(null); }
                  }}
                  disabled={actionLoadingId === reviewApt.id}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#7A8B76] hover:bg-[#7A8B76]/90 transition-colors"
                >
                  {actionLoadingId === reviewApt.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── 2. Reschedule Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={showRescheduleModal} onClose={() => { setShowRescheduleModal(false); setRescheduleApt(null); }} title="Propose New Schedule">
        <form onSubmit={handleReschedule} className="space-y-4">
          <p className="text-sm text-[#827A73]">Propose a new date and time. The customer will be notified of the change.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="reschedule_date" className="block text-sm font-medium text-[#524A44] mb-1">New Date</label>
              <input id="reschedule_date" type="date" required min={todayStr} value={rescheduleForm.scheduled_date}
                onChange={e => setRescheduleForm(f => ({ ...f, scheduled_date: e.target.value }))}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]" />
            </div>
            <div>
              <label htmlFor="reschedule_time" className="block text-sm font-medium text-[#524A44] mb-1">New Time</label>
              <input id="reschedule_time" type="time" required min={minTimeFor(rescheduleForm.scheduled_date)} value={rescheduleForm.scheduled_time}
                onChange={e => setRescheduleForm(f => ({ ...f, scheduled_time: e.target.value }))}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]" />
            </div>
          </div>
          <div>
            <label htmlFor="reschedule_notes" className="block text-sm font-medium text-[#524A44] mb-1">Note to Customer (Optional)</label>
            <textarea id="reschedule_notes" rows={2} value={rescheduleForm.notes} onChange={e => setRescheduleForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073] resize-none"
              placeholder="e.g. Unavailable on original date, please come on the new date..." />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setShowRescheduleModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:bg-[#F0EAE3] transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="bg-[#6B7FA8] hover:bg-[#6B7FA8]/90 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              <RefreshCw size={14} /> Confirm Reschedule
            </button>
          </div>
        </form>
      </Modal>

      {/* ── 3. Complete Appointment Modal ────────────────────────────────────── */}
      <Modal isOpen={showCompleteModal} onClose={() => { setShowCompleteModal(false); setCompleteApt(null); }} title="Complete Appointment">
        {completeApt && (
          <form onSubmit={handleComplete} className="space-y-4">
            <div className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[#2D2A26]">{completeApt.customer?.name}</p>
                <TypeBadge type={completeApt.appointment_type} />
              </div>
              {completeApt.service && <p className="text-sm text-[#827A73]">{completeApt.service.name}</p>}
              <p className="text-xs text-[#A8A19A]">
                {new Date(completeApt.scheduled_at).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
                {' · '}{completeApt.duration_minutes ?? 60} min
              </p>
            </div>

            {/* Type-specific fields */}
            {completeApt.appointment_type === 'measurement' && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-1.5"><Ruler size={14} /> Measurement Session</p>
                <p className="text-xs text-blue-600 mb-3">After completing, would you like to record the customer&apos;s measurements?</p>
                <div className="flex gap-2">
                  {(['none', 'record'] as const).map(opt => (
                    <button type="button" key={opt}
                      onClick={() => setCompleteForm(f => ({ ...f, measurement_action: opt }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${completeForm.measurement_action === opt ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'}`}>
                      {opt === 'record' ? '衡量 Record Measurements' : 'Skip for Now'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {completeApt.appointment_type === 'fitting' && (
              <div>
                <label htmlFor="complete_job_order_id" className="block text-sm font-medium text-[#524A44] mb-1">Link to Job Order <span className="text-rose-500">*</span></label>
                <p className="text-xs text-[#827A73] mb-2">Fitting sessions must be linked to an existing job order.</p>
                <select id="complete_job_order_id" required disabled={loadingCompletionJobs} value={completeForm.job_order_id}
                  onChange={e => setCompleteForm(f => ({ ...f, job_order_id: e.target.value }))}
                  className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073] disabled:opacity-60">
                  <option value="" disabled>{loadingCompletionJobs ? 'Loading job orders...' : 'Select job order...'}</option>
                  {completionJobOrders
                    .filter(j => !['completed', 'cancelled'].includes(j.status || ''))
                    .map(j => <option key={j.id} value={j.id}>#{j.id} — {j.title || j.status}</option>)}
                </select>
              </div>
            )}

            {completeApt.appointment_type === 'pickup' && (
              <div>
                <label htmlFor="pickup_job_order_id" className="block text-sm font-medium text-[#524A44] mb-1">Linked Job Order <span className="text-rose-500">*</span></label>
                <select id="pickup_job_order_id" required disabled={loadingCompletionJobs} value={completeForm.job_order_id}
                  onChange={e => setCompleteForm(f => ({ ...f, job_order_id: e.target.value }))}
                  className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073] disabled:opacity-60">
                  <option value="" disabled>{loadingCompletionJobs ? 'Loading job orders...' : 'Select the job order being picked up...'}</option>
                  {completionJobOrders
                    .filter(j => j.status === 'ready_for_pickup')
                    .map(j => <option key={j.id} value={j.id}>#{j.id} — {j.title || j.status}</option>)}
                </select>
              </div>
            )}

            {/* Create job shortcut for consultation/alteration */}
            {['consultation', 'alteration'].includes(completeApt.appointment_type) && (
              <div className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#2D2A26]">Create a Job Order?</p>
                  <p className="text-xs text-[#827A73]">Optionally start a job order from this appointment.</p>
                </div>
                <button type="button" onClick={() => onCreateJob(completeApt)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#9A8073]/10 text-[#9A8073] hover:bg-[#FAF6F3] border border-[#9A8073]/20 transition-colors">
                  <Scissors size={12} /> Create Job
                </button>
              </div>
            )}

            {/* Appointment Outcome Selector */}
            <div>
              <label htmlFor="complete_outcome" className="block text-sm font-medium text-[#524A44] mb-1">Appointment Outcome</label>
              <select
                id="complete_outcome"
                required
                value={completeForm.outcome}
                onChange={e => setCompleteForm(f => ({ ...f, outcome: e.target.value }))}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]">
                <option value="completed">Completed Successfully</option>
                <option value="rescheduled">Rescheduled to Future Date</option>
                <option value="no_show">No Show / Client Didn't Arrive</option>
                <option value="converted_to_job">Converted to New Job Order</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Completion notes */}
            <div>
              <label htmlFor="complete_notes" className="block text-sm font-medium text-[#524A44] mb-1">Completion Notes (Optional)</label>
              <textarea id="complete_notes" rows={2} value={completeForm.notes} onChange={e => setCompleteForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073] resize-none"
                placeholder="Any notes from the session..." />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCompleteModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:bg-[#F0EAE3] transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                <CheckSquare size={14} /> Mark as Completed
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── 4. Cancel Confirmation Modal ────────────────────────────────────── */}
      <Modal isOpen={showCancelModal} onClose={() => { setShowCancelModal(false); setCancelApt(null); }} title="Cancel Appointment">
        <div className="space-y-4">
          <p className="text-sm text-[#524A44]">
            Are you sure you want to cancel the appointment for <strong>{cancelApt?.customer?.name}</strong>? The customer will be notified.
          </p>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setShowCancelModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:bg-[#F0EAE3] transition-colors">Keep Appointment</button>
            <button type="button" onClick={() => cancelApt && onCancelConfirm(cancelApt.id)} disabled={isSubmitting} className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
              {isSubmitting && <Loader2 size={15} className="animate-spin" />} Yes, Cancel It
            </button>
          </div>
        </div>
      </Modal>

      {/* ── 5. View Details Modal ────────────────────────────────────────────── */}
      <Modal isOpen={showViewModal} onClose={() => { setShowViewModal(false); setViewApt(null); }} title="Appointment Details">
        {viewApt && (
          <div className="space-y-4 text-sm text-[#524A44]">
            <div className="flex items-start justify-between border-b border-[#EBE6E0] pb-3">
              <div>
                <h4 className="font-bold text-[#2D2A26] text-base">{viewApt.customer?.name}</h4>
                <p className="text-xs text-[#A8A19A]">{viewApt.customer?.email}</p>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <TypeBadge type={viewApt.appointment_type} />
                <StatusBadge status={viewApt.status} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#A8A19A] font-semibold uppercase tracking-wider">Scheduled At</p>
                <p className="text-[#2D2A26] font-medium mt-0.5">
                  {new Date(viewApt.scheduled_at).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
                  {' at '}
                  {new Date(viewApt.scheduled_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#A8A19A] font-semibold uppercase tracking-wider">Duration</p>
                <p className="text-[#2D2A26] font-medium mt-0.5">{viewApt.duration_minutes ?? 60} minutes</p>
              </div>
              <div>
                <p className="text-xs text-[#A8A19A] font-semibold uppercase tracking-wider">Service</p>
                <p className="text-[#2D2A26] font-medium mt-0.5">{viewApt.service?.name || <span className="italic text-[#A8A19A]">Consultation</span>}</p>
              </div>
              <div>
                <p className="text-xs text-[#A8A19A] font-semibold uppercase tracking-wider">Branch</p>
                <p className="text-[#2D2A26] font-medium mt-0.5">{viewApt.branch?.name || 'Main Branch'}</p>
              </div>
              {viewApt.assigned_staff && (
                <div>
                  <p className="text-xs text-[#A8A19A] font-semibold uppercase tracking-wider">Assigned Staff</p>
                  <p className="text-[#2D2A26] font-medium mt-0.5">{viewApt.assigned_staff.name}</p>
                </div>
              )}
              {viewApt.job_order && (
                <div>
                  <p className="text-[11px] text-[#A8A19A] font-semibold uppercase tracking-wider">Linked Job Order</p>
                  <p className="text-[#2D2A26] font-medium mt-1">
                    <a href={`/dashboard/jobs/${viewApt.job_order.id}`} className="text-[#6B7FA8] hover:underline" target="_blank" rel="noopener noreferrer">
                      #{viewApt.job_order.order_number || viewApt.job_order.id}
                    </a>
                  </p>
                </div>
              )}
              {viewApt.priority && (
                <div>
                  <p className="text-xs text-[#A8A19A] font-semibold uppercase tracking-wider">Priority</p>
                  <p className={`font-bold mt-0.5 capitalize text-xs ${
                    viewApt.priority === 'rush' ? 'text-rose-600' : viewApt.priority === 'urgent' ? 'text-amber-600' : 'text-zinc-600'
                  }`}>
                    {viewApt.priority}
                  </p>
                </div>
              )}
              {viewApt.garment_category && (
                <div>
                  <p className="text-xs text-[#A8A19A] font-semibold uppercase tracking-wider">Garment Category</p>
                  <p className="text-[#2D2A26] font-semibold mt-0.5 capitalize">{viewApt.garment_category}</p>
                </div>
              )}
              {viewApt.outcome && (
                <div className="col-span-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl p-3">
                  <p className="text-[10px] text-[#A8A19A] font-bold uppercase tracking-wider">Appointment Outcome</p>
                  <p className="text-emerald-700 font-bold mt-0.5 text-xs capitalize flex items-center gap-1">
                    <Check size={12} /> {viewApt.outcome.replace(/_/g, ' ')}
                  </p>
                </div>
              )}
            </div>

            {viewApt.notes && (
              <div>
                <p className="text-xs text-[#A8A19A] font-semibold uppercase tracking-wider">Notes</p>
                <div className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg p-3 text-xs mt-1 whitespace-pre-wrap text-[#2D2A26]">{viewApt.notes}</div>
              </div>
            )}

            {viewApt.reference_images && viewApt.reference_images.length > 0 && (
              <div>
                <p className="text-xs text-[#A8A19A] font-semibold uppercase tracking-wider mb-2">Design Reference Images</p>
                <div className="grid grid-cols-4 gap-2">
                  {viewApt.reference_images.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-lg overflow-hidden border border-[#EBE6E0] bg-zinc-100 hover:opacity-80 transition-opacity">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Reference" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {viewApt.reference_link && (
              <div>
                <p className="text-xs text-[#A8A19A] font-semibold uppercase tracking-wider">Reference Link</p>
                <a href={viewApt.reference_link} target="_blank" rel="noopener noreferrer" className="text-[#6B7FA8] hover:underline text-xs break-all">
                  {viewApt.reference_link}
                </a>
              </div>
            )}

            {viewApt.answers && Object.keys(viewApt.answers).length > 0 && (
              <div className="border-t border-[#EBE6E0] pt-3">
                <p className="text-xs text-[#A8A19A] font-semibold uppercase tracking-wider mb-2">Booking Answers</p>
                <div className="space-y-2">
                  {Object.entries(viewApt.answers).map(([q, a]) => (
                    <div key={q} className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg p-2.5">
                      <p className="text-xs font-semibold text-[#827A73]">{q}</p>
                      <p className="text-xs text-[#2D2A26] mt-0.5">{String(a)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-[#EBE6E0] flex justify-end">
              <button type="button" onClick={() => setShowViewModal(false)} className="bg-[#9A8073] hover:bg-[#9A8073]/90 text-white px-5 py-2 rounded-lg text-xs font-medium transition-colors">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
