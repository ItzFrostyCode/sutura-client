import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useBranch } from '@/context/BranchContext';
import { useToast } from '@/context/ToastContext';
import type { Job } from '../jobHelpers';

export type CompletedOrder = Job & {
  completed_at?: string | null;
  created_at?: string;
  discount_amount?: string | number | null;
  customer?: (NonNullable<Job['customer']> & { profile_picture?: string | null }) | null;
};

/** From the server's own counts (GET /completed-orders `stats`), never the paged list. */
export interface CompletedStats {
  total_completed: number;
  total_completed_trend: number | null;
  total_value: number;
  total_value_trend: number | null;
  completed_today: number;
  avg_handling_days: number | null;
}

export interface CompletedFilters {
  from: string;
  to: string;
  payment_status: '' | 'paid' | 'partial' | 'unpaid';
  intake_channel: '' | 'walk_in' | 'online';
}

export const EMPTY_FILTERS: CompletedFilters = { from: '', to: '', payment_status: '', intake_channel: '' };
export const PAGE_SIZE = 15;

// A blob error body is JSON text — read the server's message out of it.
async function errorText(err: unknown, fallback: string): Promise<string> {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  try {
    const text = data instanceof Blob ? await data.text() : JSON.stringify(data ?? {});
    return (JSON.parse(text) as { message?: string }).message ?? fallback;
  } catch { return fallback; }
}

export function useCompletedOrders() {
  const { store } = useAuthStore();
  const { selectedBranchId } = useBranch();
  const toast = useToast();

  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [stats, setStats] = useState<CompletedStats | null>(null);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<CompletedFilters>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // A new search, filter or branch starts again from page 1.
  useEffect(() => { setPage(1); }, [debouncedSearch, filters, selectedBranchId]);

  const params = useCallback(() => {
    const p: Record<string, string | number> = {};
    if (selectedBranchId !== null) p.branch_id = selectedBranchId;
    if (debouncedSearch) p.search = debouncedSearch;
    (Object.keys(filters) as (keyof CompletedFilters)[]).forEach((k) => { if (filters[k]) p[k] = filters[k]; });
    return p;
  }, [selectedBranchId, debouncedSearch, filters]);

  useEffect(() => {
    if (!store?.id) return;
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    api.get(`/stores/${store.id}/completed-orders`, { params: { ...params(), page, per_page: PAGE_SIZE } })
      .then((res) => {
        if (cancelled) return;
        const pageData = res.data?.data;
        setOrders(Array.isArray(pageData?.data) ? pageData.data : []);
        setTotal(pageData?.total ?? 0);
        setPageCount(Math.max(1, pageData?.last_page ?? 1));
        setStats(res.data?.stats ?? null);
      })
      .catch(() => { if (!cancelled) setFailed(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [store?.id, params, page]);

  const exportCsv = async () => {
    if (!store?.id) return;
    setExporting(true);
    try {
      const res = await api.get(`/stores/${store.id}/completed-orders/export`, { params: params(), responseType: 'blob' });
      const disposition = String((res.headers as Record<string, unknown>)['content-disposition'] ?? '');
      const name = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? 'completed-orders.csv';
      const url = URL.createObjectURL(res.data);
      const a = Object.assign(document.createElement('a'), { href: url, download: name });
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(await errorText(err, 'Could not prepare the export.'));
    } finally {
      setExporting(false);
    }
  };

  const activeFilterCount = (Object.keys(filters) as (keyof CompletedFilters)[]).filter((k) => filters[k]).length;

  return {
    orders, stats, total, pageCount, page, setPage,
    search, setSearch, filters, setFilters, activeFilterCount,
    loading, failed, exporting, exportCsv,
  };
}
