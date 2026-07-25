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

export function useJobDetail(jobId: string) {
  const { shop } = useAuthStore();
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
  const [balance, setBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [completionPhotoUrl, setCompletionPhotoUrl] = useState('');

  // Outsourcing
  const [isOutsourced, setIsOutsourced] = useState(false);
  const [partnerShopName, setPartnerShopName] = useState('');
  const [outsourcingCost, setOutsourcingCost] = useState('');

  // Staff Assignment
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [staffAssignments, setStaffAssignments] = useState<Record<string, string>>(emptyStageMap(''));
  const [staffCompletions, setStaffCompletions] = useState<Record<string, string | null>>(emptyStageMap(null));
  const [savingStaff, setSavingStaff] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (shop && jobId) {
      timer = setTimeout(() => setLoading(true), 0);
      // Fetch Job Details
      api.get(`/shops/${shop.id}/jobs/${jobId}`)
        .then(res => {
          const data = res.data.data;
          setJob(data);
          setStatus(data.status);
          setPaymentStatus(data.payment_status);
          setBalance(data.balance);
          setNotes(data.notes || '');
          setCompletionPhotoUrl(data.completion_photo_url || '');
          setIsOutsourced(data.is_outsourced || false);
          setPartnerShopName(data.partner_shop_name || '');
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
      api.get(`/shops/${shop.id}/staff`)
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
  }, [shop, jobId]);

  // Re-fetches the job and swaps in the fresh copy — used after a side
  // action that mutates the job server-side outside handleUpdate's own PUT
  // (e.g. appending a progress photo), so the page reflects it without a
  // full reload.
  const refreshJob = async () => {
    if (!shop) return;
    try {
      const res = await api.get(`/shops/${shop.id}/jobs/${jobId}`);
      setJob(res.data.data);
    } catch (err) {
      console.error('Failed to refresh job', err);
    }
  };

  const handleUpdate = async () => {
    if (!shop) return;
    setSaving(true);

    try {
      await api.put(`/shops/${shop.id}/jobs/${jobId}`, {
        status,
        payment_status: paymentStatus,
        balance: Number.parseFloat(balance),
        notes,
        is_outsourced: isOutsourced,
        partner_shop_name: isOutsourced ? partnerShopName : null,
        outsourcing_cost: isOutsourced && outsourcingCost ? Number.parseFloat(outsourcingCost) : null,
        completion_photo_url: completionPhotoUrl || null,
        cancellation_reason: status === 'cancelled' ? cancellationReason : undefined,
        hold_reason: status === 'on_hold' ? holdReason : undefined,
      });
      // Refresh
      const res = await api.get(`/shops/${shop.id}/jobs/${jobId}`);
      const data = res.data.data;
      setJob(data);
      setStatus(data.status);
      setPaymentStatus(data.payment_status);
      setCompletionPhotoUrl(data.completion_photo_url || '');
      toast.success('Job details updated successfully.');
    } catch (err: unknown) {
      console.error('Failed to update', err);
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update details.');
      // The Production Timeline renders off this local `status` state
      // optimistically as soon as the owner picks a new phase — if the save
      // was rejected (e.g. balance not paid), it has to snap back to the
      // last confirmed server value instead of showing a phase that never
      // actually took effect until the next reload.
      if (job) {
        setStatus(job.status);
        setPaymentStatus(job.payment_status);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStaff = async () => {
    if (!shop) return;
    setSavingStaff(true);
    try {
      const assignments = Object.entries(staffAssignments)
        .filter(([, userId]) => userId) // only non-empty
        .map(([stage, userId]) => ({ stage, user_id: userId }));

      await api.post(`/shops/${shop.id}/jobs/${jobId}/staff`, {
        assignments
      });
      
      const res = await api.get(`/shops/${shop.id}/jobs/${jobId}`);
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

  const handleChargePayment = async (amount: number, method: string, notesVal: string, reference?: string) => {
    if (!shop || !job) return;
    setSaving(true);
    try {
      await api.post(`/shops/${shop.id}/jobs/${job.id}/pay`, {
        amount,
        payment_method: method,
        reference: reference || undefined,
        notes: notesVal || undefined
      });
      const res = await api.get(`/shops/${shop.id}/jobs/${job.id}`);
      const updatedJob = res.data.data;
      setJob(updatedJob);
      setBalance(updatedJob.balance);
      setPaymentStatus(updatedJob.payment_status);

      // A payment below the 50% downpayment threshold is still valid (it
      // counts toward it), but saying just "logged successfully" reads as
      // if the shop's downpayment policy has been satisfied — so call out
      // the remaining shortfall instead of leaving that unqualified.
      const totalAmt = Number.parseFloat(String(updatedJob.total_amount)) || 0;
      const paidSoFar = totalAmt - (Number.parseFloat(String(updatedJob.balance)) || 0);
      const requiredDp = totalAmt * 0.5;
      if (paidSoFar < requiredDp) {
        toast.success(`₱${amount.toFixed(2)} payment logged. ₱${(requiredDp - paidSoFar).toFixed(2)} more is needed to reach the required 50% downpayment.`);
      } else {
        toast.success(`₱${amount.toFixed(2)} payment logged successfully!`);
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
    if (!shop || !job) return;
    setSaving(true);
    try {
      await api.post(`/shops/${shop.id}/jobs/${job.id}/discount`, {
        amount,
        reason: reason || undefined,
      });
      const res = await api.get(`/shops/${shop.id}/jobs/${job.id}`);
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
    if (!shop || !job) return;
    setSaving(true);
    try {
      await api.put(`/shops/${shop.id}/jobs/${job.id}/payments/${paymentId}`, {
        payment_method: fields.payment_method,
        reference: fields.reference || undefined,
        notes: fields.notes || undefined,
        receipt_path: fields.receipt_path || undefined,
      });
      const res = await api.get(`/shops/${shop.id}/jobs/${job.id}`);
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
    if (!shop || !job) return;
    setSaving(true);
    try {
      await api.post(`/shops/${shop.id}/jobs/${job.id}/payments/${paymentId}/reject`, {
        reason,
      });
      const res = await api.get(`/shops/${shop.id}/jobs/${job.id}`);
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
  // (feasibility/capacity/fabric availability), gated shop_owner/branch_manager
  // server-side, only valid while status is still 'pending'.
  const handleRejectOrder = async (reason: string) => {
    if (!shop || !job) return;
    setSaving(true);
    try {
      await api.post(`/shops/${shop.id}/jobs/${job.id}/reject`, { reason });
      const res = await api.get(`/shops/${shop.id}/jobs/${job.id}`);
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

  const handleDelete = async () => {
    if (!shop || !job) return;
    setIsDeleting(true);
    try {
      await api.delete(`/shops/${shop.id}/jobs/${job.id}`);
      toast.success('Job order deleted successfully.');
      router.push('/dashboard/jobs');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to delete job order.');
      setIsDeleting(false);
    }
  };

  return {
    shop,
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
    isOutsourced,
    setIsOutsourced,
    partnerShopName,
    setPartnerShopName,
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
    cancellationReason,
    setCancellationReason,
    holdReason,
    setHoldReason,
    refreshJob,
    handleDelete,
  };
}
