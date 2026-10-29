'use client';

import { unitOfMetrics, withUnit } from '@/lib/measurementUnit';
import React, { useState } from 'react';
import Link from 'next/link';
import { Ruler, AlertTriangle, Lock, Sparkles, Edit2, ExternalLink, Image as ImageIcon, X } from 'lucide-react';
import { Job } from '../jobTypes';
import { STAGES_REQUIRING_DOWNPAYMENT } from '../jobHelpers';
import { useShopRole } from '@/hooks/useShopRole';
import SectionHeader from '../ui/SectionHeader';
import JobEditMeasurementModal from './JobEditMeasurementModal';
import { COVERS_LABEL } from '@/lib/orderUnits';

interface JobMeasurementCardProps {
  job: Job;
  onUseCurrentMeasurement: (versionId: number) => void;
  storeId?: number;
  onRefreshJob?: () => Promise<void>;
}

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

export default function JobMeasurementCard({
  job,
  onUseCurrentMeasurement,
  storeId,
  onRefreshJob = async () => {},
}: JobMeasurementCardProps) {
  const { isOwnerOrManager } = useShopRole();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Mirrors JobOrderController::update()'s measurement snapshot lock exactly
  // A completed order is read only too: no editing, no linking a newer version.
  const isSnapshotLocked = STAGES_REQUIRING_DOWNPAYMENT.has(job.status) || job.status === 'completed';
  // Recording or linking measurements on an order is the owner's / branch manager's step; staff read them.
  const canEdit = isOwnerOrManager && !isSnapshotLocked;
  const standardSize = typeof job.custom_order_data?.standard_size === 'string'
    ? job.custom_order_data.standard_size
    : null;

  // 1. EMPTY STATE: Standard Size selected
  if (!job.measurement && standardSize) {
    return (
      <>
        <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <SectionHeader
            icon={Ruler}
            title="Garment Sizing"
            badge={<span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-taupe/10 text-taupe">Standard Sizing</span>}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-sunken/70 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-lg font-semibold text-ink">
                {standardSize}
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Standard Size: {standardSize}</p>
                <p className="text-[13px] text-ink-muted mt-0.5">
                  Scheduled for production using standard off-the-rack dimensions instead of bespoke measurements.
                </p>
              </div>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface hover:bg-canvas border border-line text-xs font-semibold text-taupe hover:text-ink transition-colors cursor-pointer shrink-0"
              >
                <Sparkles size={13} />
                <span>Switch to Bespoke Fit</span>
              </button>
            )}
          </div>
        </div>

        <JobEditMeasurementModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          job={job}
          storeId={storeId}
          onSuccess={onRefreshJob}
        />
      </>
    );
  }

  // 2. EMPTY STATE: No measurement profile attached
  if (!job.measurement) {
    return (
      <>
        <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <SectionHeader
            icon={Ruler}
            title="Garment Measurements"
            badge={<span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700">Measurements Needed</span>}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-500/[0.07] rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-900">No measurement profile linked to this order yet</p>
                <p className="text-xs text-amber-800/80 mt-0.5">
                  Needed before pattern making and cutting can begin. It can be added or changed here until production starts.
                </p>
              </div>
            </div>

            {canEdit ? (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-espresso hover:bg-espresso/90 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                <Sparkles size={13} />
                <span>Record or Link Measurements</span>
              </button>
            ) : isSnapshotLocked ? (
              <span className="text-xs font-semibold text-ink-muted flex items-center gap-1">
                <Lock size={12} /> Shown only: the order is being made
              </span>
            ) : null}
          </div>
        </div>

        <JobEditMeasurementModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          job={job}
          storeId={storeId}
          onSuccess={onRefreshJob}
        />
      </>
    );
  }

  // 3. FULL MEASUREMENT PROFILE PRESENT
  const rawMetrics = job.measurement.metrics || {};
  const areaChoice = (rawMetrics._area as string) || 'both';

  const cleanEntries = Object.entries(rawMetrics).filter(([k]) => !k.startsWith('_'));
  const topMetrics: Array<[string, unknown]> = [];
  const bottomMetrics: Array<[string, unknown]> = [];

  cleanEntries.forEach(([k, v]) => {
    if (KNOWN_BOTTOM_KEYS.has(k.toLowerCase())) {
      bottomMetrics.push([k, v]);
    } else {
      topMetrics.push([k, v]);
    }
  });

  const photoList: string[] = job.measurement.photo_urls || [];

  return (
    <>
      <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        {/* Header */}
        <SectionHeader
          icon={Ruler}
          title={job.measurement.profile_name}
          badge={(
            <>
              {job.measurement.version && (
                <span className="text-[10px] font-semibold text-taupe bg-taupe/10 px-1.5 py-0.5 rounded">
                  v{job.measurement.version}
                </span>
              )}
              <span className="text-[10px] font-semibold text-ink-muted bg-sunken px-2 py-0.5 rounded-full capitalize">
                {COVERS_LABEL[areaChoice as keyof typeof COVERS_LABEL] ?? COVERS_LABEL.both}
              </span>
            </>
          )}
          actions={(
            <>
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-taupe hover:text-ink hover:bg-sunken border border-line transition-colors cursor-pointer"
                >
                  <Edit2 size={12} />
                  <span>Edit Measurements</span>
                </button>
              ) : !isSnapshotLocked ? null : (
                <span
                  title="Production started — measurement snapshot locked"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-muted bg-sunken px-2 py-1 rounded-md"
                >
                  <Lock size={11} /> Locked
                </span>
              )}

              {job.customer && (
                <Link
                  href={`/dashboard/customers/${job.customer.id}?tab=measurements`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-taupe hover:underline ml-1"
                >
                  <span>Customer Profiles</span>
                  <ExternalLink size={11} />
                </Link>
              )}
            </>
          )}
        />

        {/* Stale Warning */}
        {job.measurement.is_stale && (
          <div className="flex items-start gap-2.5 bg-amber-500/[0.07] text-amber-800 text-xs rounded-xl p-3.5">
            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-600" />
            <div className="flex-1">
              <p className="font-semibold">A newer measurement profile was updated after this order was placed.</p>
              {isSnapshotLocked ? (
                <p className="mt-0.5 text-amber-700 flex items-center gap-1.5">
                  <Lock size={11} className="shrink-0" />
                  Production has already started — this job stays pinned to the snapshot it was cut/sewn against and can no longer be switched.
                </p>
              ) : !isOwnerOrManager ? (
                <p className="mt-0.5 text-amber-700">The owner or a branch manager can switch this order to the newer version.</p>
              ) : (
                <>
                  <p className="mt-0.5 text-amber-700">Would you like to sync this job with the latest customer measurements?</p>
                  {job.measurement.current_version_id && (
                    <button
                      type="button"
                      onClick={() => onUseCurrentMeasurement(job.measurement!.current_version_id!)}
                      className="mt-2 text-xs font-semibold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors shadow-2xs cursor-pointer"
                    >
                      Sync with Current Version
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Separated Top & Bottom Grids */}
        {cleanEntries.length > 0 ? (
          <div className="space-y-4">
            {/* Top Measurements Grid */}
            {topMetrics.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1">
                  <span>👔</span> Top Measurements
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {topMetrics.map(([k, v]) => (
                    <div key={k} className="bg-sunken/70 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-ink-muted font-semibold uppercase truncate">{k.replaceAll('_', ' ')}</p>
                      <p className="text-sm font-semibold text-ink mt-0.5">
                        {typeof v === 'object' && v !== null ? JSON.stringify(v) : withUnit(v, unitOfMetrics(rawMetrics))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Measurements Grid */}
            {bottomMetrics.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1">
                  <span>👖</span> Bottom Measurements
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {bottomMetrics.map(([k, v]) => (
                    <div key={k} className="bg-sunken/70 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-ink-muted font-semibold uppercase truncate">{k.replaceAll('_', ' ')}</p>
                      <p className="text-sm font-semibold text-ink mt-0.5">
                        {typeof v === 'object' && v !== null ? JSON.stringify(v) : withUnit(v, unitOfMetrics(rawMetrics))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-ink-faint italic">No measurement metrics recorded.</p>
        )}

        {/* Paper Measurement Sheet Photos */}
        {photoList.length > 0 && (
          <div className="border-t border-line pt-3.5 space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
              <ImageIcon size={12} className="text-taupe" />
              <span>Paper Measurement Sheet Photos ({photoList.length})</span>
            </span>
            <div className="flex flex-wrap gap-2.5">
              {photoList.map((url, i) => (
                <button
                  key={`${url}-${i}`}
                  type="button"
                  onClick={() => setSelectedImage(url)}
                  className="relative h-16 w-16 overflow-hidden rounded-xl border border-line bg-canvas hover:border-taupe transition-colors group cursor-pointer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Paper sheet ${i + 1}`} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Measurement Notes */}
        {job.measurement.notes && (
          <p className="text-xs text-ink-muted border-t border-line pt-3">
            <strong className="text-ink-body">Measurement Notes:</strong> {job.measurement.notes}
          </p>
        )}
      </div>

      {/* Image Preview Lightbox */}
      {selectedImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/75 p-4 backdrop-blur-xs cursor-zoom-out"
        >
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-surface border border-line p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedImage} alt="Measurement sheet preview" className="max-h-[80vh] w-auto rounded-xl object-contain mx-auto" />
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-espresso/60 text-white flex items-center justify-center hover:bg-espresso/80 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Edit / Link Measurements Modal */}
      <JobEditMeasurementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        job={job}
        storeId={storeId}
        onSuccess={onRefreshJob}
      />
    </>
  );
}
