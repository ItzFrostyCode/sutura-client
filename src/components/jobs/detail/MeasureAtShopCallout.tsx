'use client';

import React, { useState } from 'react';
import { CalendarPlus, Link2, Loader2, Ruler } from 'lucide-react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import RecordMeasurementModal from '@/components/measurements/RecordMeasurementModal';
import type { MeasurementRecord } from '@/components/measurements/measurementTypes';
import type { Job } from '../jobTypes';

const CLOSED_STATUSES = ['completed', 'cancelled', 'rejected'];

const BTN_PRIMARY = 'inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-taupe px-4 text-sm font-semibold text-white transition-colors hover:bg-taupe-hover disabled:opacity-50 cursor-pointer';
const BTN_SECONDARY = 'inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-line-strong bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:border-ink disabled:opacity-50 cursor-pointer';

/**
 * The customer picked "Have the shop measure me" on their online order. Until
 * measurements are on the order: book the visit, record the measurements here
 * (saved to the customer and attached to this order in one step), or attach a
 * profile staff already saved from the visit or the customer's page.
 */
export default function MeasureAtShopCallout({ job, onSchedule, onChanged }: Readonly<{
  job: Job;
  onSchedule?: () => void;
  onChanged?: () => void;
}>) {
  const { store } = useAuthStore();
  const toast = useToast();
  const [recording, setRecording] = useState(false);
  const [picking, setPicking] = useState(false);
  const [profiles, setProfiles] = useState<MeasurementRecord[] | null>(null);
  const [pickedId, setPickedId] = useState('');
  const [busy, setBusy] = useState(false);

  if (job.measurement_source !== 'shop' || job.measurement || CLOSED_STATUSES.includes(job.status)) return null;

  const customer = job.customer;
  const visit = job.measurement_visit;
  const when = visit
    ? new Date(visit.scheduled_at).toLocaleString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' })
    : null;

  const openPicker = async () => {
    if (!store || !customer) return;
    setPicking(true);
    setProfiles(null);
    try {
      const res = await api.get(`/stores/${store.id}/measurements`, { params: { customer_id: customer.id } });
      // Only each profile's current version.
      const current = ((res.data?.data ?? []) as MeasurementRecord[]).filter((m) => !m.superseded_at);
      setProfiles(current);
      setPickedId(current[0] ? String(current[0].id) : '');
    } catch (err) {
      setPicking(false);
      toast.error(getErrorMessage(err, "Couldn't load the customer's measurements."));
    }
  };

  const attach = async () => {
    if (!store || !pickedId) return;
    setBusy(true);
    try {
      await api.put(`/stores/${store.id}/jobs/${job.id}`, { measurement_id: Number(pickedId) });
      toast.success('Measurements attached to this order.');
      setPicking(false);
      onChanged?.();
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't attach the measurements."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="note" className="space-y-3 rounded-xl border border-taupe/30 bg-taupe/5 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-taupe text-white">
          <Ruler size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">Customer asked to be measured at the shop.</p>
          <p className="mt-0.5 text-xs text-ink-body">
            {visit
              ? <>Measurement visit {visit.status === 'completed' ? 'done' : 'booked'}: <strong className="font-semibold text-ink">{when}</strong>. Record the measurements here when they come in.</>
              : 'No measurements yet. Set a measurement visit, or record them now if the customer is here.'}
          </p>
        </div>
      </div>

      {!picking ? (
        <div className="flex flex-wrap gap-2 sm:pl-12">
          {!visit && onSchedule && (
            <button type="button" onClick={onSchedule} className={BTN_PRIMARY}>
              <CalendarPlus size={16} aria-hidden="true" /> Schedule visit
            </button>
          )}
          {customer && store && (
            <>
              <button type="button" onClick={() => setRecording(true)} className={visit ? BTN_PRIMARY : BTN_SECONDARY}>
                <Ruler size={16} aria-hidden="true" /> Record measurements
              </button>
              <button type="button" onClick={() => void openPicker()} className={BTN_SECONDARY}>
                <Link2 size={16} aria-hidden="true" /> Attach saved measurements
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2 rounded-lg border border-line bg-surface p-3 sm:ml-12">
          {profiles === null ? (
            <p className="flex items-center gap-2 text-xs text-ink-muted"><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Loading {customer?.name}&apos;s measurements…</p>
          ) : profiles.length === 0 ? (
            <p className="text-xs text-ink-muted">
              {customer?.name} has no saved measurements at this shop yet. Use <strong className="font-semibold text-ink">Record measurements</strong> instead.
            </p>
          ) : (
            <>
              <label htmlFor="attach-measurement" className="block text-xs font-semibold text-ink-body">Saved measurement profile</label>
              <select
                id="attach-measurement"
                value={pickedId}
                onChange={(e) => setPickedId(e.target.value)}
                className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-taupe focus:outline-none"
              >
                {profiles.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.profile_name} · version {m.version ?? 1} · {new Date(m.updated_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </option>
                ))}
              </select>
            </>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {profiles && profiles.length > 0 && (
              <button type="button" onClick={() => void attach()} disabled={busy || !pickedId} className={BTN_PRIMARY}>
                {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />} Attach to this order
              </button>
            )}
            <button type="button" onClick={() => setPicking(false)} className={BTN_SECONDARY}>Cancel</button>
          </div>
        </div>
      )}

      {customer && store && (
        <RecordMeasurementModal
          isOpen={recording}
          onClose={() => setRecording(false)}
          storeId={store.id}
          customer={{ id: customer.id, name: customer.name }}
          jobOrderId={job.id}
          onSaved={() => {
            toast.success('Measurements saved and attached to this order.');
            onChanged?.();
          }}
        />
      )}
    </div>
  );
}
