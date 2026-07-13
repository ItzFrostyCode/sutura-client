import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { useBranch } from '@/context/BranchContext';
import { Job, Tab, columnsForJobs } from './jobHelpers';

export function useJobs() {
  const { shop, user } = useAuthStore();
  const { selectedBranchId } = useBranch();
  const toast = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('all');

  // Review gate state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingJobId, setRejectingJobId] = useState<number | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchJobs = () => {
    if (shop) {
      const timer = setTimeout(() => setLoading(true), 0);
      const params: Record<string, string | number> = { per_page: 200 };
      if (selectedBranchId !== null) {
        params.branch_id = selectedBranchId;
      }
      api.get(`/shops/${shop.id}/jobs`, { params })
        .then(res => {
          setJobs(res.data.data.data || res.data.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
      return () => clearTimeout(timer);
    } else if (user) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }
  };

  useEffect(() => {
    const cleanup = fetchJobs();
    return () => {
      if (cleanup) cleanup();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop, user, selectedBranchId]);

  const updateJobStatus = async (jobId: number, newStatus: string) => {
    if (!shop) return;
    const oldJobs = [...jobs];
    setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
    try {
      const jobToUpdate = jobs.find(j => j.id === jobId);
      if (!jobToUpdate) return;
      await api.put(`/shops/${shop.id}/jobs/${jobId}`, {
        status: newStatus,
        payment_status: jobToUpdate.payment_status,
        balance: jobToUpdate.balance,
      });
      toast.success('Job status updated successfully.');
    } catch (err) {
      console.error('Failed to update status', err);
      setJobs(oldJobs);
      toast.error('Failed to update status.');
    }
  };

  const handleApproveJob = async (jobId: number) => {
    if (!shop) return;
    setActionLoadingId(jobId);
    const old = [...jobs];
    // Moves a pending job into 'design' — the first stage of the 3-Phase
    // Tailoring Tracker pipeline, exempt from the DP gate (no fabric/material
    // is committed yet). Approving no longer jumps straight to 'cutting',
    // which used to skip Design/Pattern Making (or Mass Cutting & Printing
    // for bulk orders) entirely.
    setJobs(jobs.map(j => j.id === jobId ? { ...j, status: 'design' } : j));
    try {
      const job = jobs.find(j => j.id === jobId);
      if (!job) return;
      await api.put(`/shops/${shop.id}/jobs/${jobId}`, { status: 'design', payment_status: job.payment_status, balance: job.balance });
      toast.success('Job order approved into production.');
    } catch (err: unknown) {
      setJobs(old);
      // Surface the backend's actual message (e.g. a validation error) rather
      // than a generic failure — 'design' itself is DP-gate-exempt, but the
      // request can still fail for other reasons (branch access, etc.).
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to approve order.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openRejectModal = (jobId: number) => {
    setRejectingJobId(jobId);
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (reason: string) => {
    if (!shop || !rejectingJobId) return;
    setActionLoadingId(rejectingJobId);
    const old = [...jobs];
    setJobs(jobs.map(j => j.id === rejectingJobId ? { ...j, status: 'cancelled' } : j));
    try {
      const job = jobs.find(j => j.id === rejectingJobId);
      if (!job) return;
      await api.put(`/shops/${shop.id}/jobs/${rejectingJobId}`, { 
        status: 'cancelled', 
        payment_status: job.payment_status, 
        balance: job.balance,
        rejection_reason: reason || null 
      });
      setRejectModalOpen(false);
      setRejectingJobId(null);
      toast.success('Job order rejected.');
    } catch (err: unknown) {
      setJobs(old);
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to reject order.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredJobs = jobs.filter(j => {
    const matchType = tab === 'all' || j.intake_channel === tab;
    const matchSearch = !search
      || j.order_number?.toLowerCase().includes(search.toLowerCase())
      || j.customer?.name?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  // Only shows whichever of Pattern Making / Mass Cutting & Printing is
  // actually relevant to the jobs currently on the board (bulk vs. standard
  // orders), instead of always showing both columns.
  const activeColumns = columnsForJobs(filteredJobs);

  // Sorted by most-recently-updated first within each column, so a job that
  // just moved into a stage (e.g. just marked Completed) surfaces at the top
  // instead of being buried under older cards that simply have an earlier
  // order_number/created_at. Without this, "Completed" ordered newest-created
  // rather than newest-completed, which two different columns don't agree on.
  const groupedJobs = activeColumns.reduce((acc, col) => {
    acc[col.id] = filteredJobs
      .filter(j => j.status === col.id)
      .sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime());
    return acc;
  }, {} as Record<string, Job[]>);

  const walkInCount = jobs.filter(j => j.intake_channel === 'walk_in').length;
  const onlineCount = jobs.filter(j => j.intake_channel === 'online').length;
  const pendingReviewCount = jobs.filter(j => j.status === 'pending').length;

  return {
    jobs,
    loading,
    search,
    setSearch,
    tab,
    setTab,
    rejectModalOpen,
    setRejectModalOpen,
    rejectingJobId,
    setRejectingJobId,
    actionLoadingId,
    updateJobStatus,
    handleApproveJob,
    openRejectModal,
    handleConfirmReject,
    activeColumns,
    filteredJobs,
    groupedJobs,
    walkInCount,
    onlineCount,
    pendingReviewCount,
    fetchJobs,
  };
}
