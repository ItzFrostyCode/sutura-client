import { depositFraction, paymentPolicyLabel } from './requirements';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { confirmDialog } from '@/store/useConfirmStore';
import { getErrorMessage } from '@/lib/apiError';
import { useShopRole } from '@/hooks/useShopRole';
import { Job, GarmentSpecTable, CustomizationInstruction } from './jobTypes';

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
  const { isOwnerOrManager } = useShopRole();
  
  const [job, setJob] = useState<Job | null>(null);
  // The job as last rendered, so a refresh can tell an untouched form field from a draft the person typed.
  const jobRef = useRef<Job | null>(null);
  jobRef.current = job;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Editable fields
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
      const fresh = res.data.data;
      const prev = jobRef.current;
      setJob(fresh);
      // The status is never a draft: it moves only through the instant actions (Next, Back, Hold...), so it always follows the server.
      // Payment status and balance follow it too, unless the person has an unsaved draft of that field.
      setPaymentStatus((cur) => (prev && cur !== prev.payment_status ? cur : fresh.payment_status));
      setBalance((cur) => (prev && String(cur) !== String(prev.balance) ? cur : fresh.balance));
    } catch (err) {
      console.error('Failed to refresh job', err);
    }
  };

  // Practical Dirty Checking: track exactly which tab and fields have unsaved modifications
  const dirtyTabs = {
    overview: Boolean(job && notes !== (job.notes || '')),
    production: Boolean(
      job && (
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
      // Persist the drafts: notes, completion photo, ETA, customer material status. The status is not one of them.
      // Plain staff save only production notes and the completion photo; the server refuses anything else.
      await api.put(`/stores/${store.id}/jobs/${jobId}`, isOwnerOrManager ? {
        payment_status: paymentStatus,
        balance: Number.parseFloat(String(balance || 0)),
        notes,
        completion_photo_url: completionPhotoUrl || null,
        estimated_ready_at: estimatedReadyAt || null,
        customer_material_status: customerMaterialStatus || null,
      } : {
        notes,
        completion_photo_url: completionPhotoUrl || null,
      });

      const res = await api.get(`/stores/${store.id}/jobs/${jobId}`);
      const data = res.data.data;
      setJob(data);
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
      if (job) setPaymentStatus(job.payment_status);
    } finally {
      setSaving(false);
    }
  };

  const handleChargePayment = async (amount: number, method: string, notesVal: string, reference?: string, receiptPath?: string, cashTendered?: number): Promise<number | undefined> => {
    if (!store || !job) return undefined;
    setSaving(true);
    try {
      const payRes = await api.post(`/stores/${store.id}/jobs/${job.id}/pay`, {
        amount,
        payment_method: method,
        reference: reference || undefined,
        notes: notesVal || undefined,
        receipt_path: receiptPath || undefined,
        cash_tendered: cashTendered,
      });
      const res = await api.get(`/stores/${store.id}/jobs/${job.id}`);
      const updatedJob = res.data.data;
      setJob(updatedJob);
      setBalance(updatedJob.balance);
      setPaymentStatus(updatedJob.payment_status);

      if (method !== 'cash') {
        // Doesn't touch the balance until verified — say so plainly instead
        // of implying the payment already counted.
        toast.success(`₱${amount.toFixed(2)} payment submitted — pending verification before it applies to the balance.`);
      } else {
        // A payment below the 50% downpayment threshold is still valid (it
        // counts toward it), but saying just "logged successfully" reads as
        // if the store's downpayment policy has been satisfied — so call out
        // the remaining shortfall instead of leaving that unqualified.
        const totalAmt = Number.parseFloat(String(updatedJob.total_amount)) || 0;
        const paidSoFar = totalAmt - (Number.parseFloat(String(updatedJob.balance)) || 0);
        const requiredDp = totalAmt * depositFraction(updatedJob.payment_policy, updatedJob.payment_policy_percent);
        if (paidSoFar < requiredDp) {
          toast.success(`₱${amount.toFixed(2)} payment logged. ₱${(requiredDp - paidSoFar).toFixed(2)} more is needed to reach the required ${paymentPolicyLabel(updatedJob.payment_policy, updatedJob.payment_policy_percent)}.`);
        } else {
          toast.success(`₱${amount.toFixed(2)} payment logged successfully!`);
        }
      }
      // Same reference number already used on another order — a possible
      // reused-screenshot scam. Doesn't block the payment (legitimate
      // reference collisions do happen), just flags it for a second look.
      if (payRes.data?.warning) {
        toast.info(payRes.data.warning);
      }
      // The newest payment on the refreshed job is the one just recorded (used to print its receipt).
      const ids = ((updatedJob.payments ?? []) as { id: number }[]).map((p) => p.id);
      return ids.length > 0 ? Math.max(...ids) : undefined;
    } catch(err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Payment failed');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Owner/branch-manager confirmation that a GCash/PayMaya payment actually
  // landed — only then does it apply to the balance (JobOrderController::
  // verifyPayment). Cash needs no equivalent since it auto-verifies at pay().
  const handleVerifyPayment = async (paymentId: number) => {
    if (!store || !job) return;
    try {
      await api.post(`/stores/${store.id}/jobs/${job.id}/payments/${paymentId}/verify`);
      const res = await api.get(`/stores/${store.id}/jobs/${job.id}`);
      const updatedJob = res.data.data;
      setJob(updatedJob);
      setBalance(updatedJob.balance);
      setPaymentStatus(updatedJob.payment_status);
      toast.success('Payment verified.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to verify payment.');
      throw err;
    }
  };

  // One-time, in-the-moment discount (e.g. a repeat customer) — reduces the
  // remaining balance directly and is logged to the audit trail server-side.
  const handleRemoveDiscount = async () => {
    if (!store || !job) return;
    setSaving(true);
    try {
      await api.delete(`/stores/${store.id}/jobs/${job.id}/discount`);
      const res = await api.get(`/stores/${store.id}/jobs/${job.id}`);
      const updatedJob = res.data.data;
      setJob(updatedJob);
      setBalance(updatedJob.balance);
      setPaymentStatus(updatedJob.payment_status);
      toast.success('Discount removed.');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to remove the discount.'));
    } finally {
      setSaving(false);
    }
  };

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

  const handleSaveSpecTable = async (specTable: GarmentSpecTable) => {
    if (!store || !job) return;
    setSaving(true);
    try {
      // A group order's table IS its team list: every person's row is written back whole, so their pieces, profile link
      // and extra columns are kept. A one-person order has no team list, and saving its table never makes one.
      const isTeam = Array.isArray(job.custom_order_data?.team_roster) && job.custom_order_data.team_roster.length > 0;
      const teamRoster = isTeam
        ? specTable.rows.map((row) => {
          const rest: Record<string, unknown> = { ...row };
          delete rest.id;
          delete rest.player_name;
          return { ...rest, name: String(row.player_name ?? row.name ?? ''), completed: Boolean(row.completed) };
        })
        : undefined;

      const res = await api.put(`/stores/${store.id}/jobs/${job.id}`, {
        custom_order_data: {
          spec_table: specTable,
          ...(teamRoster && teamRoster.length > 0 ? { team_roster: teamRoster } : {}),
        },
      });

      const updatedJob = res.data?.data || (await api.get(`/stores/${store.id}/jobs/${job.id}`)).data?.data;
      if (updatedJob) {
        setJob(updatedJob);
      }
      toast.success('Garment specifications updated successfully.');
    } catch (err: unknown) {
      console.error('Failed to save spec table', err);
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to save specification table.');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCustomizationInstructions = async (instructions: CustomizationInstruction[]) => {
    if (!store || !job) return;
    setSaving(true);
    try {
      const res = await api.put(`/stores/${store.id}/jobs/${job.id}`, {
        custom_order_data: {
          customization_instructions: instructions,
        },
      });

      const updatedJob = res.data?.data || (await api.get(`/stores/${store.id}/jobs/${job.id}`)).data?.data;
      if (updatedJob) {
        setJob(updatedJob);
      }
      toast.success('Customization instructions saved successfully.');
    } catch (err: unknown) {
      console.error('Failed to save customization instructions', err);
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to save customization instructions.');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Archive = the server's soft delete; the order can be restored (or deleted for good) from the Archived page.
  const handleArchive = async () => {
    if (!store || !job) return;
    const ok = await confirmDialog({
      title: `Archive ${job.order_number ?? 'this order'}?`,
      message: 'It leaves the board and the lists. You can restore it from Archived.',
      confirmLabel: 'Archive',
    });
    if (!ok) return;
    try {
      await api.delete(`/stores/${store.id}/jobs/${job.id}`);
      toast.success('Order archived.');
      router.push('/dashboard/jobs');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Could not archive this order.');
    }
  };

  return {
    store,
    router,
    job,
    loading,
    saving,
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
    handleVerifyPayment,
    handleApplyDiscount,
    handleRemoveDiscount,
    handleUpdatePayment,
    handleRejectPayment,
    handleRejectOrder,
    handleUseCurrentMeasurement,
    handleToggleRosterItem,
    handleSaveSpecTable,
    handleSaveCustomizationInstructions,
    refreshJob,
    handleArchive,
    hasUnsavedChanges,
    dirtyTabs,
    handleResetChanges,
  };
}
