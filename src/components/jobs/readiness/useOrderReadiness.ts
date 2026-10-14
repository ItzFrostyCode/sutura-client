import { useCallback, useEffect, useState } from 'react';
import axios, { type AxiosResponse } from 'axios';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';
import type { Blocker, ReadinessData } from './readinessTypes';

interface RunOptions {
  /** Say this instead of the server's message (a plain status change returns none). */
  readonly message?: string;
  readonly quiet?: boolean;
}

/**
 * Loads an order's steps and wraps every action on it. Each action refreshes the checklist from the
 * server's answer, tells the parent page the job changed, and reports a refusal in plain words (the
 * server explains what is still missing). Moving between delivery stages is a normal status change;
 * a few actions chain two requests (record the result, then move) so it is one tap for the user.
 */
export function useOrderReadiness(storeId: number, jobId: number, onChanged: () => void, onStarted?: () => void) {
  const toast = useToast();
  const base = `/stores/${storeId}/jobs/${jobId}`;
  const [data, setData] = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [blockers, setBlockers] = useState<Blocker[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`${base}/readiness`);
      setData(res.data.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => { void load(); }, [load]);

  /** Returns true when the server accepted it. `blockers` holds what the server said is still missing. */
  const run = useCallback(async (key: string, call: () => Promise<AxiosResponse>, opts: RunOptions = {}): Promise<boolean> => {
    setBusy(key);
    setBlockers([]);
    try {
      const res = await call();
      if (res.data?.data?.checklist) setData(res.data.data);
      else await load();
      if (!opts.quiet) toast.success(opts.message ?? res.data?.message ?? 'Saved.');
      onChanged();
      return true;
    } catch (err) {
      if (axios.isAxiosError(err) && Array.isArray(err.response?.data?.blockers)) setBlockers(err.response?.data.blockers);
      toast.error(getErrorMessage(err, 'That did not go through.'));
      return false;
    } finally {
      setBusy(null);
    }
  }, [load, onChanged, toast]);

  const moveTo = useCallback((status: string, message?: string) => run('move', () => api.put(base, { status }), { message }), [base, run]);
  const post = useCallback((key: string, path: string, body?: Record<string, unknown>, opts?: RunOptions) => run(key, () => api.post(`${base}/${path}`, body), opts), [base, run]);

  const actions = {
    // Flow 2 -- set-up
    approveSpecs: () => post('specs', 'specs/approve'),
    verifyMeasurements: () => post('measurements', 'measurements/verify'),
    assessCustomerItems: (assessment: 'suitable' | 'not_suitable') => post('customer_items', 'customer-items', { assessment }),
    setMaterials: (state: 'ready' | 'waiting', note?: string) => post('materials', 'materials', { state, note: note || null }),
    approveInPerson: () => post('approval', 'quotation/approve', { accepted_terms: true }),
    confirm: () => post('confirmed', 'confirm'),
    saveQuotation: (body: Record<string, unknown>) => run('quotation', () => api.put(`${base}/quotation`, body)),
    saveAssignees: (assignees: { user_id: number; role: string }[]) => run('tailor', () => api.put(`${base}/assignees`, { assignees })),
    startProduction: async () => {
      const ok = await moveTo('design', 'Production started.');
      if (ok) onStarted?.();
      return ok;
    },

    // Flow 3 -- delivery
    moveTo,
    sendToQuality: () => moveTo('qc_ironing', 'Sent to Quality Check.'),
    passQuality: async () => (await post('qc', 'quality-check', { result: 'pass' }, { quiet: true })) && moveTo('ready_for_pickup', 'Quality check passed. The customer is told it is ready.'),
    failQuality: async (body: Record<string, unknown>) => (await post('qc', 'quality-check', { result: 'fail', ...body }, { quiet: true })) && moveTo('final_adjustments', 'Sent to Adjustment / Correction.'),
    fittingIssue: async (body: Record<string, unknown>) => (await post('correction', 'corrections', { kind: 'fitting_issue', ...body }, { quiet: true })) && moveTo('final_adjustments', 'Sent to Adjustment / Correction.'),
    addCorrection: (body: Record<string, unknown>) => post('correction', 'corrections', body),
    resolveCorrection: (id: number) => post('correction', `corrections/${id}/resolve`),
    cancelCorrection: (id: number) => post('correction', `corrections/${id}/cancel`),
    approveChange: (id: number, body: Record<string, unknown>) => post('correction', `corrections/${id}/approve`, { accepted: true, ...body }),
    recordHandover: async (body: Record<string, unknown>) => {
      const ok = await post('handover', 'handovers', body);
      if (!ok) return false;
      // Everything handed over and nothing left to correct: the order is complete.
      const res = await api.get(`${base}/readiness`).catch(() => null);
      const d = res?.data?.data as ReadinessData | undefined;
      if (d?.delivery && d.delivery.handover.remaining === 0 && d.delivery.open_corrections === 0) {
        return moveTo('completed', 'Order completed.');
      }
      return true;
    },
  };

  return { data, loading, busy, blockers, clearBlockers: () => setBlockers([]), reload: load, actions };
}

export type OrderReadinessApi = ReturnType<typeof useOrderReadiness>;
