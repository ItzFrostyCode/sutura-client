'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import api from '@/lib/axios';
import { unitOfMetrics, type MeasureUnit } from '@/lib/measurementUnit';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/apiError';
import Modal from '@/components/Modal';
import Segmented from '@/components/shared/Segmented';
import { BTN, BTN_PRIMARY, PLAIN_FIELD, PLAIN_LABEL } from '@/components/shared/plainForm';
import AreaSelector from '@/components/measurements/recorder/AreaSelector';
import AreaGrid from '@/components/measurements/recorder/AreaGrid';
import PaperSheets from '@/components/measurements/recorder/PaperSheets';
import SavedProfileList from '../form/SavedProfileList';
import type { CustomerMeasurement } from '../form/types';
import { Job } from '../jobTypes';
import { useMeasurementColumns } from './useMeasurementColumns';

interface JobEditMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  storeId?: number;
  onSuccess: () => Promise<void>;
}

type Mode = 'record' | 'existing';

/**
 * Record a new measurement for the order, or link one the customer already has. Same pieces as the New Job Order form:
 * what is measured in one row (Top / Bottom / Top & Bottom), then one column of fields per part, stacked.
 */
export default function JobEditMeasurementModal({ isOpen, onClose, job, storeId, onSuccess }: JobEditMeasurementModalProps) {
  const toast = useToast();
  const customerId = job.customer?.id;
  const customerName = job.customer?.name || 'Customer';
  const cols = useMeasurementColumns(job.measurement);

  const [mode, setMode] = useState<Mode>('record');
  const [saving, setSaving] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<CustomerMeasurement[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [profileName, setProfileName] = useState(job.measurement?.profile_name || `${customerName}'s Profile`);
  const [notes, setNotes] = useState(job.measurement?.notes || '');
  const [photoUrls, setPhotoUrls] = useState<string[]>(job.measurement?.photo_urls || []);
  // The unit the numbers are kept in: the current profile's, else the shop's. Saved with the new version so a cm profile stays cm.
  const shopUnit = useAuthStore((st) => st.store?.default_measurement_unit);
  const recordUnit: MeasureUnit = job.measurement?.metrics?._unit ? unitOfMetrics(job.measurement.metrics) : shopUnit === 'cm' ? 'cm' : 'in';

  useEffect(() => {
    if (!job.measurement) return;
    setProfileName(job.measurement.profile_name || `${customerName}'s Profile`);
    setNotes(job.measurement.notes || '');
    setPhotoUrls(job.measurement.photo_urls || []);
  }, [job.measurement, customerName]);

  useEffect(() => {
    if (!isOpen || !storeId || !customerId) return;
    setLoadingProfiles(true);
    api.get(`/stores/${storeId}/measurements?customer_id=${customerId}`)
      .then((res) => {
        const list: CustomerMeasurement[] = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
        setSavedProfiles(list);
        setSelectedProfileId((cur) => cur || (list[0] ? String(list[0].id) : ''));
      })
      .catch(() => setSavedProfiles([]))
      .finally(() => setLoadingProfiles(false));
  }, [isOpen, storeId, customerId]);

  const save = async () => {
    if (!storeId) return;
    setSaving(true);
    try {
      if (mode === 'record') {
        const res = await api.post(`/stores/${storeId}/measurements`, {
          customer_id: customerId, service_id: job.service?.id ?? null, catalog_item_id: job.catalog_item?.id ?? null,
          profile_name: profileName || `${customerName}'s Profile`, metrics: { ...cols.metrics, _area: cols.area, _unit: recordUnit },
          photo_urls: photoUrls, notes: notes || null, source: 'store_owner', status: 'finalized',
        });
        const id = res.data?.data?.id;
        if (id) await api.put(`/stores/${storeId}/jobs/${job.id}`, { measurement_id: id });
        toast.success('Measurements saved and linked to the order.');
      } else {
        if (!selectedProfileId) { toast.error('Choose a saved measurement profile.'); return; }
        await api.put(`/stores/${storeId}/jobs/${job.id}`, { measurement_id: Number(selectedProfileId) });
        toast.success('Measurement profile linked to the order.');
      }
      await onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Could not update the measurements.'));
    } finally {
      setSaving(false);
    }
  };

  const showTop = cols.area !== 'bottom';
  const showBottom = cols.area !== 'top';
  const grid = (title: string, area: 'top' | 'bottom', c: typeof cols.top) => (
    <AreaGrid
      title={title} area={area} columns={c.columns} metrics={cols.metrics} unit={recordUnit}
      onMetricChange={cols.setMetric} onAddColumn={c.add} onRemoveColumn={c.remove} onRenameColumn={c.rename}
    />
  );

  return (
    <Modal
      isOpen={isOpen} onClose={onClose} maxWidth="max-w-[680px]"
      title={job.measurement ? 'Edit Garment Measurements' : 'Record or Link Measurements'}
      footer={(
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button type="button" onClick={onClose} className={BTN}>Cancel</button>
          <button type="button" onClick={save} disabled={saving || (mode === 'existing' && !selectedProfileId)} className={`${BTN_PRIMARY} disabled:opacity-50`}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            {mode === 'record' ? (job.measurement ? 'Update measurements' : 'Save and link to order') : 'Link profile to order'}
          </button>
        </div>
      )}
    >
      <div className="space-y-6">
        <p className="text-sm text-espresso/60">Order #{job.order_number} · {customerName}</p>

        <Segmented
          label="How to add the measurements" value={mode} onChange={setMode}
          options={[{ value: 'record', label: 'Record new' }, { value: 'existing', label: `Use a saved profile (${savedProfiles.length})` }]}
        />

        {mode === 'record' ? (
          <>
            <div>
              <label htmlFor="modal-profile-name" className={PLAIN_LABEL}>Profile name</label>
              <input id="modal-profile-name" type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder={`${customerName}'s Profile`} className={PLAIN_FIELD} />
            </div>
            <AreaSelector personName={profileName} selectedArea={cols.area} onSelectArea={cols.setArea} />
            {showTop && grid('Top Measurements', 'top', cols.top)}
            {showBottom && grid('Bottom Measurements', 'bottom', cols.bottom)}
            {storeId && <PaperSheets photoUrls={photoUrls} onChangePhotos={setPhotoUrls} storeId={storeId} />}
            <div>
              <label htmlFor="modal-fitter-notes" className={PLAIN_LABEL}>Fitter&apos;s notes (optional)</label>
              <textarea id="modal-fitter-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Specific adjustments, customer fit preferences, ease allowance…" className={`${PLAIN_FIELD} h-auto resize-y py-2.5`} />
            </div>
          </>
        ) : loadingProfiles ? (
          <p className="flex items-center justify-center gap-2 py-8 text-sm text-ink-muted"><Loader2 size={16} className="animate-spin" />Loading saved profiles…</p>
        ) : savedProfiles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-espresso/20 p-6 text-center text-sm text-ink-muted">
            <p>No saved measurement profiles for {customerName}.</p>
            <button type="button" onClick={() => setMode('record')} className="mt-2 inline-flex cursor-pointer items-center gap-1.5 font-medium text-espresso underline underline-offset-2"><Sparkles size={14} />Record new measurements now</button>
          </div>
        ) : (
          <SavedProfileList profiles={savedProfiles} selectedId={selectedProfileId} onSelect={setSelectedProfileId} />
        )}
      </div>
    </Modal>
  );
}
