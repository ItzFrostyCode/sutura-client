import { safeHref } from '@/lib/safeHref';
import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Loader2, RefreshCw, CheckSquare, X, Check, Scissors, Ruler } from 'lucide-react';
import {
  Appointment, JobOrderData, StaffData,
  TypeBadge, StatusBadge, CheckInBadge, getLocalDateString
} from './appointmentHelpers';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { serviceCategoryPath } from '@/lib/canonicalTaxonomy';
import AppointmentSubject from './AppointmentSubject';
import AppointmentCustomerToolkit from './AppointmentCustomerToolkit';
import RejectAppointmentDialog from './RejectAppointmentDialog';
import AssignStaffControl from './AssignStaffControl';
import VisitDoneModal, { type VisitResult } from './VisitDoneModal';

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
  readonly minTimeFor: (dateStr: string) => string | undefined;
  readonly isSubmitting: boolean;
  readonly actionLoadingId: number | null;

  // Handlers
  readonly onConfirmReview: (aptId: number) => Promise<boolean>;
  readonly onRejectReview: (aptId: number, reasonCode: string, note: string) => Promise<boolean>;
  readonly onRescheduleSubmit: (aptId: number, date: string, time: string, notes: string) => Promise<void>;
  readonly onCompleteSubmit: (aptId: number, result: VisitResult, notes: string, fittingNotes?: string) => Promise<void>;
  readonly onCancelConfirm: (aptId: number, reason: string, blockRebooking: boolean) => Promise<void>;
  readonly onCreateJob: (apt: Appointment) => void;
  /** Book a follow-up visit for this customer (and order). Only offered on an appointment that is approved or done. */
  readonly onFollowUp?: (apt: Appointment) => void;
  readonly onAccommodateEarly?: (aptId: number) => Promise<void>;
  readonly onAskToWait?: (aptId: number) => Promise<void>;
  /** Called after the shop shares something with the customer, so the list refreshes. */
  readonly onAppointmentUpdated?: () => void;
  readonly staff: StaffData[];
  readonly canAssign: boolean;
  readonly onAssign: (aptId: number, staffId: number | null) => Promise<boolean>;
}

export default function AppointmentActionModals({
  showReviewModal, setShowReviewModal, reviewApt, setReviewApt,
  showRescheduleModal, setShowRescheduleModal, rescheduleApt, setRescheduleApt,
  showCompleteModal, setShowCompleteModal, completeApt, setCompleteApt,
  showCancelModal, setShowCancelModal, cancelApt, setCancelApt,
  showViewModal, setShowViewModal, viewApt, setViewApt,
  todayStr, minTimeFor,
  isSubmitting, actionLoadingId,
  onConfirmReview, onRejectReview, onRescheduleSubmit, onCompleteSubmit, onCancelConfirm, onCreateJob, onFollowUp,
  onAccommodateEarly, onAskToWait, onAppointmentUpdated, staff, canAssign, onAssign
}: AppointmentActionModalsProps) {

  const { store } = useAuthStore();
  const [rejectOpen, setRejectOpen] = useState(false);

  // Local Form States
  const [rescheduleForm, setRescheduleForm] = useState({ scheduled_date: '', scheduled_time: '', notes: '' });
  const [cancelForm, setCancelForm] = useState({ reason: '', blockRebooking: false });

  // Sync Cancel Form defaults when modal opens
  useEffect(() => {
    if (cancelApt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCancelForm({ reason: '', blockRebooking: false });
    }
  }, [cancelApt]);

  // Sync Reschedule Form defaults when modal opens
  useEffect(() => {
    if (rescheduleApt) {
      const d = new Date(rescheduleApt.scheduled_at);
      const originalDate = getLocalDateString(d);
      const currentToday = getLocalDateString(new Date());
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRescheduleForm({
        scheduled_date: originalDate < currentToday ? currentToday : originalDate,
        scheduled_time: d.toTimeString().substring(0, 5),
        notes: rescheduleApt.notes || '',
      });
    }
  }, [rescheduleApt]);

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

  return (
    <>
      {/* ── 1. Owner Review Modal ───────────────────────────────────────────── */}
      <Modal isOpen={showReviewModal} onClose={() => { setShowReviewModal(false); setReviewApt(null); }} title="Review Appointment">
        {reviewApt && (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-ink">{reviewApt.customer?.name}</h3>
                <p className="text-xs text-ink-faint">{reviewApt.customer?.email}</p>
              </div>
              <StatusBadge status={reviewApt.status} scheduledAt={reviewApt.scheduled_at} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[11px] text-ink-faint font-semibold uppercase tracking-wider">Type</p>
                <div className="mt-1"><TypeBadge type={reviewApt.appointment_type} label={reviewApt.purpose_label} kind={reviewApt.kind} /></div>
              </div>
              <div>
                <p className="text-[11px] text-ink-faint font-semibold uppercase tracking-wider">Service</p>
                <p className="text-ink font-medium mt-1">{reviewApt.service?.name || <span className="italic text-ink-faint">None</span>}</p>
              </div>
              <div>
                <p className="text-[11px] text-ink-faint font-semibold uppercase tracking-wider">Scheduled</p>
                <p className="text-ink font-medium mt-1">
                  {new Date(reviewApt.scheduled_at).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
                  {' at '}
                  {new Date(reviewApt.scheduled_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-ink-faint font-semibold uppercase tracking-wider">Duration</p>
                <p className="text-ink font-medium mt-1">{reviewApt.duration_minutes ?? 60} minutes</p>
              </div>
              <div>
                <p className="text-[11px] text-ink-faint font-semibold uppercase tracking-wider">Branch</p>
                <p className="text-ink font-medium mt-1">{reviewApt.branch?.name || 'Main Branch'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[11px] text-ink-faint font-semibold uppercase tracking-wider">Assigned Staff</p>
                <AssignStaffControl assignedStaffId={reviewApt.assigned_staff_id} assignedName={reviewApt.assigned_staff?.name} branchId={reviewApt.store_branch_id} staff={staff} canAssign={canAssign} onAssign={(id) => onAssign(reviewApt.id, id)} />
              </div>
              {reviewApt.job_order && (
                <div>
                  <p className="text-[11px] text-ink-faint font-semibold uppercase tracking-wider">Linked Job Order</p>
                  <p className="text-ink font-medium mt-1">
                    <a href={`/dashboard/jobs/${reviewApt.job_order.id}`} className="text-[#6B7FA8] hover:underline" target="_blank" rel="noopener noreferrer">
                      #{reviewApt.job_order.order_number || reviewApt.job_order.id}
                    </a>
                  </p>
                </div>
              )}
            </div>

            {reviewApt.notes && (
              <div>
                <p className="text-[11px] text-ink-faint font-semibold uppercase tracking-wider mb-1">Notes from Customer</p>
                <div className="bg-canvas border border-line rounded-lg p-3 text-sm text-ink whitespace-pre-wrap">{reviewApt.notes}</div>
              </div>
            )}

            {reviewApt.answers && Object.keys(reviewApt.answers).length > 0 && (
              <div>
                <p className="text-[11px] text-ink-faint font-semibold uppercase tracking-wider mb-2">Booking Answers</p>
                <div className="space-y-2">
                  {Object.entries(reviewApt.answers).map(([q, a]) => (
                    <div key={q} className="bg-canvas border border-line rounded-lg p-2.5">
                       <p className="text-xs font-semibold text-ink-muted">{q}</p>
                       <p className="text-xs text-ink mt-0.5">{String(a)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2 border-t border-line">
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowRescheduleModal(true); setRescheduleApt(reviewApt); setShowReviewModal(false); }}
                  className="flex items-center gap-1.5 px-4 py-2 min-h-11 rounded-lg text-sm font-medium text-[#6B7FA8] hover:bg-[#6B7FA8]/10 border border-[#6B7FA8]/20 transition-colors"
                >
                  <RefreshCw size={14} /> Propose New Time
                </button>
                <button
                  type="button"
                  onClick={() => setRejectOpen(true)}
                  disabled={actionLoadingId === reviewApt.id}
                  className="flex items-center gap-1.5 px-4 py-2 min-h-11 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
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
                  className="flex items-center gap-1.5 px-4 py-2 min-h-11 rounded-lg text-sm font-semibold text-white bg-sage hover:bg-sage/90 transition-colors"
                >
                  {actionLoadingId === reviewApt.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <RejectAppointmentDialog
        isOpen={rejectOpen && !!reviewApt}
        busy={!!reviewApt && actionLoadingId === reviewApt.id}
        onClose={() => setRejectOpen(false)}
        onConfirm={async (code, note) => {
          if (!reviewApt) return false;
          const ok = await onRejectReview(reviewApt.id, code, note);
          if (ok) { setShowReviewModal(false); setReviewApt(null); }
          return ok;
        }}
      />

      {/* ── 2. Reschedule Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={showRescheduleModal} onClose={() => { setShowRescheduleModal(false); setRescheduleApt(null); }} title="Propose New Schedule">
        <form onSubmit={handleReschedule} className="space-y-4">
          <p className="text-sm text-ink-muted">Propose a new date and time. The customer will be notified of the change.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="reschedule_date" className="block text-sm font-medium text-ink-body mb-1">New Date</label>
              <input id="reschedule_date" type="date" required min={todayStr} value={rescheduleForm.scheduled_date}
                onChange={e => setRescheduleForm(f => ({ ...f, scheduled_date: e.target.value }))}
                className="w-full bg-canvas border border-line rounded-lg px-4 py-2 text-ink focus:outline-none focus:border-taupe" />
            </div>
            <div>
              <label htmlFor="reschedule_time" className="block text-sm font-medium text-ink-body mb-1">New Time</label>
              <input id="reschedule_time" type="time" required min={minTimeFor(rescheduleForm.scheduled_date)} value={rescheduleForm.scheduled_time}
                onChange={e => setRescheduleForm(f => ({ ...f, scheduled_time: e.target.value }))}
                className="w-full bg-canvas border border-line rounded-lg px-4 py-2 text-ink focus:outline-none focus:border-taupe" />
            </div>
          </div>
          <div>
            <label htmlFor="reschedule_notes" className="block text-sm font-medium text-ink-body mb-1">Note to Customer (Optional)</label>
            <textarea id="reschedule_notes" rows={2} value={rescheduleForm.notes} onChange={e => setRescheduleForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full bg-canvas border border-line rounded-lg px-4 py-2 text-ink focus:outline-none focus:border-taupe resize-none"
              placeholder="e.g. Unavailable on original date, please come on the new date..." />
          </div>
          <div className="pt-2 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={() => setShowRescheduleModal(false)} className="px-4 py-2 min-h-11 rounded-lg text-sm font-medium text-ink-body hover:bg-sunken transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="bg-[#6B7FA8] hover:bg-[#6B7FA8]/90 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              <RefreshCw size={14} /> Confirm Reschedule
            </button>
          </div>
        </form>
      </Modal>

      {/* ── 3. Done: the three results ──────────────────────────────────────── */}
      <VisitDoneModal
        isOpen={showCompleteModal}
        apt={completeApt}
        isSubmitting={isSubmitting}
        onClose={() => { setShowCompleteModal(false); setCompleteApt(null); }}
        onSubmit={onCompleteSubmit}
        onProceed={(apt) => { setShowCompleteModal(false); setCompleteApt(null); onCreateJob(apt); }}
      />

      {/* ── 4. Cancel Confirmation Modal ────────────────────────────────────── */}
      <Modal isOpen={showCancelModal} onClose={() => { setShowCancelModal(false); setCancelApt(null); }} title="Cancel Appointment">
        <div className="space-y-4">
          <p className="text-sm text-ink-body">
            You&apos;re cancelling the appointment for <strong>{cancelApt?.customer?.name}</strong>. The customer will see your reason and be notified.
          </p>
          <div>
            <label htmlFor="cancel-reason" className="block text-xs font-semibold text-ink-muted mb-1">Reason for cancelling <span className="text-danger">*</span></label>
            <textarea
              id="cancel-reason"
              value={cancelForm.reason}
              onChange={(e) => setCancelForm((f) => ({ ...f, reason: e.target.value }))}
              rows={3}
              required
              placeholder="e.g. Branch fully booked for walk-in consultations that day."
              className="w-full px-3 py-2 bg-canvas border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-taupe resize-none"
            />
          </div>
          <label className="flex items-start gap-2 text-sm text-ink-body cursor-pointer">
            <input
              type="checkbox"
              checked={cancelForm.blockRebooking}
              onChange={(e) => setCancelForm((f) => ({ ...f, blockRebooking: e.target.checked }))}
              className="mt-0.5"
            />
            <span>
              Block this customer from booking again at this store
              <span className="block text-xs text-ink-muted">Default is off — the customer can still book a new appointment.</span>
            </span>
          </label>
          <div className="pt-2 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={() => setShowCancelModal(false)} className="px-4 py-2 min-h-11 rounded-lg text-sm font-medium text-ink-body hover:bg-sunken transition-colors">Keep Appointment</button>
            <button
              type="button"
              onClick={() => cancelApt && cancelForm.reason.trim() && onCancelConfirm(cancelApt.id, cancelForm.reason.trim(), cancelForm.blockRebooking)}
              disabled={isSubmitting || !cancelForm.reason.trim()}
              className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 min-h-11 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />} Yes, Cancel It
            </button>
          </div>
        </div>
      </Modal>

      {/* ── 5. View Details Modal ────────────────────────────────────────────── */}
      <Modal isOpen={showViewModal} onClose={() => { setShowViewModal(false); setViewApt(null); }} title="Appointment Details">
        {viewApt && (
          <div className="space-y-4 text-sm text-ink-body">
            <div className="flex items-start justify-between border-b border-line pb-3">
              <div>
                <h4 className="font-bold text-ink text-base">{viewApt.customer?.name}</h4>
                <p className="text-xs text-ink-faint">{viewApt.customer?.email}</p>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <TypeBadge type={viewApt.appointment_type} label={viewApt.purpose_label} kind={viewApt.kind} />
                <div className="flex items-center gap-1.5">
                  <StatusBadge status={viewApt.status} scheduledAt={viewApt.scheduled_at} />
                  <CheckInBadge checkedInAt={viewApt.checked_in_at} scheduledAt={viewApt.scheduled_at} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-ink-faint font-semibold uppercase tracking-wider">Scheduled At</p>
                <p className="text-ink font-medium mt-0.5">
                  {new Date(viewApt.scheduled_at).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
                  {' at '}
                  {new Date(viewApt.scheduled_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-faint font-semibold uppercase tracking-wider">Duration</p>
                <p className="text-ink font-medium mt-0.5">{viewApt.duration_minutes ?? 60} minutes</p>
              </div>
              {viewApt.checked_in_at && (
                <div>
                  <p className="text-xs text-ink-faint font-semibold uppercase tracking-wider">Checked In</p>
                  <p className="text-ink font-medium mt-0.5">
                    {new Date(viewApt.checked_in_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
              {viewApt.arrival_status === 'early' && (
                <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                  <p className="text-[11px] text-amber-800 font-bold uppercase tracking-wider">
                    Arrived Early{viewApt.early_arrival_decision ? ` — ${viewApt.early_arrival_decision.replace('_', ' ')}` : ''}
                  </p>
                  <p className="text-xs text-amber-700">
                    Scheduled for {new Date(viewApt.scheduled_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}.
                    {' '}The customer&apos;s original appointment time is unchanged unless accommodated below.
                  </p>
                  {viewApt.early_arrival_decision !== 'accommodated' && (onAccommodateEarly || onAskToWait) && (
                    <div className="flex gap-2">
                      {onAccommodateEarly && (
                        <button
                          type="button"
                          onClick={() => onAccommodateEarly(viewApt.id)}
                          disabled={actionLoadingId === viewApt.id}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Accommodate Now
                        </button>
                      )}
                      {onAskToWait && (
                        <button
                          type="button"
                          onClick={() => onAskToWait(viewApt.id)}
                          disabled={actionLoadingId === viewApt.id}
                          className="flex-1 bg-white border border-amber-300 hover:bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Ask Customer to Wait
                        </button>
                      )}
                    </div>
                  )}
                  {viewApt.early_arrival_decision === 'accommodated' && viewApt.actual_service_start_at && (
                    <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <Check size={12} /> Service started at{' '}
                      {new Date(viewApt.actual_service_start_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              )}
              {viewApt.catalog_item && (
                // Design only here — the Service block right below keeps its own link.
                <AppointmentSubject apt={{ ...viewApt, service: null }} storeSlug={store?.slug} variant="full" />
              )}
              <div>
                <p className="text-xs text-ink-faint font-semibold uppercase tracking-wider">Service</p>
                {viewApt.service && store?.slug ? (
                  <a
                    href={`/store/${store.slug}/service/${viewApt.service.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#6B7FA8] hover:underline font-medium mt-0.5 inline-block"
                  >
                    {viewApt.service.name}
                  </a>
                ) : (
                  <p className="text-ink font-medium mt-0.5">{viewApt.service?.name || <span className="italic text-ink-faint">Consultation</span>}</p>
                )}
                {viewApt.service && serviceCategoryPath(viewApt.service).length > 0 && (
                  <p className="text-xs text-ink-muted mt-0.5">{serviceCategoryPath(viewApt.service).join(' → ')}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-ink-faint font-semibold uppercase tracking-wider">Branch</p>
                <p className="text-ink font-medium mt-0.5">{viewApt.branch?.name || 'Main Branch'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-ink-faint font-semibold uppercase tracking-wider">Assigned Staff</p>
                <AssignStaffControl assignedStaffId={viewApt.assigned_staff_id} assignedName={viewApt.assigned_staff?.name} branchId={viewApt.store_branch_id} staff={staff} canAssign={canAssign && !['completed', 'cancelled', 'no_show', 'rejected'].includes(viewApt.status)} onAssign={(id) => onAssign(viewApt.id, id)} />
              </div>
              {viewApt.job_order && (
                <div>
                  <p className="text-[11px] text-ink-faint font-semibold uppercase tracking-wider">Linked Job Order</p>
                  <p className="text-ink font-medium mt-1">
                    <a href={`/dashboard/jobs/${viewApt.job_order.id}`} className="text-[#6B7FA8] hover:underline" target="_blank" rel="noopener noreferrer">
                      #{viewApt.job_order.order_number || viewApt.job_order.id}
                    </a>
                  </p>
                </div>
              )}
              {viewApt.priority && (
                <div>
                  <p className="text-xs text-ink-faint font-semibold uppercase tracking-wider">Priority</p>
                  <p className={`font-bold mt-0.5 capitalize text-xs ${
                    viewApt.priority === 'rush' ? 'text-rose-600' : viewApt.priority === 'urgent' ? 'text-amber-600' : 'text-zinc-600'
                  }`}>
                    {viewApt.priority}
                  </p>
                </div>
              )}
              {viewApt.garment_category && (
                <div>
                  <p className="text-xs text-ink-faint font-semibold uppercase tracking-wider">Garment Category</p>
                  <p className="text-ink font-semibold mt-0.5 capitalize">{viewApt.garment_category}</p>
                </div>
              )}
              {viewApt.outcome && (
                <div className="col-span-2 bg-canvas border border-line rounded-xl p-3">
                  <p className="text-[10px] text-ink-faint font-bold uppercase tracking-wider">Appointment Outcome</p>
                  <p className="text-emerald-700 font-bold mt-0.5 text-xs capitalize flex items-center gap-1">
                    <Check size={12} /> {viewApt.outcome.replace(/_/g, ' ')}
                  </p>
                </div>
              )}
            </div>

            {viewApt.notes && (
              <div>
                <p className="text-xs text-ink-faint font-semibold uppercase tracking-wider">Notes</p>
                <div className="bg-canvas border border-line rounded-lg p-3 text-xs mt-1 whitespace-pre-wrap text-ink">{viewApt.notes}</div>
              </div>
            )}

            {viewApt.reference_images && viewApt.reference_images.length > 0 && (
              <div>
                <p className="text-xs text-ink-faint font-semibold uppercase tracking-wider mb-2">Design Reference Images</p>
                <div className="grid grid-cols-4 gap-2">
                  {viewApt.reference_images.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-lg overflow-hidden border border-line bg-zinc-100 hover:opacity-80 transition-opacity">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Reference" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {viewApt.reference_link && (
              <div>
                <p className="text-xs text-ink-faint font-semibold uppercase tracking-wider">Reference Link</p>
                <a href={safeHref(viewApt.reference_link)} target="_blank" rel="noopener noreferrer" className="text-[#6B7FA8] hover:underline text-xs break-all">
                  {viewApt.reference_link}
                </a>
              </div>
            )}

            {viewApt.answers && Object.keys(viewApt.answers).length > 0 && (
              <div className="border-t border-line pt-3">
                <p className="text-xs text-ink-faint font-semibold uppercase tracking-wider mb-2">Booking Answers</p>
                <div className="space-y-2">
                  {Object.entries(viewApt.answers).map(([q, a]) => (
                    <div key={q} className="bg-canvas border border-line rounded-lg p-2.5">
                      <p className="text-xs font-semibold text-ink-muted">{q}</p>
                      <p className="text-xs text-ink mt-0.5">{String(a)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {['pending', 'confirmed', 'in_progress'].includes(viewApt.status) && (
              <AppointmentCustomerToolkit key={viewApt.id} apt={viewApt} onChanged={() => onAppointmentUpdated?.()} />
            )}

            <div className="pt-3 border-t border-line flex flex-wrap items-center justify-end gap-2">
              {onFollowUp && ['confirmed', 'in_progress', 'completed'].includes(viewApt.status) && (
                <button type="button" onClick={() => { setShowViewModal(false); onFollowUp(viewApt); }} className="border border-taupe/40 text-taupe hover:bg-taupe/10 px-5 py-2 rounded-lg text-xs font-medium transition-colors">
                  Schedule a follow-up
                </button>
              )}
              <button type="button" onClick={() => setShowViewModal(false)} className="bg-taupe hover:bg-taupe/90 text-white px-5 py-2 rounded-lg text-xs font-medium transition-colors">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
