import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useLiveRefresh } from '@/lib/liveUpdates';

export interface StaffQueueJob {
  id: number; order_number: string; customer: string | null; what: string | null; status: string;
  due_date: string | null; is_rush: boolean; is_mine: boolean; urgent: boolean;
}
export interface StaffFitting { id: number; customer: string | null; order_number: string | null; scheduled_at: string; status: string; is_mine: boolean }
export interface StaffOverview {
  orders_in_production: number; quality_checks_needed: number; pending_fittings: number; my_jobs: number;
  queue: StaffQueueJob[]; fittings: StaffFitting[];
}

// The staff Home's numbers. Counts come straight from the server (own queries, never the capped
// queue list) and refresh whenever the tab regains focus.
export function useStaffOverview(storeId: number | undefined) {
  const [data, setData] = useState<StaffOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    if (!storeId) return;
    api.get(`/stores/${storeId}/staff-overview`)
      .then((res) => { setData(res.data?.data ?? null); setFailed(false); })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [storeId]);

  useEffect(() => { load(); }, [load]);
  // Refreshes on new activity, on returning to the tab, and every 30s while visible.
  useLiveRefresh(['jobs', 'appointments'], load);

  return { data, loading, failed, reload: load };
}
