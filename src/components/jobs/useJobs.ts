import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { useBranch } from '@/context/BranchContext';
import { Job, Tab, columnsForJobs, getDueStatus, normalizeJobStatus } from './jobHelpers';
import type { Staff } from '@/components/staff/staffHelpers';

export function useJobs() {
  const { store, user } = useAuthStore();
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
  // silently undercount on any store with more than 200 total historical
  // job orders (old completed/cancelled ones included, nothing prunes
  // them). Same undercounting shape already fixed on the Home dashboard.
  const [walkInCount, setWalkInCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [designOriginFilter, setDesignOriginFilter] = useState<'all' | 'catalog' | 'custom' | 'alteration'>('all');
  // "My Assigned Jobs" — the backend's ?assigned_staff_id already worked,
  // this was just never wired to a toggle anywhere in the UI (staff's
  // missing piece, not the API's — see CLAUDE.md).
  const [myJobsOnly, setMyJobsOnly] = useState(searchParams.get('mine') === '1');

  // Review gate state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingJobId, setRejectingJobId] = useState<number | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  useEffect(() => {
    if (!store?.id) return;
    api.get(`/stores/${store.id}/staff`)
      .then((res) => {
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setStaffList(list.filter((s: Staff) => s.is_active !== false));
      })
      .catch((err) => {
        console.warn('Could not load staff directory for jobs:', err);
      });
  }, [store?.id]);

  // `silent` keeps the board on screen while it re-syncs: the skeleton swaps
  // out the whole board (flicker, lost scroll), so it's only for a first load
  // or a branch / "my jobs" switch where the old cards are wrong anyway.
  const fetchJobs = ({ silent = false }: { silent?: boolean } = {}) => {
    if (store) {
      const timer = silent ? undefined : setTimeout(() => setLoading(true), 0);
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
      // `mine` = jobs I hold or have moved through a production stage (server-side).
      if (myJobsOnly) {
        params.mine = 1;
      }
      api.get(`/stores/${store.id}/jobs`, { params })
        .then(res => {
          const list = Array.isArray(res.data?.data?.data)
            ? res.data.data.data
            : (Array.isArray(res.data?.data) ? res.data.data : []);
          setJobs(list);
          setWalkInCount(res.data?.walk_in_count ?? 0);
          setOnlineCount(res.data?.online_count ?? 0);
          setPendingReviewCount(res.data?.pending_count ?? 0);
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
  }, [store, user, selectedBranchId, myJobsOnly]);

  // Debounced re-fetch when the search term changes, so typing doesn't fire
  // a request per keystroke — the branch/store effect above still runs
  // immediately since those change far less often (a dropdown pick, not
  // continuous typing).
  useEffect(() => {
    const timer = setTimeout(() => { fetchJobs({ silent: true }); }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Optimistic card moves: the card changes column at once, the save runs in
  // the background with a small spinner on that card only, and the server's
  // copy of the job replaces it when it answers. No board-wide refetch; on
  // failure only that card goes back.
  const patchJob = (jobId: number, patch: Partial<Job>) =>
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, ...patch } : j)));
  const restoreJob = (previous: Job) =>
    setJobs((prev) => prev.map((j) => (j.id === previous.id ? previous : j)));
  const applyServerJob = (jobId: number, data: unknown) => {
    if (data && typeof data === 'object' && (data as Job).id === jobId) patchJob(jobId, data as Partial<Job>);
  };

  const updateJobStatus = async (jobId: number, newStatus: string, reason?: string) => {
    if (!store) return;
    const jobToUpdate = jobs.find(j => j.id === jobId);
    if (!jobToUpdate) return;
    // updated_at now: the card lands at the top of its new column (columns sort newest first).
    patchJob(jobId, { status: newStatus, updated_at: new Date().toISOString() });
    setActionLoadingId(jobId);
    try {
      const res = await api.put(`/stores/${store.id}/jobs/${jobId}`, {
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
      applyServerJob(jobId, res.data?.data);
      toast.success('Job status updated successfully.');
    } catch (err) {
      console.error('Failed to update status', err);
      restoreJob(jobToUpdate);
      // Surfaces server-side gate messages (e.g. the DP gate, or the fitting
      // limit's 'block' policy) instead of a generic failure — those are
      // real, actionable reasons the update didn't go through, not just an
      // unexpected error.
      const message = axios.isAxiosError(err) ? err.response?.data?.message : null;
      toast.error(message || 'Failed to update status.');
    } finally {
      setActionLoadingId((id) => (id === jobId ? null : id));
    }
  };

  const assignStaff = async (jobId: number, staffUserId: number | null) => {
    if (!store) return;
    try {
      const res = await api.put(`/stores/${store.id}/jobs/${jobId}`, {
        assigned_staff_id: staffUserId,
        assigned_to: staffUserId,
      });
      applyServerJob(jobId, res.data?.data);
      const staffMember = staffList.find(
        (s) => (s.user_id ?? s.user?.id) === staffUserId
      );
      const name = staffMember?.user?.name;
      toast.success(
        staffUserId && name
          ? `Order assigned to ${name}.`
          : staffUserId
          ? 'Tailor assigned to order.'
          : 'Staff assignment removed.'
      );
    } catch (err: unknown) {
      console.error('Failed to assign staff', err);
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update staff assignment.');
    }
  };

  const handleApproveJob = async (jobId: number) => {
    if (!store) return;
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    setActionLoadingId(jobId);
    // Moves a pending job straight into 'production'
    patchJob(jobId, { status: 'production', updated_at: new Date().toISOString() });
    try {
      let res;
      try {
        res = await api.post(`/stores/${store.id}/jobs/${jobId}/approve`);
      } catch {
        // Fallback to PUT status update if needed
        res = await api.put(`/stores/${store.id}/jobs/${jobId}`, { status: 'production', payment_status: job.payment_status, balance: job.balance });
      }
      applyServerJob(jobId, res.data?.data);
      setPendingReviewCount((n) => Math.max(0, n - 1));
      toast.success('Job order approved into production.');
    } catch (err: unknown) {
      restoreJob(job);
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
    if (!store || !rejectingJobId) return;
    const job = jobs.find(j => j.id === rejectingJobId);
    if (!job) return;
    setActionLoadingId(rejectingJobId);
    patchJob(rejectingJobId, { status: 'rejected', updated_at: new Date().toISOString() });
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
      const res = await api.post(`/stores/${store.id}/jobs/${rejectingJobId}/reject`, {
        reason: reason || 'No reason provided.',
      });
      applyServerJob(rejectingJobId, res.data?.data);
      setPendingReviewCount((n) => Math.max(0, n - 1));
      setRejectModalOpen(false);
      setRejectingJobId(null);
      toast.success('Job order rejected.');
    } catch (err: unknown) {
      restoreJob(job);
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
    const matchOrigin =
      designOriginFilter === 'all'
        ? true
        : designOriginFilter === 'catalog'
        ? Boolean((j as unknown as { catalog_item_id?: number }).catalog_item_id || j.catalog_item)
        : designOriginFilter === 'alteration'
        ? j.garment_category === 'alteration_repair'
        : (!((j as unknown as { catalog_item_id?: number }).catalog_item_id) && !j.catalog_item && j.garment_category !== 'alteration_repair');
    return matchType && matchSearch && matchOverdue && matchGarment && matchOrigin;
  });

  const catalogJobsCount = jobs.filter(j => Boolean((j as unknown as { catalog_item_id?: number }).catalog_item_id || j.catalog_item)).length;
  const customBespokeCount = jobs.filter(j => !((j as unknown as { catalog_item_id?: number }).catalog_item_id) && !j.catalog_item && j.garment_category !== 'alteration_repair').length;
  const alterationJobsCount = jobs.filter(j => j.garment_category === 'alteration_repair').length;

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
      .filter(j => normalizeJobStatus(j.status) === col.id)
      .sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime());
    return acc;
  }, {} as Record<string, Job[]>);

  // Kept separate from groupedJobs/activeColumns — on_hold is deliberately
  // excluded from those so it doesn't clutter active progression columns
  const onHoldJobs = filteredJobs
    .filter(j => normalizeJobStatus(j.status) === 'on_hold')
    .sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime());

  return {
    jobs,
    loading,
    search,
    setSearch,
    tab,
    setTab,
    myJobsOnly,
    setMyJobsOnly,
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
    designOriginFilter,
    setDesignOriginFilter,
    catalogJobsCount,
    customBespokeCount,
    alterationJobsCount,
    staffList,
    assignStaff,
  };
}
