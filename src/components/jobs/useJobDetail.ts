import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { Job, Staff } from './jobTypes';
import { STAFF_STAGES } from './jobHelpers';

function emptyStageMap<T>(value: T): Record<string, T> {
  return Object.fromEntries(STAFF_STAGES.map(stage => [stage, value]));
}

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

  // Outsourcing
  const [isOutsourced, setIsOutsourced] = useState(false);
  const [partnerStoreName, setPartnerStoreName] = useState('');
  const [outsourcingCost, setOutsourcingCost] = useState('');

  // Staff Assignment
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [staffAssignments, setStaffAssignments] = useState<Record<string, string>>(emptyStageMap(''));
  const [staffCompletions, setStaffCompletions] = useState<Record<string, string | null>>(emptyStageMap(null));
  const [savingStaff, setSavingStaff] = useState(false);

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
          setIsOutsourced(data.is_outsourced || false);
          setPartnerStoreName(data.partner_store_name || '');
          setOutsourcingCost(data.outsourcing_cost != null ? String(data.outsourcing_cost) : '');

          // Populate existing staff stages
          const assignments: Record<string, string> = emptyStageMap('');
          const completions: Record<string, string | null> = emptyStageMap(null);
          if (data.staff_stages) {
             data.staff_stages.forEach((staff: { id: number; pivot: { stage: string; completed_at?: string } }) => {
                assignments[staff.pivot.stage] = staff.id.toString();
                completions[staff.pivot.stage] = staff.pivot.completed_at || null;
             });
          }
          setStaffAssignments(assignments);
          setStaffCompletions(completions);
          
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });

      // Fetch Staff for assignment dropdown
      api.get(`/stores/${store.id}/staff`)
        .then(res => {
          setAllStaff(res.data.data);
        })
        .catch(console.error);
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
        isOutsourced !== Boolean(job.is_outsourced) ||
        partnerStoreName !== (job.partner_store_name || '') ||
        outsourcingCost !== (job.outsourcing_cost != null ? String(job.outsourcing_cost) : '') ||
        completionPhotoUrl !== (job.completion_photo_url || '') ||
        estimatedReadyAt !== toDatetimeLocal(job.estimated_ready_at) ||
        customerMaterialStatus !== (job.customer_material_status || '')
      )
    ),
    staff: Boolean(
      job &&
      STAFF_STAGES.some(stage => {
        const currentAssigned = staffAssignments[stage] || '';
        const originalStaff = job.staff_stages?.find(s => s.pivot.stage === stage);
        const originalAssigned = originalStaff ? String(originalStaff.id) : '';
        return currentAssigned !== originalAssigned;
      })
    ),
  };

  const hasUnsavedChanges = Boolean(
    dirtyTabs.overview || dirtyTabs.production || dirtyTabs.staff
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
    setIsOutsourced(job.is_outsourced || false);
    setPartnerStoreName(job.partner_store_name || '');
    setOutsourcingCost(job.outsourcing_cost != null ? String(job.outsourcing_cost) : '');

    const assignments: Record<string, string> = emptyStageMap('');
    const completions: Record<string, string | null> = emptyStageMap(null);
    if (job.staff_stages) {
      job.staff_stages.forEach((staff: { id: number; pivot: { stage: string; completed_at?: string } }) => {
        assignments[staff.pivot.stage] = staff.id.toString();
        completions[staff.pivot.stage] = staff.pivot.completed_at || null;
      });
    }
    setStaffAssignments(assignments);
    setStaffCompletions(completions);
    toast.info('Draft changes discarded.');
  };

  const handleUpdate = async () => {
    if (!store || !job) return;
    setSaving(true);

    try {
      // 1. Persist core job updates (Production, Notes, Outsourcing, QC, Status)
      await api.put(`/stores/${store.id}/jobs/${jobId}`, {
        status,
        payment_status: paymentStatus,
        balance: Number.parseFloat(String(balance || 0)),
        notes,
        is_outsourced: isOutsourced,
        partner_store_name: isOutsourced ? partnerStoreName : null,
        outsourcing_cost: isOutsourced && outsourcingCost ? Number.parseFloat(outsourcingCost) : null,
        completion_photo_url: completionPhotoUrl || null,
        estimated_ready_at: estimatedReadyAt || null,
        customer_material_status: customerMaterialStatus || null,
        cancellation_reason: status === 'cancelled' ? cancellationReason : undefined,
        hold_reason: status === 'on_hold' ? holdReason : undefined,
      });

      // 2. Persist staff assignments if modified
      if (dirtyTabs.staff) {
        const assignments = Object.entries(staffAssignments)
          .filter(([, userId]) => userId)
          .map(([stage, userId]) => ({ stage, user_id: userId }));

        await api.post(`/stores/${store.id}/jobs/${jobId}/staff`, {
          assignments,
        });
      }

      // 3. Fetch latest confirmed server copy
      const res = await api.get(`/stores/${store.id}/jobs/${jobId}`);
      const data = res.data.data;
      setJob(data);
      setStatus(data.status);
      setPaymentStatus(data.payment_status);
      setNotes(data.notes || '');
      setIsOutsourced(data.is_outsourced || false);
      setPartnerStoreName(data.partner_store_name || '');
      setOutsourcingCost(data.outsourcing_cost != null ? String(data.outsourcing_cost) : '');
      setCompletionPhotoUrl(data.completion_photo_url || '');
      setEstimatedReadyAt(toDatetimeLocal(data.estimated_ready_at));
      setCustomerMaterialStatus(data.customer_material_status || '');

      const newAssignments: Record<string, string> = emptyStageMap('');
      const newCompletions: Record<string, string | null> = emptyStageMap(null);
      if (data.staff_stages) {
        data.staff_stages.forEach((staff: { id: number; pivot: { stage: string; completed_at?: string } }) => {
          newAssignments[staff.pivot.stage] = staff.id.toString();
          newCompletions[staff.pivot.stage] = staff.pivot.completed_at || null;
        });
      }
      setStaffAssignments(newAssignments);
      setStaffCompletions(newCompletions);

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

  const handleUpdateStaff = async () => {
    if (!store) return;
    setSavingStaff(true);
    try {
      const assignments = Object.entries(staffAssignments)
        .filter(([, userId]) => userId)
        .map(([stage, userId]) => ({ stage, user_id: userId }));

      await api.post(`/stores/${store.id}/jobs/${jobId}/staff`, {
        assignments,
      });

      const res = await api.get(`/stores/${store.id}/jobs/${jobId}`);
      const data = res.data.data;
      setJob(data);

      const completions: Record<string, string | null> = emptyStageMap(null);
      if (data.staff_stages) {
        data.staff_stages.forEach((staff: { id: number; pivot: { stage: string; completed_at?: string } }) => {
          completions[staff.pivot.stage] = staff.pivot.completed_at || null;
        });
      }
      setStaffCompletions(completions);
      toast.success('Staff assigned successfully!');
    } catch (err: unknown) {
      console.error('Failed to update staff', err);
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update staff assignments.');
    } finally {
      setSavingStaff(false);
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
    isOutsourced,
    setIsOutsourced,
    partnerStoreName,
    setPartnerStoreName,
    outsourcingCost,
    setOutsourcingCost,
    allStaff,
    staffAssignments,
    setStaffAssignments,
    staffCompletions,
    savingStaff,
    handleUpdate,
    handleUpdateStaff,
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
