import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useBranch } from '@/context/BranchContext';
import { useToast } from '@/context/ToastContext';
import { getDueStatus, type Job } from '../jobHelpers';
import { shopStageOf, type ShopStageKey } from '../jobStage';

const CLOSED = ['cancelled', 'rejected'];

/** Orders for the board: fetched once per branch, grouped into the five stages, oldest first (first come, first served). */
export function useJobsBoard() {
  const { store } = useAuthStore();
  const { selectedBranchId } = useBranch();
  const toast = useToast();
  const params = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mine, setMine] = useState(params.get('mine') === '1');
  const [showClosed, setShowClosed] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
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
      .then((res) => setJobs(Array.isArray(res.data?.data?.data) ? res.data.data.data : Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [store, selectedBranchId, search, mine]);

  useEffect(() => {
    const t = setTimeout(fetchJobs, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchJobs, search]);

  const visible = useMemo(() => jobs.filter((j) => (
    (!statusFilter || j.status === statusFilter)
    && (!overdueOnly || getDueStatus(j.due_date, j.status)?.label === 'Overdue')
    && (!garment || j.garment_category === garment)
  )), [jobs, statusFilter, overdueOnly, garment]);

  const byStage = useMemo(() => {
    const out: Record<ShopStageKey, Job[]> = { request: [], confirmed: [], making: [], ready: [], done: [] };
    for (const j of visible) {
      const stage = shopStageOf(j);
      if (stage) out[stage].push(j);
    }
    // Oldest first, so whoever came first is on top. Finished orders show the latest first.
    const byAge = (a: Job, b: Job) => (a.created_at ?? '').localeCompare(b.created_at ?? '') || a.id - b.id;
    (['request', 'confirmed', 'making', 'ready'] as const).forEach((k) => out[k].sort(byAge));
    out.done.sort((a, b) => byAge(b, a));
    return out;
  }, [visible]);

  const closed = useMemo(() => visible.filter((j) => CLOSED.includes(j.status)), [visible]);

  /** Moves an order to its next task; the server decides if it is allowed and says why not. */
  const advance = async (job: Job, status: string) => {
    if (!store) return;
    setBusyId(job.id);
    try {
      await api.put(`/stores/${store.id}/jobs/${job.id}`, { status });
      fetchJobs();
    } catch (err) {
      toast.error((axios.isAxiosError(err) && err.response?.data?.message) || 'That did not go through.');
    } finally {
      setBusyId(null);
    }
  };

  const decline = async (jobId: number, reason: string) => {
    if (!store) return;
    setBusyId(jobId);
    try {
      await api.post(`/stores/${store.id}/jobs/${jobId}/reject`, { reason });
      toast.success('Order declined. The customer was told.');
      fetchJobs();
    } catch (err) {
      toast.error((axios.isAxiosError(err) && err.response?.data?.message) || 'Could not decline this order.');
    } finally {
      setBusyId(null);
    }
  };

  return {
    store, jobs, loading, search, setSearch, mine, setMine, showClosed, setShowClosed, busyId,
    byStage, closed, advance, decline, refetch: fetchJobs, statusFilter, overdueOnly, garment,
  };
}
