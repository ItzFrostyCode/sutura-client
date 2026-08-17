import React, { useState } from 'react';
import {
  AlertTriangle,
  Ban,
  Camera,
  Clock,
  Flag,
  Loader2,
  Package,
  Palette,
  Pause,
  Printer,
  RotateCcw,
  Ruler,
  Scissors,
  Shirt,
  Sparkles,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Job } from './jobTypes';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/axios';
import CancellationReasonModal from './CancellationReasonModal';
import HoldReasonModal from './HoldReasonModal';
import StatusStepper from '@/components/shared/StatusStepper';

interface JobProductionTimelineProps {
  readonly job: Job;
  readonly status: string;
  readonly setStatus: (status: string) => void;
  readonly notes: string;
  readonly setNotes: (notes: string) => void;
  readonly completionPhotoUrl: string;
  readonly setCompletionPhotoUrl: (url: string) => void;
  readonly setCancellationReason: (reason: string) => void;
  readonly setHoldReason: (reason: string) => void;
  readonly collectedAmount: number;
  readonly onProgressPhotoAdded: () => void;
}

export default function JobProductionTimeline({
  job,
  status,
  setStatus,
  notes,
  setNotes,
  completionPhotoUrl,
  setCompletionPhotoUrl,
  setCancellationReason,
  setHoldReason,
  collectedAmount,
  onProgressPhotoAdded,
}: JobProductionTimelineProps) {
  const { shop } = useAuthStore();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingProgressPhoto, setUploadingProgressPhoto] = useState(false);
  const [deletingPhotoUrl, setDeletingPhotoUrl] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);

  const handlePhotoUpload = async (file: File | undefined) => {
    if (!file || !shop) return;
    setUploadingPhoto(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post(`/shops/${shop.id}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCompletionPhotoUrl(res.data?.data?.url || res.data?.url || '');
    } catch {
      alert('Failed to upload completion photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleProgressPhotoUpload = async (file: File | undefined) => {
    if (!file || !shop) return;
    setUploadingProgressPhoto(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const uploadRes = await api.post(`/shops/${shop.id}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = uploadRes.data?.data?.url || uploadRes.data?.url;
      if (!url) throw new Error('No URL returned from upload');
      await api.post(`/shops/${shop.id}/jobs/${job.id}/progress-photos`, { url });
      onProgressPhotoAdded();
    } catch {
      alert('Failed to upload progress photo.');
    } finally {
      setUploadingProgressPhoto(false);
    }
  };

  const handleDeleteProgressPhoto = async (url: string) => {
    if (!shop || deletingPhotoUrl) return;
    setDeletingPhotoUrl(url);
    try {
      await api.delete(`/shops/${shop.id}/jobs/${job.id}/progress-photos`, {
        data: { url },
      });
      onProgressPhotoAdded();
    } catch {
      alert('Failed to remove progress photo.');
    } finally {
      setDeletingPhotoUrl(null);
    }
  };

  const roster = (job.custom_order_data as { team_roster?: unknown[] } | null | undefined)?.team_roster;
  const isBulkOrder = (Array.isArray(roster) && roster.length > 0) || job.service?.service_type === 'bulk_sublimation';

  const STAGES: Array<{ key: string; label: string; Icon: LucideIcon }> = [
    { key: 'pending',              label: 'Pending',               Icon: Clock },
    { key: 'design',               label: 'Design',                Icon: Palette },
    isBulkOrder
      ? { key: 'mass_cutting_printing', label: 'Mass Cutting & Printing', Icon: Printer }
      : { key: 'pattern_making',        label: 'Pattern Making',          Icon: Ruler },
    { key: 'cutting',              label: 'Cutting',               Icon: Scissors },
    { key: 'sewing',               label: 'Sewing / Assembly',     Icon: Shirt },
    { key: 'ready_for_fitting',    label: 'Ready for Fitting',     Icon: Ruler },
    { key: 'final_adjustments',    label: 'Final Adjustments',     Icon: Wrench },
    { key: 'qc_ironing',           label: 'QC & Ironing',          Icon: Sparkles },
    { key: 'ready_for_pickup',     label: 'Ready',                 Icon: Package },
    { key: 'completed',            label: 'Completed',             Icon: Flag },
  ];

  const cancelled = status === 'cancelled';
  const onHold = status === 'on_hold';
  const currentIdx = STAGES.findIndex(s => s.key === status);
  const prevStage = currentIdx > 0 ? STAGES[currentIdx - 1] : null;
  const qcIdx = STAGES.findIndex(s => s.key === 'qc_ironing');
  const atOrPastQC = currentIdx >= qcIdx;

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-ink">Production Timeline</h2>
        {!cancelled && !onHold && (
          <span className="text-xs font-semibold text-taupe px-2.5 py-0.5 rounded-full bg-taupe/10 border border-taupe/20">
            {STAGES.find(s => s.key === status)?.label ?? status}
          </span>
        )}
      </div>

      <div className="mb-2">
        {cancelled ? (
          <div className="flex items-center justify-center gap-3 py-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
            <Ban size={18} />
            <span className="text-sm font-semibold">Order Cancelled</span>
          </div>
        ) : onHold ? (
          <div className="py-4 px-5 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-3">
              <Pause size={18} className="text-amber-700" />
              <span className="text-sm font-semibold text-amber-800">Production On Hold</span>
            </div>
            {job.hold_reason && (
              <p className="text-xs text-amber-700/80 mt-1.5 ml-7">{job.hold_reason}</p>
            )}
          </div>
        ) : (
          <StatusStepper stages={STAGES} currentKey={status} onStageClick={setStatus} />
        )}
      </div>

      <div className="space-y-4 pt-2 border-t border-line">
        <div className="space-y-1.5">
          <label htmlFor="update-production-phase" className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Update Production Phase
          </label>
          <div className="flex items-center gap-2">
            {prevStage && (
              <button
                type="button"
                onClick={() => setStatus(prevStage.key)}
                title={`Revert to Previous Stage (${prevStage.label})`}
                className="h-10 w-10 shrink-0 bg-canvas hover:bg-surface text-ink-muted hover:text-ink border border-line rounded-xl transition-all flex items-center justify-center shadow-2xs active:scale-95"
              >
                <RotateCcw size={15} />
              </button>
            )}
            <select
              id="update-production-phase"
              value={status}
              onChange={e => {
                if (e.target.value === 'cancelled') {
                  setShowCancelModal(true);
                } else if (e.target.value === 'on_hold') {
                  setShowHoldModal(true);
                } else {
                  setStatus(e.target.value);
                }
              }}
              className="flex-1 h-10 px-4 bg-canvas border border-line rounded-xl text-xs font-medium text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe shadow-2xs"
            >
              <option value="pending">Pending</option>
              <option value="design">Design</option>
              {isBulkOrder ? (
                <option value="mass_cutting_printing">Mass Cutting & Printing</option>
              ) : (
                <option value="pattern_making">Pattern Making</option>
              )}
              <option value="cutting">Cutting</option>
              <option value="sewing">Sewing / Assembly</option>
              <option value="ready_for_fitting">Ready for Fitting</option>
              <option value="final_adjustments">Final Adjustments</option>
              <option value="qc_ironing">QC & Ironing</option>
              <option value="ready_for_pickup">Ready for Pickup</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {job.material_source === 'customer_supplied' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-amber-900">
            <AlertTriangle size={16} className="text-amber-700 shrink-0" />
            <p className="text-xs font-bold uppercase tracking-wide">
              Customer-supplied fabric/garment — do not cut from shop stock
            </p>
          </div>
        )}

        {((job.reference_images && job.reference_images.length > 0) || job.reference_link) && (
          <div className="space-y-1.5 border-t border-line pt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
              <Camera size={14} className="text-taupe" />
              Design Reference
            </span>
            <p className="text-[11px] text-ink-faint">
              What the customer wants — attached at booking, or by the shop for a walk-in custom order.
            </p>
            {job.reference_images && job.reference_images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {job.reference_images.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Design reference" className="h-20 w-20 object-cover rounded-lg border border-line hover:opacity-80 transition-opacity" />
                  </a>
                ))}
              </div>
            )}
            {job.reference_link && (
              <a
                href={job.reference_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-taupe hover:underline mt-1 truncate max-w-full"
              >
                {job.reference_link}
              </a>
            )}
          </div>
        )}

        <div className="space-y-2 border-t border-line pt-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                <Camera size={14} className="text-sage" />
                Progress Photos <span className="text-[11px] font-normal text-ink-faint lowercase">(optional)</span>
              </span>
              <p className="text-[11px] text-ink-faint mt-0.5">
                Proof of real progress at whatever stage the job is currently in — builds customer trust and doubles as a production log. Each upload is tagged with the current stage automatically.
              </p>
            </div>
          </div>

          {job.progress_photos && job.progress_photos.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {job.progress_photos.map((photo) => (
                <div key={photo.url + photo.uploaded_at} className="relative group/photo">
                  <a
                    href={photo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={`Progress at ${photo.stage}`}
                      className="h-20 w-20 object-cover rounded-lg border border-line hover:opacity-80 transition-opacity"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-semibold text-center py-0.5 rounded-b-lg capitalize">
                      {STAGES.find(s => s.key === photo.stage)?.label ?? photo.stage.replaceAll('_', ' ')}
                    </span>
                  </a>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (confirm('Are you sure you want to remove this progress photo?')) {
                        handleDeleteProgressPhoto(photo.url);
                      }
                    }}
                    disabled={deletingPhotoUrl === photo.url}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-surface border border-line text-ink-muted hover:text-danger hover:border-danger/30 rounded-full flex items-center justify-center shadow-xs transition-colors"
                    title="Remove progress photo"
                  >
                    {deletingPhotoUrl === photo.url ? (
                      <Loader2 size={10} className="animate-spin text-danger" />
                    ) : (
                      <X size={11} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-sage hover:text-[#6B7C67] bg-sage/5 hover:bg-sage/10 border border-sage/20 px-3 py-1.5 rounded-lg transition-colors mt-1">
            {uploadingProgressPhoto ? <Loader2 size={14} className="animate-spin text-sage" /> : <Camera size={14} />}
            <span>{uploadingProgressPhoto ? 'Uploading...' : 'Add a progress photo'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingProgressPhoto}
              onChange={e => handleProgressPhotoUpload(e.target.files?.[0])}
            />
          </label>
        </div>

        <div className="space-y-1 border-t border-line pt-4">
          <label htmlFor="notes-remarks" className="text-xs font-bold uppercase tracking-wider text-ink-muted">Notes / Remarks</label>
          <textarea
            id="notes-remarks"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 bg-canvas border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe shadow-2xs leading-relaxed"
            placeholder="e.g. Needs adjustments on the sleeves..."
          />
        </div>

        {(atOrPastQC || completionPhotoUrl) && (
          <div className="space-y-1.5 border-t pt-4 border-line">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
              <Camera size={14} className="text-sage" />
              Completion Photo{' '}
              <span className="text-[11px] font-normal text-ink-faint lowercase">(optional)</span>
            </span>
            <p className="text-[11px] text-ink-faint">
              A quick photo of the finished garment — doubles as proof-of-delivery, QC evidence, and builds your portfolio.
            </p>
            {completionPhotoUrl ? (
              <div className="relative inline-block mt-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={completionPhotoUrl} alt="Completed garment" className="h-28 w-28 object-cover rounded-lg border border-line" />
                <button
                  type="button"
                  onClick={() => setCompletionPhotoUrl('')}
                  className="absolute -top-2 -right-2 bg-surface border border-line text-ink-muted hover:text-danger rounded-full p-1"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-ink-muted hover:text-sage transition-colors mt-1">
                {uploadingPhoto ? <Loader2 size={14} className="animate-spin text-sage" /> : <Camera size={14} />}
                <span>{uploadingPhoto ? 'Uploading...' : 'Upload a photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingPhoto}
                  onChange={e => handlePhotoUpload(e.target.files?.[0])}
                />
              </label>
            )}
          </div>
        )}
      </div>

      <CancellationReasonModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        collectedAmount={collectedAmount}
        onConfirm={(reason) => {
          setCancellationReason(reason);
          setStatus('cancelled');
          setShowCancelModal(false);
        }}
      />

      <HoldReasonModal
        isOpen={showHoldModal}
        onClose={() => setShowHoldModal(false)}
        onConfirm={(reason) => {
          setHoldReason(reason);
          setStatus('on_hold');
          setShowHoldModal(false);
        }}
      />
    </div>
  );
}
