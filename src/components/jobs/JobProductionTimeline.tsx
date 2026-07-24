import React, { useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { Job } from './jobTypes';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/axios';
import CancellationReasonModal from './CancellationReasonModal';

interface JobProductionTimelineProps {
  readonly job: Job;
  readonly status: string;
  readonly setStatus: (status: string) => void;
  readonly notes: string;
  readonly setNotes: (notes: string) => void;
  readonly completionPhotoUrl: string;
  readonly setCompletionPhotoUrl: (url: string) => void;
  readonly setCancellationReason: (reason: string) => void;
  readonly collectedAmount: number;
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
  collectedAmount,
}: JobProductionTimelineProps) {
  const { shop } = useAuthStore();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

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
  // Store pickup only — the approved thesis excludes logistics/courier/
  // delivery management from the system's scope. Bulk Order Override: a job
  // with a Team Roster / Size Sheet — or whose service is itself typed as
  // bulk sublimation — skips Pattern Making and goes straight to Mass
  // Cutting & Printing instead. Mirrors JobOrder::isBulkOrder() backend-side.
  const roster = (job.custom_order_data as { team_roster?: unknown[] } | null | undefined)?.team_roster;
  const isBulkOrder = (Array.isArray(roster) && roster.length > 0) || job.service?.service_type === 'bulk_sublimation';

  const STAGES: Array<{ key: string; label: string; emoji: string }> = [
    { key: 'pending',              label: 'Pending',               emoji: '🕐' },
    { key: 'design',               label: 'Design',                emoji: '🎨' },
    isBulkOrder
      ? { key: 'mass_cutting_printing', label: 'Mass Cutting & Printing', emoji: '🖨️' }
      : { key: 'pattern_making',        label: 'Pattern Making',          emoji: '📏' },
    { key: 'cutting',              label: 'Cutting',               emoji: '✂️' },
    { key: 'sewing',               label: 'Sewing / Assembly',     emoji: '🧵' },
    { key: 'ready_for_fitting',    label: 'Ready for Fitting',     emoji: '📐' },
    { key: 'final_adjustments',    label: 'Final Adjustments',     emoji: '🛠️' },
    { key: 'qc_ironing',           label: 'QC & Ironing',          emoji: '✨' },
    { key: 'ready_for_pickup',     label: 'Ready',                 emoji: '📦' },
    { key: 'completed',            label: 'Completed',             emoji: '🏁' },
  ];

  const cancelled = status === 'cancelled';
  const currentIdx = STAGES.findIndex(s => s.key === status);
  const prevStage = currentIdx > 0 ? STAGES[currentIdx - 1] : null;

  return (
    <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
      <h2 className="text-lg font-medium text-[#2D2A26] mb-5">Production Timeline</h2>

      <div className="mb-6">
        {cancelled ? (
          <div className="flex items-center justify-center gap-3 py-4 bg-red-50 border border-red-200 rounded-xl">
            <span className="text-xl">🚫</span>
            <span className="text-sm font-semibold text-red-600">Order Cancelled</span>
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
                  <button
                    onClick={() => setStatus(stage.key)}
                    className="flex flex-col items-center gap-1.5 flex-1 min-w-0 group"
                    title={`Set to ${stage.label}`}
                    type="button"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-all border-2 ${iconClass}`}>
                      {isDone ? '✓' : stage.emoji}
                    </div>
                    <span className={`text-[10px] font-medium text-center leading-tight px-0.5 ${labelColor}`}>
                      {stage.label}
                    </span>
                  </button>
                  {idx < STAGES.length - 1 && (
                    <div className={`h-0.5 shrink-0 w-3 ${idx < currentIdx ? 'bg-[#7A8B76]' : 'bg-[#EBE6E0]'}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}
        {!cancelled && (
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
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        {prevStage && (
          <button
            type="button"
            onClick={() => setStatus(prevStage.key)}
            className="w-full px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            ↩ Revert to Previous Stage ({prevStage.label})
          </button>
        )}

        {job.material_source === 'customer_supplied' && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 flex items-center gap-2">
            <span className="text-lg">⚠</span>
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

        {(status === 'completed' || completionPhotoUrl) && (
          <div className="space-y-1.5 border-t border-[#EBE6E0] pt-4">
            <span className="text-sm font-medium text-[#524A44] flex items-center gap-1.5">
              <Camera size={15} className="text-[#7A8B76]" />
              Completion Photo <span className="text-xs font-normal text-[#A8A19A]">(optional)</span>
            </span>
            <p className="text-[11px] text-[#A8A19A]">
              A quick photo of the finished garment — doubles as proof-of-delivery and builds your portfolio.
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
    </div>
  );
}
