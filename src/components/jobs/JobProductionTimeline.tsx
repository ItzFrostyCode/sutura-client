import React, { useState } from 'react';
import {
  AlertTriangle,
  Ban,
  Camera,
  Check,
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
  // Store pickup only — the approved thesis excludes logistics/courier/
  // delivery management from the system's scope. Bulk Order Override: a job
  // with a Team Roster / Size Sheet — or whose service is itself typed as
  // bulk sublimation — skips Pattern Making and goes straight to Mass
  // Cutting & Printing instead. Mirrors JobOrder::isBulkOrder() backend-side.
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
  // Mirrors the backend's "No QC Photo, No Ready for Pickup" gate
  // (JobOrderController@update) — surfaced here so the owner sees the
  // requirement while picking the phase, not just as a save-time error.
  const qcIdx = STAGES.findIndex(s => s.key === 'qc_ironing');
  const atOrPastQC = currentIdx >= qcIdx;
  // Was previously required before reaching Ready for Pickup (backend
  // returned a 422); per explicit owner request it's optional now, not
  // required — kept as an upload option (proof-of-delivery/QC/portfolio),
  // just no longer blocking or shown as a warning.

  return (
    <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
      <h2 className="text-lg font-medium text-[#2D2A26] mb-5">Production Timeline</h2>

      <div className="mb-6">
        {cancelled ? (
          <div className="flex items-center justify-center gap-3 py-4 bg-red-50 border border-red-200 rounded-xl">
            <Ban size={20} className="text-red-600" />
            <span className="text-sm font-semibold text-red-600">Order Cancelled</span>
          </div>
        ) : onHold ? (
          <div className="py-4 px-5 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-3">
              <Pause size={20} className="text-amber-700" />
              <span className="text-sm font-semibold text-amber-700">Production On Hold</span>
            </div>
            {job.hold_reason && (
              <p className="text-xs text-amber-700/80 mt-1.5 ml-8">{job.hold_reason}</p>
            )}
          </div>
        ) : (
          <div className="flex items-center">
            {STAGES.map((stage, idx) => {
              const isCurrent = idx === currentIdx;
              // The last stage has no later stage to compare against, so
              // `idx < currentIdx` can never mark it done — treat reaching
              // it as done in its own right instead of leaving it stuck
              // looking "current" forever.
              const isDone = idx < currentIdx || (isCurrent && stage.key === 'completed');
              let iconClass = 'bg-[#F0EAE3] border-[#EBE6E0] text-[#A8A19A] group-hover:border-[#9A8073]/40';
              if (isDone) {
                iconClass = 'bg-[#7A8B76] border-[#7A8B76] text-white';
              } else if (isCurrent) {
                iconClass = 'bg-[#9A8073] border-[#9A8073] text-white shadow-lg ring-2 ring-[#9A8073]/30';
              }

              let labelColor = 'text-[#A8A19A]';
              if (isCurrent) {
                labelColor = 'text-[#9A8073]';
              } else if (isDone) {
                labelColor = 'text-[#7A8B76]';
              }

              return (
                <div key={stage.key} className="flex items-center flex-1 min-w-0">
                  {(() => {
                    const StageIcon = isDone ? Check : stage.Icon;
                    return (
                  <button
                    onClick={() => setStatus(stage.key)}
                    className="flex flex-col items-center gap-1.5 flex-1 min-w-0 group"
                    title={`Set to ${stage.label}`}
                    type="button"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-all border-2 ${iconClass}`}>
                      <StageIcon size={16} strokeWidth={2.4} />
                    </div>
                    <span className={`text-[10px] font-medium text-center leading-tight px-0.5 ${labelColor}`}>
                      {stage.label}
                    </span>
                  </button>
                    );
                  })()}
                  {idx < STAGES.length - 1 && (
                    <div className={`h-0.5 shrink-0 w-3 ${idx < currentIdx ? 'bg-[#7A8B76]' : 'bg-[#EBE6E0]'}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}
        {!cancelled && !onHold && (
          <div className="mt-4 px-4 py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl flex items-center justify-between">
            <span className="text-xs text-[#A8A19A]">Current stage</span>
            <span className="text-sm font-semibold text-[#9A8073]">
              {STAGES.find(s => s.key === status)?.label ?? status}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="update-production-phase" className="text-sm font-medium text-[#524A44]">Update Production Phase</label>
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
            className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
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
        
        {prevStage && (
          <button
            type="button"
            onClick={() => setStatus(prevStage.key)}
            className="w-full px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={13} /> Revert to Previous Stage ({prevStage.label})
          </button>
        )}

        {job.material_source === 'customer_supplied' && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-700 shrink-0" />
            <p className="text-xs font-bold text-red-700 uppercase tracking-wide">
              Customer-supplied fabric/garment — do not cut from shop stock
            </p>
          </div>
        )}

        {((job.reference_images && job.reference_images.length > 0) || job.reference_link) && (
          <div className="space-y-1.5 border-t border-[#EBE6E0] pt-4">
            <span className="text-sm font-medium text-[#524A44] flex items-center gap-1.5">
              <Camera size={15} className="text-[#9A8073]" />
              Design Reference
            </span>
            <p className="text-[11px] text-[#A8A19A]">
              What the customer wants — attached at booking, or by the shop for a walk-in custom order.
            </p>
            {job.reference_images && job.reference_images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {job.reference_images.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Design reference" className="h-20 w-20 object-cover rounded-lg border border-[#EBE6E0] hover:opacity-80 transition-opacity" />
                  </a>
                ))}
              </div>
            )}
            {job.reference_link && (
              <a
                href={job.reference_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-[#9A8073] hover:underline mt-1 truncate max-w-full"
              >
                {job.reference_link}
              </a>
            )}
          </div>
        )}

        <div className="space-y-1.5 border-t border-[#EBE6E0] pt-4">
          <span className="text-sm font-medium text-[#524A44] flex items-center gap-1.5">
            <Camera size={15} className="text-[#7A8B76]" />
            Progress Photos <span className="text-xs font-normal text-[#A8A19A]">(optional)</span>
          </span>
          <p className="text-[11px] text-[#A8A19A]">
            Proof of real progress at whatever stage the job is currently in — builds customer trust and doubles as a
            production log. Each upload is tagged with the current stage automatically.
          </p>
          {job.progress_photos && job.progress_photos.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {job.progress_photos.map((photo) => (
                <a key={photo.url + photo.uploaded_at} href={photo.url} target="_blank" rel="noopener noreferrer" className="relative group/photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={`Progress at ${photo.stage}`} className="h-20 w-20 object-cover rounded-lg border border-[#EBE6E0] hover:opacity-80 transition-opacity" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-semibold text-center py-0.5 rounded-b-lg capitalize">
                    {STAGES.find(s => s.key === photo.stage)?.label ?? photo.stage.replace(/_/g, ' ')}
                  </span>
                </a>
              ))}
            </div>
          )}
          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-[#7A8B76] hover:text-[#6B7C67] bg-[#7A8B76]/5 hover:bg-[#7A8B76]/10 border border-[#7A8B76]/20 px-3 py-1.5 rounded-lg transition-colors mt-1">
            {uploadingProgressPhoto ? <Loader2 size={14} className="animate-spin text-[#7A8B76]" /> : <Camera size={14} />}
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

        <div className="space-y-1">
          <label htmlFor="notes-remarks" className="text-sm font-medium text-[#524A44]">Notes / Remarks</label>
          <textarea
            id="notes-remarks"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
            placeholder="e.g. Needs adjustments on the sleeves..."
          />
        </div>

        {(atOrPastQC || completionPhotoUrl) && (
          <div className="space-y-1.5 border-t pt-4 border-[#EBE6E0]">
            <span className="text-sm font-medium text-[#524A44] flex items-center gap-1.5">
              <Camera size={15} className="text-[#7A8B76]" />
              Completion Photo{' '}
              <span className="text-xs font-normal text-[#A8A19A]">(optional)</span>
            </span>
            <p className="text-[11px] text-[#A8A19A]">
              A quick photo of the finished garment — doubles as proof-of-delivery, QC evidence, and builds your portfolio.
            </p>
            {completionPhotoUrl ? (
              <div className="relative inline-block mt-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={completionPhotoUrl} alt="Completed garment" className="h-28 w-28 object-cover rounded-lg border border-[#EBE6E0]" />
                <button
                  type="button"
                  onClick={() => setCompletionPhotoUrl('')}
                  className="absolute -top-2 -right-2 bg-white border border-[#EBE6E0] text-[#827A73] hover:text-[#B26959] rounded-full p-1 shadow-sm"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-[#827A73] hover:text-[#7A8B76] transition-colors mt-1">
                {uploadingPhoto ? <Loader2 size={14} className="animate-spin text-[#7A8B76]" /> : <Camera size={14} />}
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
