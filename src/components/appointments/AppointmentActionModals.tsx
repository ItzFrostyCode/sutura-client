import { safeHref } from '@/lib/safeHref';
import { getMediaUrl } from '@/lib/media';
import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Loader2, RefreshCw, CheckSquare, X, Check, Scissors, Ruler, Eye, Pencil } from 'lucide-react';
import {
  Appointment, JobOrderData, StaffData,
  TypeBadge, StatusBadge, CheckInBadge, getLocalDateString, cleanCustomerNotes, contactLine
} from './appointmentHelpers';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { serviceCategoryPath } from '@/lib/garmentTaxonomy';
import AppointmentSubject from './AppointmentSubject';
import RejectAppointmentDialog from './RejectAppointmentDialog';
import AssignStaffControl from './AssignStaffControl';
import VisitDoneModal, { type VisitResult } from './VisitDoneModal';
import InteractiveCalendar from '@/components/shared/InteractiveCalendar';
import AppointmentItemsBreakdown from './AppointmentItemsBreakdown';

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

  readonly showRejectModal?: boolean;
  readonly setShowRejectModal?: (v: boolean) => void;
  readonly rejectApt?: Appointment | null;
  readonly setRejectApt?: (a: Appointment | null) => void;

  readonly showViewModal?: boolean;
  readonly setShowViewModal?: (v: boolean) => void;
  readonly viewApt?: Appointment | null;
  readonly setViewApt?: (a: Appointment | null) => void;

  // Reference Data & Statuses
  readonly todayStr: string;
  readonly minTimeFor: (dateStr: string) => string | undefined;
  readonly isSubmitting: boolean;
  readonly actionLoadingId: number | null;
  readonly appointments?: Appointment[];

  // Handlers
  readonly onConfirmReview: (aptId: number) => Promise<boolean>;
  readonly onRejectReview: (aptId: number, reasonCode: string, note: string) => Promise<boolean>;
  readonly onRescheduleSubmit: (aptId: number, date: string, time: string, notes: string) => Promise<void>;
  readonly onCompleteSubmit: (aptId: number, result: VisitResult, notes: string, fittingNotes?: string) => Promise<void>;
  readonly onCancelConfirm: (aptId: number, reason: string, blockRebooking: boolean) => Promise<void>;
  readonly onCreateJob: (apt: Appointment) => void;
  /** Book a follow-up visit for this customer (and order). Only offered on an appointment that is approved or done. */
  readonly onFollowUp?: (apt: Appointment) => void;
  /** Called after the shop shares something with the customer, so the list refreshes. */
  readonly staff: StaffData[];
  readonly canAssign: boolean;
  readonly onAssign: (aptId: number, staffId: number | null) => Promise<boolean>;
  readonly onEditClick?: (apt: Appointment) => void;
  readonly onCheckInClick?: (aptId: number) => void;
  readonly onDidntComeClick?: (apt: Appointment) => void;
}

export default function AppointmentActionModals({
  showReviewModal, setShowReviewModal, reviewApt, setReviewApt,
  showRescheduleModal, setShowRescheduleModal, rescheduleApt, setRescheduleApt,
  showCompleteModal, setShowCompleteModal, completeApt, setCompleteApt,
  showCancelModal, setShowCancelModal, cancelApt, setCancelApt,
  showRejectModal, setShowRejectModal, rejectApt, setRejectApt,
  showViewModal, setShowViewModal, viewApt, setViewApt,
  todayStr, minTimeFor,
  isSubmitting, actionLoadingId, appointments = [],
  onConfirmReview, onRejectReview, onRescheduleSubmit, onCompleteSubmit, onCancelConfirm, onCreateJob, onFollowUp,
  staff, canAssign, onAssign,
  onEditClick, onCheckInClick, onDidntComeClick
}: AppointmentActionModalsProps) {

  const { store, user } = useAuthStore();
  const storeOwner = store?.owner ?? (user?.roles?.some(r => r.name === 'store_owner') ? { id: user.id, name: user.name } : null);
  const [rejectOpen, setRejectOpen] = useState(false);

  // Exclude current reschedule appointment from conflicts
  const calendarAppointments = appointments
    .filter(a => ['pending', 'confirmed', 'in_progress'].includes(a.status) && a.id !== rescheduleApt?.id)
    .map(a => ({
      scheduled_at: a.scheduled_at,
      duration_minutes: a.duration_minutes,
      store_branch_id: a.store_branch_id ?? null,
      status: a.status,
    }));

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
                <p className="text-xs text-ink-faint">{contactLine(reviewApt.customer)}</p>
              </div>
              <StatusBadge status={reviewApt.status} scheduledAt={reviewApt.scheduled_at} jobOrderId={reviewApt.job_order_id} jobStatus={reviewApt.job_order?.status} kind={reviewApt.kind} type={reviewApt.appointment_type} />
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
                <p className="text-[11px] text-ink-faint font-semibold uppercase tracking-wider">Assigned To</p>
                <AssignStaffControl
                  assignedStaffId={reviewApt.assigned_staff_id}
                  assignedName={reviewApt.assigned_staff?.name}
                  branchId={reviewApt.store_branch_id ?? reviewApt.branch?.id}
                  staff={staff}
                  storeOwner={storeOwner}
                  canAssign={canAssign}
                  onAssign={(id) => onAssign(reviewApt.id, id)}
                />
              </div>
              {reviewApt.job_order && (
                <div>
                  <p className="text-[11px] text-ink-faint font-semibold uppercase tracking-wider">Linked Job Order</p>
                  <p className="text-ink font-medium mt-1">
                    <a href={`/dashboard/jobs/${reviewApt.job_order.id}`} className="text-taupe hover:underline" target="_blank" rel="noopener noreferrer">
                      #{reviewApt.job_order.order_number || reviewApt.job_order.id}
                    </a>
                  </p>
                </div>
              )}
            </div>

            {reviewApt.items && reviewApt.items.length > 0 && (
              <AppointmentItemsBreakdown items={reviewApt.items} storeSlug={store?.slug} />
            )}

            {cleanCustomerNotes(reviewApt.notes) && (
              <div>
                <p className="text-[11px] text-ink-faint font-semibold uppercase tracking-wider mb-1">Notes from Customer</p>
                <div className="bg-canvas border border-line rounded-lg p-3 text-sm text-ink whitespace-pre-wrap">{cleanCustomerNotes(reviewApt.notes)}</div>
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
                  className="flex items-center gap-1.5 px-4 py-2 min-h-11 rounded-lg text-sm font-medium text-taupe hover:bg-taupe/10 border border-taupe/20 transition-colors"
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
        isOpen={Boolean(rejectOpen || (showRejectModal && (rejectApt || reviewApt || viewApt)))}
        busy={Boolean((rejectApt || reviewApt || viewApt) && actionLoadingId === (rejectApt || reviewApt || viewApt)!.id)}
        onClose={() => {
          setRejectOpen(false);
          setShowRejectModal?.(false);
          setRejectApt?.(null);
        }}
        hasService={Boolean((rejectApt || reviewApt || viewApt)?.service || (rejectApt || reviewApt || viewApt)?.appointment_type === 'alteration' || (rejectApt || reviewApt || viewApt)?.appointment_type === 'fitting')}
        onConfirm={async (code, note) => {
          const target = rejectApt || reviewApt || viewApt;
          if (!target) return false;
          const ok = await onRejectReview(target.id, code, note);
          if (ok) {
            setShowReviewModal(false);
            setReviewApt(null);
            setShowViewModal?.(false);
            setViewApt?.(null);
            setRejectOpen(false);
            setShowRejectModal?.(false);
            setRejectApt?.(null);
          }
          return ok;
        }}
      />

      {/* ── 2. Reschedule Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={showRescheduleModal}
        onClose={() => { setShowRescheduleModal(false); setRescheduleApt(null); }}
        title="Propose New Schedule"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleReschedule} className="space-y-4">
          <p className="text-sm text-ink-muted">
            Propose a new date and time for <strong>{rescheduleApt?.customer?.name}</strong>. The customer will be notified of the proposed schedule.
          </p>

          <InteractiveCalendar
            selectedBranchId={rescheduleApt?.store_branch_id ? String(rescheduleApt.store_branch_id) : null}
            durationMinutes={rescheduleApt?.duration_minutes || 30}
            operatingHours={store?.operating_hours ?? null}
            specialHours={store?.special_hours ?? null}
            appointments={calendarAppointments}
            loadingAppts={false}
            selectedDate={rescheduleForm.scheduled_date}
            selectedTime={rescheduleForm.scheduled_time}
            mode="walk_in"
            onDateChange={(date) => setRescheduleForm(f => ({ ...f, scheduled_date: date }))}
            onTimeChange={(time) => setRescheduleForm(f => ({ ...f, scheduled_time: time }))}
          />

          <div>
            <label htmlFor="reschedule_notes" className="block text-sm font-medium text-ink-body mb-1">
              Note to Customer (Optional)
            </label>
            <textarea
              id="reschedule_notes"
              rows={2}
              value={rescheduleForm.notes}
              onChange={e => setRescheduleForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full bg-canvas border border-line rounded-lg px-4 py-2 text-ink focus:outline-none focus:border-taupe resize-none"
              placeholder="e.g. Schedule unavailable on original date — please come on this proposed time..."
            />
          </div>

          <div className="pt-2 flex flex-wrap justify-end gap-3 border-t border-line">
            <button
              type="button"
              onClick={() => { setShowRescheduleModal(false); setRescheduleApt(null); }}
              className="px-4 py-2 min-h-11 rounded-lg text-sm font-medium text-ink-body hover:bg-sunken transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !rescheduleForm.scheduled_date || !rescheduleForm.scheduled_time}
              className="bg-taupe hover:bg-taupe/90 text-white px-5 py-2 min-h-11 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
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

    </>
  );
}
