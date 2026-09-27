import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { Job } from './jobTypes';

// Local (not UTC) YYYY-MM-DDTHH:mm for a <input type="datetime-local">,
// same timezone-drift avoidance as appointmentHelpers' getLocalDateString.
function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return '';
  const cleanStr = iso.replace(/Z|\+00:00$/, '');
  const d = new Date(cleanStr.includes('T') ? cleanStr : cleanStr.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function useJobDetail(jobId: string) {
  const { store } = useAuthStore();
  const router = useRouter();
  const toast = useToast();
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Editable fields
  const [status, setStatus] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [holdReason, setHoldReason] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [balance, setBalance] = useState<string | number>('');
  const [notes, setNotes] = useState('');
  const [completionPhotoUrl, setCompletionPhotoUrl] = useState('');
  const [estimatedReadyAt, setEstimatedReadyAt] = useState('');
  const [customerMaterialStatus, setCustomerMaterialStatus] = useState('');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (store && jobId) {
      timer = setTimeout(() => setLoading(true), 0);
      // Fetch Job Details
      api.get(`/stores/${store.id}/jobs/${jobId}`)
        .then(res => {
          const data = res.data.data;
          setJob(data);
          setStatus(data.status);
          setPaymentStatus(data.payment_status);
          setBalance(data.balance);
          setNotes(data.notes || '');
          setCompletionPhotoUrl(data.completion_photo_url || '');
          setEstimatedReadyAt(toDatetimeLocal(data.estimated_ready_at));
          setCustomerMaterialStatus(data.customer_material_status || '');

          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      timer = setTimeout(() => setLoading(false), 0);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [store, jobId]);

  // Re-fetches the job and swaps in the fresh copy — used after a side
  // action that mutates the job server-side outside handleUpdate's own PUT
  // (e.g. appending a progress photo), so the page reflects it without a
  // full reload.
  const refreshJob = async () => {
    if (!store) return;
    try {
      const res = await api.get(`/stores/${store.id}/jobs/${jobId}`);
      setJob(res.data.data);
    } catch (err) {
      console.error('Failed to refresh job', err);
    }
  };

  // Practical Dirty Checking: track exactly which tab and fields have unsaved modifications
  const dirtyTabs = {
    overview: Boolean(job && notes !== (job.notes || '')),
    production: Boolean(
      job && (
        status !== job.status ||
        notes !== (job.notes || '') ||
        completionPhotoUrl !== (job.completion_photo_url || '') ||
        estimatedReadyAt !== toDatetimeLocal(job.estimated_ready_at) ||
        customerMaterialStatus !== (job.customer_material_status || '')
      )
    ),
  };

  const hasUnsavedChanges = Boolean(
    dirtyTabs.overview || dirtyTabs.production
  );

  const handleResetChanges = () => {
    if (!job) return;
    setStatus(job.status);
    setPaymentStatus(job.payment_status);
    setBalance(job.balance);
    setNotes(job.notes || '');
    setCompletionPhotoUrl(job.completion_photo_url || '');
    setEstimatedReadyAt(toDatetimeLocal(job.estimated_ready_at));
    setCustomerMaterialStatus(job.customer_material_status || '');
    toast.info('Draft changes discarded.');
  };

  const handleUpdate = async () => {
    if (!store || !job) return;
    setSaving(true);

    try {
      // Persist core job updates (Production, Notes, QC, Status). Whoever
      // moves the status forward is auto-recorded server-side as having
      // worked that production stage (JobOrderController::update()) — no
      // separate staff-assignment step needed here anymore.
      await api.put(`/stores/${store.id}/jobs/${jobId}`, {
        status,
        payment_status: paymentStatus,
        balance: Number.parseFloat(String(balance || 0)),
        notes,
        completion_photo_url: completionPhotoUrl || null,
        estimated_ready_at: estimatedReadyAt || null,
        customer_material_status: customerMaterialStatus || null,
        cancellation_reason: status === 'cancelled' ? cancellationReason : undefined,
        hold_reason: status === 'on_hold' ? holdReason : undefined,
      });

      const res = await api.get(`/stores/${store.id}/jobs/${jobId}`);
      const data = res.data.data;
      setJob(data);
      setStatus(data.status);
      setPaymentStatus(data.payment_status);
      setNotes(data.notes || '');
      setCompletionPhotoUrl(data.completion_photo_url || '');
      setEstimatedReadyAt(toDatetimeLocal(data.estimated_ready_at));
      setCustomerMaterialStatus(data.customer_material_status || '');

      toast.success('All changes saved successfully.');
    } catch (err: unknown) {
      console.error('Failed to update', err);
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update details.');
      if (job) {
        setStatus(job.status);
        setPaymentStatus(job.payment_status);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChargePayment = async (amount: number, method: string, notesVal: string, reference?: string, receiptPath?: string) => {
    if (!store || !job) return;
    setSaving(true);
    try {
      const payRes = await api.post(`/stores/${store.id}/jobs/${job.id}/pay`, {
        amount,
        payment_method: method,
        reference: reference || undefined,
        notes: notesVal || undefined,
        receipt_path: receiptPath || undefined,
      });
      const res = await api.get(`/stores/${store.id}/jobs/${job.id}`);
      const updatedJob = res.data.data;
      setJob(updatedJob);
      setBalance(updatedJob.balance);
      setPaymentStatus(updatedJob.payment_status);

      // A payment below the 50% downpayment threshold is still valid (it
      // counts toward it), but saying just "logged successfully" reads as
      // if the store's downpayment policy has been satisfied — so call out
      // the remaining shortfall instead of leaving that unqualified.
      const totalAmt = Number.parseFloat(String(updatedJob.total_amount)) || 0;
      const paidSoFar = totalAmt - (Number.parseFloat(String(updatedJob.balance)) || 0);
      const requiredDp = totalAmt * 0.5;
      if (paidSoFar < requiredDp) {
        toast.success(`₱${amount.toFixed(2)} payment logged. ₱${(requiredDp - paidSoFar).toFixed(2)} more is needed to reach the required 50% downpayment.`);
      } else {
        toast.success(`₱${amount.toFixed(2)} payment logged successfully!`);
      }
      // Same reference number already used on another order — a possible
      // reused-screenshot scam. Doesn't block the payment (legitimate
      // reference collisions do happen), just flags it for a second look.
      if (payRes.data?.warning) {
        toast.info(payRes.data.warning);
      }
    } catch(err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Payment failed');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // One-time, in-the-moment discount (e.g. a repeat customer) — reduces the
  // remaining balance directly and is logged to the audit trail server-side.
  const handleApplyDiscount = async (amount: number, reason: string) => {
    if (!store || !job) return;
    setSaving(true);
    try {
      await api.post(`/stores/${store.id}/jobs/${job.id}/discount`, {
        amount,
        reason: reason || undefined,
      });
      const res = await api.get(`/stores/${store.id}/jobs/${job.id}`);
      const updatedJob = res.data.data;
      setJob(updatedJob);
      setBalance(updatedJob.balance);
      setPaymentStatus(updatedJob.payment_status);
      toast.success(`₱${amount.toFixed(2)} discount applied successfully.`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to apply discount.');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Corrects a payment's method/reference/receipt/notes after the fact —
  // amount is deliberately never sent here, it stays locked once logged.
  const handleUpdatePayment = async (paymentId: number, fields: { payment_method: string; reference?: string; notes?: string; receipt_path?: string }) => {
    if (!store || !job) return;
    setSaving(true);
    try {
      await api.put(`/stores/${store.id}/jobs/${job.id}/payments/${paymentId}`, {
        payment_method: fields.payment_method,
        reference: fields.reference || undefined,
        notes: fields.notes || undefined,
        receipt_path: fields.receipt_path || undefined,
      });
      const res = await api.get(`/stores/${store.id}/jobs/${job.id}`);
      setJob(res.data.data);
      toast.success('Payment updated successfully!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update payment');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Marks a specific payment as fake/bad, discovered after the fact —
  // reverses balance/payment_status server-side even if the job is already
  // completed. See JobOrderController::rejectPayment.
  const handleRejectPayment = async (paymentId: number, reason: string) => {
    if (!store || !job) return;
    setSaving(true);
    try {
      await api.post(`/stores/${store.id}/jobs/${job.id}/payments/${paymentId}/reject`, {
        reason,
      });
      const res = await api.get(`/stores/${store.id}/jobs/${job.id}`);
      const updatedJob = res.data.data;
      setJob(updatedJob);
      setBalance(updatedJob.balance);
      setPaymentStatus(updatedJob.payment_status);
      toast.success('Payment rejected — balance updated.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to reject payment.');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Declines a job order before production starts — a business decision
  // (feasibility/capacity/fabric availability), gated store_owner/branch_manager
  // server-side, only valid while status is still 'pending'.
  const handleRejectOrder = async (reason: string) => {
    if (!store || !job) return;
    setSaving(true);
    try {
      await api.post(`/stores/${store.id}/jobs/${job.id}/reject`, { reason });
      const res = await api.get(`/stores/${store.id}/jobs/${job.id}`);
      const updatedJob = res.data.data;
      setJob(updatedJob);
      setStatus(updatedJob.status);
      toast.success('Job order rejected.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to reject job order.');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Re-points the job to the current (corrected) measurement version — see
  // JobOrderController@show, which flags job.measurement.is_stale when the
  // linked version has since been superseded by an edit. Without this, a
  // measurement correction made after the job started never reaches it.
  const handleUseCurrentMeasurement = async (currentVersionId: number) => {
    if (!store || !job) return;
    setSaving(true);
    try {
      await api.put(`/stores/${store.id}/jobs/${job.id}`, { measurement_id: currentVersionId });
      const res = await api.get(`/stores/${store.id}/jobs/${job.id}`);
      setJob(res.data.data);
      toast.success('Job now uses the current measurement version.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to switch measurement version.');
    } finally {
      setSaving(false);
    }
  };

  // Per-piece completion on a bulk/team order's roster — a 10-jersey job
  // otherwise has one status for the whole batch. See JobOrderController@toggleRosterItem.
  const handleToggleRosterItem = async (index: number) => {
    if (!store || !job) return;
    try {
      const res = await api.post(`/stores/${store.id}/jobs/${job.id}/roster/${index}/toggle`);
      setJob(res.data.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update roster item.');
    }
  };

  const handleDelete = async () => {
    if (!store || !job) return;
    setIsDeleting(true);
    try {
      await api.delete(`/stores/${store.id}/jobs/${job.id}`);
      toast.success('Job order deleted successfully.');
      router.push('/dashboard/jobs');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to delete job order.');
      setIsDeleting(false);
    }
  };

  return {
    store,
    router,
    job,
    loading,
    saving,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDeleting,
    status,
    setStatus,
    paymentStatus,
    setPaymentStatus,
    balance,
    setBalance,
    notes,
    setNotes,
    completionPhotoUrl,
    setCompletionPhotoUrl,
    estimatedReadyAt,
    setEstimatedReadyAt,
    customerMaterialStatus,
    setCustomerMaterialStatus,
    handleUpdate,
    handleChargePayment,
    handleApplyDiscount,
    handleUpdatePayment,
    handleRejectPayment,
    handleRejectOrder,
    handleUseCurrentMeasurement,
    handleToggleRosterItem,
    cancellationReason,
    setCancellationReason,
    holdReason,
    setHoldReason,
    refreshJob,
    handleDelete,
    hasUnsavedChanges,
    dirtyTabs,
    handleResetChanges,
  };
}
