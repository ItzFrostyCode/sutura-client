'use client';

import { unitOfMetrics, withUnit } from '@/lib/measurementUnit';
import React, { useState, useEffect } from 'react';
import { X, Ruler, Sparkles, Check, Loader2, History, AlertTriangle } from 'lucide-react';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/apiError';
import { Job } from '../jobTypes';
import AreaSelector, {
  type MeasurementAreaChoice,
} from '@/components/measurements/recorder/AreaSelector';
import AreaGrid from '@/components/measurements/recorder/AreaGrid';
import PaperSheets from '@/components/measurements/recorder/PaperSheets';

interface JobEditMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  storeId?: number;
  onSuccess: () => Promise<void>;
}

interface SavedProfile {
  id: number;
  profile_name: string;
  version: number;
  metrics: Record<string, string>;
  notes?: string;
  photo_urls?: string[];
  updated_at: string;
}

const DEFAULT_TOP_METRICS = ['Chest', 'Shoulder', 'Sleeve', 'Neck', 'Shirt Length'];
const DEFAULT_BOTTOM_METRICS = ['Waist', 'Hips', 'Inseam', 'Outseam', 'Thigh'];

const KNOWN_BOTTOM_KEYS = new Set([
  'waist',
  'hips',
  'high hips',
  'full hips',
  'inseam',
  'outseam',
  'thigh',
  'knee',
  'bottom hem',
  'crotch / rise',
  'crotch',
  'rise',
  'skirt length',
  'leg opening',
  'ankle',
]);

export default function JobEditMeasurementModal({
  isOpen,
  onClose,
  job,
  storeId,
  onSuccess,
}: JobEditMeasurementModalProps) {
  const toast = useToast();
  const customerId = job.customer?.id;
  const customerName = job.customer?.name || 'Customer';

  const [activeTab, setActiveTab] = useState<'record' | 'existing'>('record');
  const [saving, setSaving] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);

  // Form state for Record New
  const [profileName, setProfileName] = useState(
    job.measurement?.profile_name || `${customerName}'s Profile`
  );
  const [measurementArea, setMeasurementArea] = useState<MeasurementAreaChoice>('both');
  const [topColumns, setTopColumns] = useState<string[]>([...DEFAULT_TOP_METRICS]);
  const [bottomColumns, setBottomColumns] = useState<string[]>([...DEFAULT_BOTTOM_METRICS]);
  const [metrics, setMetrics] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState(job.measurement?.notes || '');
  const [photoUrls, setPhotoUrls] = useState<string[]>(
    job.measurement?.photo_urls || []
  );

  // Initialize from current job measurement if available
  useEffect(() => {
    if (job.measurement) {
      const rawMetrics = job.measurement.metrics || {};
      const cleanMetrics: Record<string, string> = {};
      Object.entries(rawMetrics).forEach(([k, v]) => {
        if (!k.startsWith('_')) {
          cleanMetrics[k] = String(v ?? '');
        }
      });
      setMetrics(cleanMetrics);

      const area = (rawMetrics._area as MeasurementAreaChoice) || 'both';
      setMeasurementArea(area);

      const topCols = new Set(DEFAULT_TOP_METRICS);
      const bottomCols = new Set(DEFAULT_BOTTOM_METRICS);
      Object.keys(cleanMetrics).forEach((k) => {
        if (KNOWN_BOTTOM_KEYS.has(k.toLowerCase())) {
          bottomCols.add(k);
        } else {
          topCols.add(k);
        }
      });
      setTopColumns(Array.from(topCols));
      setBottomColumns(Array.from(bottomCols));
      setProfileName(job.measurement.profile_name || `${customerName}'s Profile`);
      setNotes(job.measurement.notes || '');
      setPhotoUrls(job.measurement.photo_urls || []);
    }
  }, [job.measurement, customerName]);

  // Load existing profiles when modal opens
  useEffect(() => {
    if (isOpen && storeId && customerId) {
      setLoadingProfiles(true);
      api
        .get(`/stores/${storeId}/measurements?customer_id=${customerId}`)
        .then((res) => {
          const list: SavedProfile[] = Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data)
            ? res.data
            : [];
          setSavedProfiles(list);
          if (list.length > 0 && !selectedProfileId) {
            setSelectedProfileId(list[0].id);
          }
        })
        .catch(() => {
          setSavedProfiles([]);
        })
        .finally(() => {
          setLoadingProfiles(false);
        });
    }
  }, [isOpen, storeId, customerId, selectedProfileId]);

  if (!isOpen) return null;

  const handleMetricChange = (metricKey: string, value: string) => {
    setMetrics((prev) => ({ ...prev, [metricKey]: value }));
  };

  const handleAddTopColumn = (newCol: string) => {
    if (topColumns.map((c) => c.toLowerCase()).includes(newCol.toLowerCase())) return;
    setTopColumns((prev) => [...prev, newCol]);
  };

  const handleRemoveTopColumn = (colToRemove: string) => {
    setTopColumns((prev) => prev.filter((c) => c !== colToRemove));
  };

  const handleRenameTopColumn = (oldName: string, newName: string) => {
    setTopColumns((prev) => prev.map((c) => (c === oldName ? newName : c)));
    setMetrics((prev) => {
      const next = { ...prev };
      if (next[oldName] !== undefined) {
        next[newName] = next[oldName];
        delete next[oldName];
      }
      return next;
    });
  };

  const handleAddBottomColumn = (newCol: string) => {
    if (bottomColumns.map((c) => c.toLowerCase()).includes(newCol.toLowerCase())) return;
    setBottomColumns((prev) => [...prev, newCol]);
  };

  const handleRemoveBottomColumn = (colToRemove: string) => {
    setBottomColumns((prev) => prev.filter((c) => c !== colToRemove));
  };

  const handleRenameBottomColumn = (oldName: string, newName: string) => {
    setBottomColumns((prev) => prev.map((c) => (c === oldName ? newName : c)));
    setMetrics((prev) => {
      const next = { ...prev };
      if (next[oldName] !== undefined) {
        next[newName] = next[oldName];
        delete next[oldName];
      }
      return next;
    });
  };

  // Submit handler
  const handleSave = async () => {
    if (!storeId) return;
    setSaving(true);

    try {
      if (activeTab === 'record') {
        const metricsPayload: Record<string, string> = {
          ...metrics,
          _area: measurementArea,
        };

        // 1. Create measurement profile
        const res = await api.post(`/stores/${storeId}/measurements`, {
          customer_id: customerId,
          service_id: job.service?.id ?? null,
          catalog_item_id: job.catalog_item?.id ?? null,
          profile_name: profileName || `${customerName}'s Profile`,
          metrics: metricsPayload,
          photo_urls: photoUrls,
          notes: notes || null,
          source: 'store_owner',
          status: 'finalized',
        });

        const newMeasurementId = res.data?.data?.id;

        // 2. Link to job order
        if (newMeasurementId) {
          await api.put(`/stores/${storeId}/jobs/${job.id}`, {
            measurement_id: newMeasurementId,
          });
        }

        toast.success('Measurements saved and linked to job order.');
      } else {
        // Link existing saved profile
        if (!selectedProfileId) {
          toast.error('Please choose a saved measurement profile.');
          setSaving(false);
          return;
        }

        await api.put(`/stores/${storeId}/jobs/${job.id}`, {
          measurement_id: selectedProfileId,
        });

        toast.success('Measurement profile linked to job order.');
      }

      await onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to update measurements.'));
    } finally {
      setSaving(false);
    }
  };

  const showTop = measurementArea === 'top' || measurementArea === 'both';
  const showBottom = measurementArea === 'bottom' || measurementArea === 'both';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/50 p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in"
    >
      <div className="relative w-full max-w-[680px] my-8 rounded-2xl bg-surface border border-line p-5 sm:p-6 shadow-xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-taupe/10 text-taupe">
              <Ruler size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">
                {job.measurement ? 'Update Garment Measurements' : 'Record & Link Measurements'}
              </h2>
              <p className="text-xs text-ink-muted">
                Order #{job.order_number} · {customerName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-sunken hover:text-ink transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-canvas border border-line rounded-xl p-1">
          <button
            type="button"
            onClick={() => setActiveTab('record')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'record'
                ? 'bg-espresso text-white shadow-2xs'
                : 'text-ink-body hover:bg-sunken'
            }`}
          >
            <Sparkles size={13} />
            <span>Record Measurements</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('existing')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'existing'
                ? 'bg-espresso text-white shadow-2xs'
                : 'text-ink-body hover:bg-sunken'
            }`}
          >
            <History size={13} />
            <span>Select Saved Profile ({savedProfiles.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        {activeTab === 'record' ? (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Profile Name */}
            <div className="space-y-1">
              <label htmlFor="modal-profile-name" className="text-xs font-semibold text-ink-muted">
                Profile Name:
              </label>
              <input
                id="modal-profile-name"
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder={`${customerName}'s Profile`}
                className="h-9 w-full bg-surface border border-line focus:border-taupe rounded-xl px-3 text-xs font-semibold text-ink focus:outline-none"
              />
            </div>

            {/* Area Choice */}
            <AreaSelector
              personName={profileName}
              selectedArea={measurementArea}
              onSelectArea={(area) => setMeasurementArea(area)}
            />

            {/* Top & Bottom Grids */}
            <div
              className={`grid gap-4 items-start ${
                showTop && showBottom ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
              }`}
            >
              {showTop && (
                <AreaGrid
                  title="Top Measurements"
                  icon="👔"
                  area="top"
                  columns={topColumns}
                  metrics={metrics}
                  onMetricChange={handleMetricChange}
                  onAddColumn={handleAddTopColumn}
                  onRemoveColumn={handleRemoveTopColumn}
                  onRenameColumn={handleRenameTopColumn}
                />
              )}

              {showBottom && (
                <AreaGrid
                  title="Bottom Measurements"
                  icon="👖"
                  area="bottom"
                  columns={bottomColumns}
                  metrics={metrics}
                  onMetricChange={handleMetricChange}
                  onAddColumn={handleAddBottomColumn}
                  onRemoveColumn={handleRemoveBottomColumn}
                  onRenameColumn={handleRenameBottomColumn}
                />
              )}
            </div>

            {/* Paper Measurement Sheets */}
            {storeId && (
              <PaperSheets
                photoUrls={photoUrls}
                onChangePhotos={setPhotoUrls}
                storeId={storeId}
              />
            )}

            {/* Notes */}
            <div className="space-y-1">
              <label htmlFor="modal-fitter-notes" className="text-xs font-semibold text-ink-muted">
                Fitter&apos;s Notes (Optional):
              </label>
              <textarea
                id="modal-fitter-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific adjustments, customer fit preferences, ease allowance..."
                rows={2}
                className="w-full bg-surface border border-line rounded-xl p-2.5 text-xs text-ink focus:outline-none focus:border-taupe resize-y"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {loadingProfiles ? (
              <div className="flex items-center justify-center py-8 text-xs text-ink-faint">
                <Loader2 size={16} className="animate-spin mr-2 text-taupe" />
                Loading saved profiles...
              </div>
            ) : savedProfiles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line p-6 text-center text-xs text-ink-muted">
                <p>No saved measurement profiles found for {customerName}.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('record')}
                  className="mt-2 text-xs font-semibold text-taupe hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles size={12} />
                  <span>Record new measurements now</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {savedProfiles.map((p) => {
                  const isSelected = selectedProfileId === p.id;
                  const metricEntries = Object.entries(p.metrics || {}).filter(
                    ([k]) => !k.startsWith('_')
                  );

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProfileId(p.id)}
                      className={`rounded-xl border p-3.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-taupe bg-taupe/5 shadow-2xs'
                          : 'border-line bg-canvas hover:bg-surface'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-ink">
                            {p.profile_name || 'Customer Profile'}
                          </span>
                          <span className="text-[10px] font-semibold text-taupe bg-taupe/10 px-1.5 py-0.5 rounded">
                            v{p.version}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-taupe">
                            <Check size={13} /> Selected
                          </span>
                        )}
                      </div>

                      {metricEntries.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-[11px]">
                          {metricEntries.slice(0, 6).map(([k, v]) => (
                            <div key={k} className="bg-surface border border-line rounded px-1.5 py-1 text-center">
                              <span className="text-[9px] font-bold uppercase text-ink-muted block truncate">
                                {k}
                              </span>
                              <span className="font-semibold text-ink">{withUnit(v, unitOfMetrics(p.metrics))}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-ink-faint italic">No metrics recorded</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-line pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-line text-xs font-semibold text-ink-muted hover:bg-sunken hover:text-ink transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || (activeTab === 'existing' && !selectedProfileId)}
            className="h-10 px-5 rounded-xl bg-espresso hover:bg-espresso/90 text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            <span>
              {activeTab === 'record'
                ? job.measurement
                  ? 'Update Measurements'
                  : 'Save & Link to Order'
                : 'Link Profile to Order'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
