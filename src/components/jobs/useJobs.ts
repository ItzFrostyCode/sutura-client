import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { useBranch } from '@/context/BranchContext';
import { Job, Tab, columnsForJobs, getDueStatus } from './jobHelpers';

export function useJobs() {
  const { shop, user } = useAuthStore();
  const { selectedBranchId } = useBranch();
  const toast = useToast();
  const searchParams = useSearchParams();
  // Deep-link from the Overdue Orders KPI card / the daily overdue-jobs
  // notification (see OverdueJobsNotification's action_url) — takes the
  // owner straight to the actual list instead of just a static count they'd
  // then have to go hunt for on the board themselves.
  const overdueOnly = searchParams.get('overdue') === 'true';
  // Same idea, from the Reports "Orders by Garment Category" chart — click a
  // bar (e.g. "Barong Tagalog: 3") to see exactly those 3 jobs, not just the count.
  const garmentCategoryFilter = searchParams.get('garment_category');
  const [jobs, setJobs] = useState<Job[]>([]);
  // From the backend's dedicated, unbounded counts — used to be re-derived
  // by filtering the (per_page=200-capped) `jobs` array itself, which would
  // silently undercount on any shop with more than 200 total historical
  // job orders (old completed/cancelled ones included, nothing prunes
  // them). Same undercounting shape already fixed on the Home dashboard.
  const [walkInCount, setWalkInCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
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
      // Backend-side now too (JobOrderController::index's own `search`
      // param) — the search box used to only ever filter the already-fetched
      // (per_page=200-capped) `jobs` array below, so a real order beyond
      // that window was simply invisible to search. Kept both: this fetch
      // guarantees nothing is missed, the client-side filter below still
      // gives instant feedback on each keystroke without waiting on it.
      if (search.trim()) {
        params.search = search.trim();
      }
      api.get(`/shops/${shop.id}/jobs`, { params })
        .then(res => {
          setJobs(res.data.data.data || res.data.data);
          setWalkInCount(res.data.walk_in_count ?? 0);
          setOnlineCount(res.data.online_count ?? 0);
          setPendingReviewCount(res.data.pending_count ?? 0);
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

  // Debounced re-fetch when the search term changes, so typing doesn't fire
  // a request per keystroke — the branch/shop effect above still runs
  // immediately since those change far less often (a dropdown pick, not
  // continuous typing).
  useEffect(() => {
    const timer = setTimeout(() => { fetchJobs(); }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const updateJobStatus = async (jobId: number, newStatus: string, reason?: string) => {
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
        // Backend requires cancellation_reason (an enum) whenever
        // status:'cancelled' — same class of bug as Reject: the Kanban
        // dropdown listed "Cancelled" as a plain option and sent nothing
        // else, so every attempt 422'd. Confirmed live before wiring in
        // CancellationReasonModal at the call site (JobKanbanBoard) — that
        // modal already existed and was wired into the Job Detail page's
        // own dropdown, just never into this one.
        ...(newStatus === 'cancelled' ? { cancellation_reason: reason || 'other' } : {}),
        // hold_reason is optional server-side (won't 422 without it), but
        // leaving it blank meant a held job showed no explanation anywhere
        // on the board even though the card display and staff view both
        // expect one — HoldReasonModal already existed for this too, same
        // gap as cancellation.
        ...(newStatus === 'on_hold' && reason ? { hold_reason: reason } : {}),
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
    setJobs(jobs.map(j => j.id === rejectingJobId ? { ...j, status: 'rejected' } : j));
    try {
      // Was calling the generic PUT /jobs/{id} with status:'cancelled' and a
      // 'rejection_reason' field — the backend's own update() deliberately
      // 422s any attempt to set status:'rejected' through it (a dedicated
      // reject endpoint exists precisely to keep pending-only + reason
      // required enforced in one place), and even the 'cancelled' path needs
      // 'cancellation_reason' (an enum) rather than the free-text
      // 'rejection_reason' this was sending. Confirmed live: every click
      // 422'd, so Reject never actually worked. POST .../reject is the real
      // endpoint — pending-only, free-text reason, sets status:'rejected'.
      await api.post(`/shops/${shop.id}/jobs/${rejectingJobId}/reject`, {
        reason: reason || 'No reason provided.',
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
    const matchOverdue = !overdueOnly || getDueStatus(j.due_date, j.status)?.label === 'Overdue';
    const matchGarment = !garmentCategoryFilter || j.garment_category === garmentCategoryFilter;
    return matchType && matchSearch && matchOverdue && matchGarment;
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

  // Kept separate from groupedJobs/activeColumns — on_hold is deliberately
  // excluded from those (see ON_HOLD_COLUMN in jobHelpers.tsx) so it doesn't
  // corrupt the sequential "A → B → C" production-flow banner text.
  const onHoldJobs = filteredJobs
    .filter(j => j.status === 'on_hold')
    .sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime());

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
    onHoldJobs,
    walkInCount,
    onlineCount,
    pendingReviewCount,
    fetchJobs,
    overdueOnly,
    garmentCategoryFilter,
  };
}
