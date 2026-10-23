import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useBranch } from '@/context/BranchContext';
import { useToast } from '@/context/ToastContext';
import { isLateBalance, getDueStatus, type Job } from '../jobHelpers';
import { getErrorMessage } from '@/lib/apiError';
import { shopStageOf, type ShopStageKey } from '../jobStage';

const CLOSED = ['cancelled', 'rejected'];

export type ViewMode = 'table' | 'board';
export type UrgencyFilter = 'all' | 'overdue' | 'due_soon' | 'rush';
export type PaymentFilter = 'all' | 'has_balance' | 'paid' | 'balance_late';
export type SortOption = 'due_date' | 'newest' | 'oldest' | 'customer' | 'order_number';

const VIEW_STORAGE_KEY = 'sutura_jobs_view_mode';

/**
 * Enhanced Jobs Board hook:
 * Handles dual view (table & board), comprehensive filtering (stage, urgency, payment, search, mine),
 * accurate sorting (due date priority for tailoring operations), and safe gated advances.
 */
export function useJobsBoard() {
  const { store } = useAuthStore();
  const { selectedBranchId } = useBranch();
  const toast = useToast();
  const params = useSearchParams();

  // Primary data state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  // A failed load must not look like "no orders": it says so and offers Try again.
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [mine, setMine] = useState(params.get('mine') === '1');
  const [showClosed, setShowClosed] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  // View mode: default to 'table' on desktop for fast operational scanning, remembered in localStorage
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(VIEW_STORAGE_KEY) as ViewMode | null;
      if (saved === 'table' || saved === 'board') return saved;
    }
    return 'table';
  });

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(VIEW_STORAGE_KEY, mode);
      } catch {
        // Ignore localStorage errors
      }
    }
  };

  // Operational filters
  const [stageFilter, setStageFilter] = useState<ShopStageKey | 'all'>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>(
    params.get('overdue') === 'true' ? 'overdue' : 'all'
  );
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('due_date');

  // Deep links from Home: ?stage=qc_ironing (a status), ?overdue=true, ?garment_category=barong
  const statusFilter = params.get('stage');
  const overdueOnly = params.get('overdue') === 'true';
  const garment = params.get('garment_category');

  const fetchJobs = useCallback(() => {
    if (!store) return;
    const query: Record<string, string | number> = { per_page: 200 };
    if (selectedBranchId !== null) query.branch_id = selectedBranchId;
    if (search.trim()) query.search = search.trim();
    if (mine) query.mine = 1;

    api.get(`/stores/${store.id}/jobs`, { params: query })
      .then((res) => { setJobs(Array.isArray(res.data?.data?.data) ? res.data.data.data : Array.isArray(res.data?.data) ? res.data.data : []); setLoadError(false); })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [store, selectedBranchId, search, mine]);

  useEffect(() => {
    const t = setTimeout(fetchJobs, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchJobs, search]);

  // Stage counts computed across all non-closed orders for filter pills
  const stageCounts = useMemo(() => {
    const counts: Record<ShopStageKey | 'all' | 'closed', number> = {
      all: 0,
      request: 0,
      confirmed: 0,
      making: 0,
      ready: 0,
      done: 0,
      closed: 0,
    };

    for (const j of jobs) {
      if (CLOSED.includes(j.status)) {
        counts.closed++;
        continue;
      }
      counts.all++;
      const stage = shopStageOf(j);
      if (stage) counts[stage]++;
    }

    return counts;
  }, [jobs]);

  // Urgency counts for quick filters
  const urgencyCounts = useMemo(() => {
    let overdue = 0;
    let dueSoon = 0;
    let rush = 0;

    for (const j of jobs) {
      if (CLOSED.includes(j.status) || j.status === 'completed') continue;
      const due = getDueStatus(j.due_date, j.status);
      if (due?.label === 'Overdue') overdue++;
      if (due?.label === 'Due Soon') dueSoon++;
      if (j.is_rush) rush++;
    }

    return { overdue, dueSoon, rush };
  }, [jobs]);

  // Filtered & sorted job list
  const visible = useMemo(() => {
    let list = jobs.filter((j) => {
      // Direct deep link query filters
      if (statusFilter && j.status !== statusFilter) return false;
      if (overdueOnly && getDueStatus(j.due_date, j.status)?.label !== 'Overdue') return false;
      if (garment && j.garment_category !== garment) return false;

      const isClosed = CLOSED.includes(j.status);
      if (isClosed && !showClosed) return false;
      if (!isClosed && showClosed) return false;

      // Stage filter
      if (stageFilter !== 'all') {
        const stage = shopStageOf(j);
        if (stage !== stageFilter) return false;
      }

      // Urgency filter
      if (urgencyFilter === 'overdue' && getDueStatus(j.due_date, j.status)?.label !== 'Overdue') return false;
      if (urgencyFilter === 'due_soon' && getDueStatus(j.due_date, j.status)?.label !== 'Due Soon') return false;
      if (urgencyFilter === 'rush' && !j.is_rush) return false;

      // Payment filter
      if (paymentFilter === 'has_balance') {
        const bal = Number.parseFloat(String(j.balance)) || 0;
        if (bal <= 0 || j.payment_status === 'paid') return false;
      }
      if (paymentFilter === 'balance_late' && !isLateBalance(j)) return false;
      if (paymentFilter === 'paid') {
        const bal = Number.parseFloat(String(j.balance)) || 0;
        if (bal > 0 && j.payment_status !== 'paid') return false;
      }

      return true;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      if (sortBy === 'due_date') {
        // Overdue & earliest due dates on top; orders without due date at bottom
        if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
        if (a.due_date && !b.due_date) return -1;
        if (!a.due_date && b.due_date) return 1;
        return (b.created_at ?? '').localeCompare(a.created_at ?? '');
      }
      if (sortBy === 'newest') {
        return (b.created_at ?? '').localeCompare(a.created_at ?? '') || b.id - a.id;
      }
      if (sortBy === 'oldest') {
        return (a.created_at ?? '').localeCompare(b.created_at ?? '') || a.id - b.id;
      }
      if (sortBy === 'customer') {
        return (a.customer?.name ?? '').localeCompare(b.customer?.name ?? '');
      }
      if (sortBy === 'order_number') {
        return (b.order_number ?? '').localeCompare(a.order_number ?? '');
      }
      return 0;
    });

    return list;
  }, [jobs, statusFilter, overdueOnly, garment, showClosed, stageFilter, urgencyFilter, paymentFilter, sortBy]);

  // Grouped by stage for Kanban view
  const byStage = useMemo(() => {
    const out: Record<ShopStageKey, Job[]> = { request: [], confirmed: [], making: [], ready: [], done: [] };
    for (const j of visible) {
      const stage = shopStageOf(j);
      if (stage) out[stage].push(j);
    }
    // Oldest first in lanes so whoever came first is on top; Done has newest on top
    const byAge = (a: Job, b: Job) => (a.created_at ?? '').localeCompare(b.created_at ?? '') || a.id - b.id;
    (['request', 'confirmed', 'making', 'ready'] as const).forEach((k) => out[k].sort(byAge));
    out.done.sort((a, b) => byAge(b, a));
    return out;
  }, [visible]);

  const closed = useMemo(() => jobs.filter((j) => CLOSED.includes(j.status)), [jobs]);

  /** Next: the order moves one step along the production line, at once. The server owns the rules (deposit, gates) and says why when it refuses. */
  const advance = async (job: Job) => {
    if (!store) return;
    setBusyId(job.id);
    try {
      const res = await api.post(`/stores/${store.id}/jobs/${job.id}/production/next`);
      toast.success(`${job.order_number ?? 'Order'}: ${res.data?.message ?? 'moved to the next step.'}`);
      fetchJobs();
    } catch (err) {
      toast.error(getErrorMessage(err, 'That move is not allowed right now.'));
    } finally {
      setBusyId(null);
    }
  };

  /** A one-tap status move from a card (Start fitting, Complete). The server owns the rules and says why when it refuses. */
  const moveTo = async (job: Job, status: string, message: string) => {
    if (!store) return;
    setBusyId(job.id);
    try {
      await api.put(`/stores/${store.id}/jobs/${job.id}`, { status });
      toast.success(`${job.order_number ?? 'Order'}: ${message}`);
      fetchJobs();
    } catch (err) {
      toast.error(getErrorMessage(err, 'That move is not allowed right now.'));
    } finally {
      setBusyId(null);
    }
  };

  const decline = async (jobId: number, reason: string) => {
    if (!store) return;
    setBusyId(jobId);
    try {
      await api.post(`/stores/${store.id}/jobs/${jobId}/reject`, { reason });
      toast.success('Order declined. The customer was notified.');
      fetchJobs();
    } catch (err) {
      toast.error((axios.isAxiosError(err) && err.response?.data?.message) || 'Could not decline this order.');
    } finally {
      setBusyId(null);
    }
  };

  const resetFilters = () => {
    setStageFilter('all');
    setUrgencyFilter('all');
    setPaymentFilter('all');
    setSearch('');
    setMine(false);
    setShowClosed(false);
  };

  const hasActiveFilters = Boolean(
    stageFilter !== 'all' ||
    urgencyFilter !== 'all' ||
    paymentFilter !== 'all' ||
    search.trim() !== '' ||
    mine ||
    showClosed ||
    statusFilter ||
    overdueOnly ||
    garment
  );

  return {
    store,
    jobs,
    visible,
    loading,
    loadError,
    search,
    setSearch,
    mine,
    setMine,
    showClosed,
    setShowClosed,
    busyId,
    viewMode,
    setViewMode,
    stageFilter,
    setStageFilter,
    urgencyFilter,
    setUrgencyFilter,
    paymentFilter,
    setPaymentFilter,
    sortBy,
    setSortBy,
    stageCounts,
    urgencyCounts,
    byStage,
    closed,
    advance,
    moveTo,
    decline,
    refetch: fetchJobs,
    resetFilters,
    hasActiveFilters,
    statusFilter,
    overdueOnly,
    garment,
  };
}
