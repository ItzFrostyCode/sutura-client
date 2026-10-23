import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useBranch } from '@/context/BranchContext';
import { useToast } from '@/context/ToastContext';
import { confirmDialog } from '@/store/useConfirmStore';
import { getErrorMessage } from '@/lib/apiError';
import type { Job } from '../jobHelpers';

/** An archived (soft-deleted) order as the list returns it. */
export type ArchivedJob = Job & { deleted_at: string; has_payments: boolean };

export function useArchivedOrders() {
  const { store } = useAuthStore();
  const { selectedBranchId } = useBranch();
  const toast = useToast();
  const [jobs, setJobs] = useState<ArchivedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    if (!store) return;
    setLoading(true);
    // The archive is small, so one page of 200 is fetched and searched here in the browser.
    const params: Record<string, string | number> = { trashed: 1, per_page: 200 };
    if (selectedBranchId !== null) params.branch_id = selectedBranchId;
    api.get(`/stores/${store.id}/jobs`, { params })
      .then((res) => {
        const raw = res.data?.data;
        setJobs(Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : []);
        setLoadError(false);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [store, selectedBranchId]);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) => [j.order_number, j.customer?.name, j.service?.name, j.catalog_item?.name]
      .some((v) => v?.toLowerCase().includes(q)));
  }, [jobs, search]);

  // Both actions ask first, call the server, then drop the row from the list.
  const act = async (job: ArchivedJob, ask: Parameters<typeof confirmDialog>[0], call: () => Promise<unknown>, done: string) => {
    if (!(await confirmDialog(ask))) return;
    setBusyId(job.id);
    try {
      await call();
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      toast.success(done);
    } catch (err) {
      toast.error(getErrorMessage(err, 'That did not go through. Try again.'));
    } finally {
      setBusyId(null);
    }
  };

  const restore = (job: ArchivedJob) => act(job, {
    title: `Restore ${job.order_number}?`,
    message: 'It goes back on the board where it was.',
    confirmLabel: 'Restore',
  }, () => api.post(`/stores/${store!.id}/jobs/${job.id}/restore`), 'Order restored.');

  const deleteForever = (job: ArchivedJob) => act(job, {
    title: `Delete ${job.order_number} permanently?`,
    message: 'This cannot be undone. The order, its steps and photos are removed for good.',
    confirmLabel: 'Delete permanently',
    danger: true,
  }, () => api.delete(`/stores/${store!.id}/jobs/${job.id}/permanent`), 'Order deleted permanently.');

  return { jobs, visible, loading, loadError, search, setSearch, busyId, load, restore, deleteForever };
}
