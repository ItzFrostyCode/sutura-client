'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  User,
  Phone,
  Mail,
  Store,
  ShoppingBag,
  Sparkles,
  Shirt,
  Ruler,
  Calendar,
  Zap,
  Receipt,
  ExternalLink,
  AlertTriangle,
  Clock,
  Layers,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  ArrowRight,
  Maximize2,
  Scissors,
  UserCheck,
  Loader2,
} from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { getMediaUrl } from '@/lib/media';
import { Job as JobItem, TypeBadge, getDueStatus, normalizeJobStatus } from './jobHelpers';
import type { Staff } from '@/components/staff/staffHelpers';
import { roleLabel } from '@/components/staff/staffHelpers';
import { GARMENT_CATEGORY_LABELS } from './jobHelpers';

interface JobQuickViewModalProps {
  isOpen: boolean;
  job: JobItem | null;
  sequenceNumber?: number;
  staffList?: Staff[];
  onAssignStaff?: (jobId: number, staffUserId: number | null) => Promise<void>;
  onJobUpdated?: (updatedJob: JobItem) => void;
  onClose: () => void;
  onApprove?: (jobId: number) => void;
  onReject?: (jobId: number) => void;
  actionLoadingId?: number | null;
}

export default function JobQuickViewModal({
  isOpen,
  job,
  sequenceNumber,
  staffList: externalStaffList,
  onAssignStaff,
  onJobUpdated,
  onClose,
  onApprove,
  onReject,
  actionLoadingId,
}: JobQuickViewModalProps) {
  const { store, user } = useAuthStore();
  const isOwnerOrManager = Boolean(
    user?.roles?.some((r) => ['store_owner', 'branch_manager', 'super_admin'].includes(r.name))
  );
  const isStaff = Boolean(user?.roles?.some((r) => r.name === 'staff')) && !isOwnerOrManager;

  const [enrichedJob, setEnrichedJob] = useState<JobItem | null>(job);
  const [activePhotoPreview, setActivePhotoPreview] = useState<string | null>(null);
  const [internalStaffList, setInternalStaffList] = useState<Staff[]>([]);
  const [assigningStaff, setAssigningStaff] = useState<boolean>(false);

  // Active staff directory
  useEffect(() => {
    if (externalStaffList && externalStaffList.length > 0) {
      setInternalStaffList(externalStaffList);
      return;
    }
    if (!store?.id) return;
    api
      .get(`/stores/${store.id}/staff`)
      .then((res) => {
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setInternalStaffList(list.filter((s: Staff) => s.is_active !== false));
      })
      .catch((err) => {
        console.warn('Could not fetch staff directory for modal:', err);
      });
  }, [externalStaffList, store?.id]);

  useEffect(() => {
    setEnrichedJob(job);
    if (!job || !store?.id) return;

    // Fetch full job detail in the background to ensure full customer profile,
    // measurements, and payment breakdown are populated without blocking the modal
    api
      .get(`/stores/${store.id}/jobs/${job.id}`)
      .then((res) => {
        const data = res.data?.data;
        if (data && data.id === job.id) {
          setEnrichedJob((prev) => (prev?.id === job.id ? { ...prev, ...data } : prev));
        }
      })
      .catch((err) => {
        console.warn('Could not fetch enriched job details:', err);
      });
  }, [job, store?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activePhotoPreview) {
          setActivePhotoPreview(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, activePhotoPreview, onClose]);

  if (!isOpen || !job) return null;

  const currentJob = enrichedJob || job;
  const customData = (currentJob.custom_order_data as Record<string, unknown> | null) || {};
  const individualMeasurements = (customData.individual_measurements as Record<string, string> | null) ||
    (currentJob as unknown as { measurement?: { metrics?: Record<string, string> } })?.measurement?.metrics || null;
  const sizeBreakdown = (customData.size_breakdown as Record<string, string | number> | null) || null;
  const teamRoster = (customData.team_roster as Array<{ name?: string; number?: string; size?: string }> | null) || null;
  const measurementSheets = (customData.measurement_sheets as string[] | null) || [];
  const preExistingDamage = (customData.pre_existing_damage_notes as string | null) || null;
  const unit = (customData.unit as string) || (individualMeasurements as Record<string, string>)?.unit || 'in';

  // Reference photos
  const catalogImage =
    currentJob.catalog_item?.images?.find((i) => Boolean(i.is_primary))?.image_url ||
    currentJob.catalog_item?.images?.[0]?.image_url ||
    currentJob.catalog_item?.fabric_image_url;

  const allPhotos = Array.from(
    new Set([
      ...(catalogImage ? [catalogImage] : []),
      ...((currentJob.reference_images as string[]) || []),
    ])
  );

  const dueStatus = getDueStatus(currentJob.due_date, currentJob.status);
  const totalAmount = Number.parseFloat(String(currentJob.total_amount ?? '0')) || 0;
  const balance = Number.parseFloat(String(currentJob.balance ?? '0')) || 0;
  const discount = Number.parseFloat(String(currentJob.discount_amount ?? '0')) || 0;
  const amountPaid = Math.max(0, totalAmount - balance - discount);

  const currentAssignedStaffId =
    currentJob.assigned_staff_id ??
    currentJob.assigned_to ??
    (currentJob.assigned_staff as { id?: number })?.id ??
    null;

  const currentAssignedStaffName =
    currentJob.assigned_staff?.name ||
    (currentJob.assignedTo as { name?: string })?.name ||
    (currentJob.assignedStaff as { name?: string })?.name ||
    internalStaffList.find(
      (s) => (s.user_id ?? s.user?.id) === currentAssignedStaffId
    )?.user?.name ||
    null;

  const handleStaffChange = async (newStaffUserIdStr: string) => {
    if (!store || !currentJob) return;
    const newStaffUserId = newStaffUserIdStr ? Number(newStaffUserIdStr) : null;
    setAssigningStaff(true);
    try {
      if (onAssignStaff) {
        await onAssignStaff(currentJob.id, newStaffUserId);
      } else {
        await api.put(`/stores/${store.id}/jobs/${currentJob.id}`, {
          assigned_staff_id: newStaffUserId,
          assigned_to: newStaffUserId,
        });
      }
      const matchedStaff = internalStaffList.find(
        (s) => (s.user_id ?? s.user?.id) === newStaffUserId
      );
      const updated: JobItem = {
        ...currentJob,
        assigned_staff_id: newStaffUserId,
        assigned_to: newStaffUserId,
        assigned_staff: matchedStaff?.user
          ? { id: matchedStaff.user.id, name: matchedStaff.user.name, email: matchedStaff.user.email }
          : newStaffUserId
          ? currentJob.assigned_staff
          : null,
      };
      setEnrichedJob(updated);
      onJobUpdated?.(updated);
    } catch (err) {
      console.error('Failed to assign staff in modal:', err);
    } finally {
      setAssigningStaff(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-line rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-ink animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between gap-3 bg-canvas/30 shrink-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            {typeof sequenceNumber === 'number' && (
              <span
                title={`Queue Priority #${sequenceNumber}`}
                className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md font-mono text-xs font-black tracking-tight shadow-2xs ${
                  currentJob.is_rush
                    ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                    : 'bg-stone-800 text-amber-300'
                }`}
              >
                #{sequenceNumber}
              </span>
            )}
            <h2 className="font-mono text-base sm:text-lg font-black text-ink tracking-tight">
              {currentJob.order_number || `#${currentJob.id}`}
            </h2>
            <TypeBadge type={currentJob.intake_channel} />
            {currentJob.is_rush && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                <Zap size={10} /> Rush Order
              </span>
            )}
            <span
              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border tracking-wider ${
                normalizeJobStatus(currentJob.status) === 'pending'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : normalizeJobStatus(currentJob.status) === 'completed'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-blue-100 text-blue-900 border-blue-300'
              }`}
            >
              {normalizeJobStatus(currentJob.status).replace(/_/g, ' ')}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-line bg-surface hover:bg-canvas text-ink-muted hover:text-ink flex items-center justify-center transition-colors shadow-2xs cursor-pointer shrink-0"
            title="Close dialog (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Order Review Alert Banner for Pending Orders */}
        {normalizeJobStatus(currentJob.status) === 'pending' && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <Clock size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-ink">Order Pending Review</p>
                <p className="text-[11px] text-ink-muted">
                  Approve to notify customer with live tracking link, or reject with notes.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onReject && (
                <button
                  type="button"
                  disabled={actionLoadingId === currentJob.id}
                  onClick={() => onReject(currentJob.id)}
                  className="flex-1 sm:flex-none h-9 px-3 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Reject Order
                </button>
              )}
              {onApprove && (
                <button
                  type="button"
                  disabled={actionLoadingId === currentJob.id}
                  onClick={() => onApprove(currentJob.id)}
                  className="flex-1 sm:flex-none h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {actionLoadingId === currentJob.id ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  <span>Approve & Move to Production</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scrollable Modal Content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Section 1: Customer Details */}
          <div className="p-4 rounded-2xl bg-canvas/40 border border-line/80 space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-2">
              <div className="flex items-center gap-2">
                <User size={16} className="text-taupe" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Customer Details
                </h3>
              </div>
              <span className="text-[11px] text-ink-muted font-medium">
                {currentJob.intake_channel === 'online' ? 'Online Order' : 'Store Walk-in'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div>
                <span className="block text-[11px] text-ink-muted">Full Name</span>
                <span className="font-bold text-ink text-sm sm:text-base">
                  {currentJob.customer?.name || 'Walk-in Customer'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] text-ink-muted">Phone Number</span>
                <div className="flex items-center gap-1.5 font-semibold text-ink mt-0.5">
                  <Phone size={12} className="text-ink-muted shrink-0" />
                  <span>{currentJob.customer?.phone || 'Not specified'}</span>
                </div>
              </div>

              <div>
                <span className="block text-[11px] text-ink-muted">Email Address</span>
                <div className="flex items-center gap-1.5 font-semibold text-ink mt-0.5 truncate">
                  <Mail size={12} className="text-ink-muted shrink-0" />
                  <span className="truncate">{currentJob.customer?.email || 'Not specified'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Tailor & Staff Assignment */}
          <div className="p-4 rounded-2xl bg-canvas/40 border border-line/80 space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-2">
              <div className="flex items-center gap-2">
                <Scissors size={16} className="text-taupe" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Tailor & Staff Assignment
                </h3>
              </div>
              {currentAssignedStaffName && (
                <span className="text-[11px] font-semibold text-taupe flex items-center gap-1">
                  <UserCheck size={13} />
                  <span>Assigned</span>
                </span>
              )}
            </div>

            <div className="pt-1">
              {isOwnerOrManager ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="modal-assign-tailor-select"
                      className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted"
                    >
                      Assign Tailor / Staff
                    </label>
                    {assigningStaff && (
                      <span className="text-[11px] text-taupe font-semibold flex items-center gap-1">
                        <Loader2 size={12} className="animate-spin" />
                        <span>Updating assignment...</span>
                      </span>
                    )}
                  </div>
                  <div>
                    <select
                      id="modal-assign-tailor-select"
                      aria-label="Assign Tailor / Staff"
                      value={currentAssignedStaffId ? String(currentAssignedStaffId) : ''}
                      onChange={(e) => handleStaffChange(e.target.value)}
                      disabled={assigningStaff}
                      className="w-full h-11 px-3.5 bg-surface border border-line rounded-xl text-xs sm:text-sm font-medium text-ink focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe shadow-2xs cursor-pointer transition-colors"
                    >
                      <option value="">— Unassigned (Available in Pool) —</option>
                      {internalStaffList.map((s) => {
                        const sUserId = s.user_id ?? s.user?.id;
                        const sName = s.user?.name || `Tailor #${sUserId}`;
                        const sRole = s.role ? ` (${roleLabel(s.role)})` : '';
                        return (
                          <option key={sUserId} value={sUserId}>
                            {sName}{sRole}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  {currentAssignedStaffName ? (
                    <div className="flex items-center gap-2 text-xs text-ink-muted bg-surface/80 border border-line/60 rounded-xl px-3 py-2">
                      <div className="w-6 h-6 rounded-full bg-taupe/20 text-taupe font-bold flex items-center justify-center text-[10px] shrink-0">
                        {currentAssignedStaffName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-ink">{currentAssignedStaffName}</span>
                      <span className="text-ink-muted text-[11px]">• Currently assigned lead tailor</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-ink-muted/80 italic">
                      This order is unassigned. Assigning a tailor routes it directly to their production workload queue.
                    </p>
                  )}
                </div>
              ) : (
                /* Tailoring Staff view — Read-only indicator */
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface border border-line">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-taupe/15 text-taupe font-bold flex items-center justify-center text-xs shrink-0">
                      {(currentAssignedStaffName || 'U').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-ink truncate">
                        {currentAssignedStaffName || 'Unassigned'}
                      </div>
                      <div className="text-[11px] text-ink-muted truncate">
                        {currentAssignedStaffId === user?.id
                          ? 'Assigned to your tailoring workload'
                          : 'Assigned Tailor'}
                      </div>
                    </div>
                  </div>
                  {currentAssignedStaffId === user?.id ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider shrink-0">
                      Your Job
                    </span>
                  ) : (
                    <span className="text-[10px] text-ink-muted font-medium italic">
                      Managed by Owner
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Item & Service Specifications */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shirt size={16} className="text-taupe" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Item & Service Specifications
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-canvas/40 border border-line/80 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="block text-[11px] text-ink-muted">Order Type</span>
                  <span className="font-bold text-ink capitalize">
                    {currentJob.catalog_item
                      ? 'Catalog Design'
                      : currentJob.garment_category === 'alteration_repair'
                      ? 'Alteration & Repair'
                      : 'Bespoke Custom'}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] text-ink-muted">Garment Type</span>
                  <span className="font-bold text-ink capitalize">
                    {currentJob.garment_category
                      ? (GARMENT_CATEGORY_LABELS[currentJob.garment_category] ?? currentJob.garment_category.replace(/_/g, ' '))
                      : 'Custom Garment'}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] text-ink-muted">Service</span>
                  <span className="font-bold text-ink">
                    {currentJob.service_package?.name || currentJob.service?.name || 'Tailored'}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] text-ink-muted">Fabric Source</span>
                  <span className="font-bold text-ink capitalize">
                    {currentJob.material_source === 'customer_supplied'
                      ? 'Customer Supplied'
                      : 'Shop Supplied'}
                  </span>
                </div>
              </div>

              {/* Special Tailoring Notes */}
              {currentJob.notes && (
                <div className="p-3 bg-surface border border-line/70 rounded-xl text-xs space-y-1">
                  <span className="block text-[11px] font-bold text-ink-muted uppercase">
                    Tailoring Notes & Instructions:
                  </span>
                  <p className="text-ink font-medium leading-relaxed whitespace-pre-wrap">
                    {currentJob.notes}
                  </p>
                </div>
              )}

              {/* Pre-existing damage notes for repair */}
              {preExistingDamage && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                  <span className="block text-[11px] font-bold text-amber-800 uppercase flex items-center gap-1">
                    <AlertTriangle size={12} /> Pre-existing Condition / Damage Notes:
                  </span>
                  <p className="text-amber-900 font-medium leading-relaxed whitespace-pre-wrap">
                    {preExistingDamage}
                  </p>
                </div>
              )}

              {/* Inspiration Photos */}
              {allPhotos.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="block text-[11px] font-bold text-ink-muted uppercase">
                    Reference & Style Photos ({allPhotos.length})
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                    {allPhotos.map((url, idx) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setActivePhotoPreview(getMediaUrl(url))}
                        className="group relative rounded-xl overflow-hidden border border-line aspect-square bg-sunken hover:border-taupe transition-all cursor-pointer shadow-2xs"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getMediaUrl(url)}
                          alt={`Reference ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-ink/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <Maximize2 size={14} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Inspiration Link */}
              {currentJob.reference_link && (
                <div className="pt-1">
                  <a
                    href={currentJob.reference_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-taupe hover:underline"
                  >
                    <ExternalLink size={13} />
                    <span>Open Inspiration Link ({currentJob.reference_link})</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Body Measurements & Uploaded Sheet Preview */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Ruler size={16} className="text-taupe" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Body Measurements & Sizing
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-canvas/40 border border-line/80 space-y-4">
              {/* Individual Metrics Grid */}
              {individualMeasurements && Object.keys(individualMeasurements).length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase text-ink-muted">
                      Tailoring Metrics ({unit})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {Object.entries(individualMeasurements)
                      .filter(([key, val]) => key !== 'unit' && val && String(val).trim() !== '')
                      .map(([key, val]) => (
                        <div
                          key={key}
                          className="p-2.5 bg-surface rounded-xl border border-line shadow-2xs text-center"
                        >
                          <span className="block text-[10px] uppercase font-bold text-ink-muted capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="font-mono font-bold text-sm text-ink">
                            {String(val)} {unit}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-ink-muted italic">
                  No individual body metrics recorded.
                </p>
              )}

              {/* Bulk Size Breakdown */}
              {sizeBreakdown && Object.values(sizeBreakdown).some((v) => Number(v) > 0) && (
                <div className="pt-2 border-t border-line/60">
                  <span className="block text-[11px] font-bold uppercase text-ink-muted mb-2">
                    Bulk Size Breakdown
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {Object.entries(sizeBreakdown)
                      .filter(([, qty]) => Number(qty) > 0)
                      .map(([size, qty]) => (
                        <span
                          key={size}
                          className="px-2.5 py-1 bg-surface border border-line rounded-lg text-xs font-bold text-ink shadow-2xs"
                        >
                          {size}: <span className="text-taupe">{String(qty)} pcs</span>
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Team Roster */}
              {teamRoster && teamRoster.length > 0 && (
                <div className="pt-2 border-t border-line/60 space-y-2">
                  <span className="block text-[11px] font-bold uppercase text-ink-muted">
                    Team Roster ({teamRoster.length} members)
                  </span>
                  <div className="max-h-36 overflow-y-auto rounded-xl border border-line bg-surface divide-y divide-line/60 text-xs">
                    {teamRoster.map((m, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between">
                        <span className="font-semibold text-ink">{m.name || `Player ${idx + 1}`}</span>
                        <div className="flex items-center gap-3 text-ink-muted">
                          {m.number && <span>#{m.number}</span>}
                          {m.size && <span className="font-bold text-ink">{m.size}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Uploaded Handwritten Sheets Preview */}
              {measurementSheets.length > 0 && (
                <div className="pt-2 border-t border-line/60 space-y-2">
                  <span className="block text-[11px] font-bold uppercase text-ink-muted">
                    Handwritten Measurement Sheets ({measurementSheets.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {measurementSheets.map((url, idx) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setActivePhotoPreview(getMediaUrl(url))}
                        className="group relative rounded-xl overflow-hidden border border-line aspect-video bg-sunken hover:border-taupe transition-all cursor-pointer shadow-2xs"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getMediaUrl(url)}
                          alt={`Sheet ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-ink/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <Maximize2 size={16} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Timeline, Due Date & Financials */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Receipt size={16} className="text-taupe" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Timeline, Due Date & Payment Summary
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Due Date Card */}
              <div className="p-4 rounded-2xl bg-canvas/40 border border-line/80 space-y-2">
                <span className="block text-[11px] font-bold uppercase text-ink-muted">
                  Production Schedule
                </span>
                <div className="flex items-center gap-2.5 pt-1">
                  <Calendar size={18} className="text-taupe shrink-0" />
                  <div>
                    <span className="font-bold text-sm text-ink block">
                      {currentJob.due_date
                        ? new Date(currentJob.due_date).toLocaleDateString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'No due date specified'}
                    </span>
                    {dueStatus && (
                      <span
                        className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${dueStatus.className}`}
                      >
                        {dueStatus.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Balance Summary */}
              <div className="p-4 rounded-2xl bg-[#faf8f5] border border-line/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-ink-muted">
                    Payment Status
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                      currentJob.payment_status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : currentJob.payment_status === 'partial'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-rose-100 text-rose-800 border-rose-200'
                    }`}
                  >
                    {currentJob.payment_status}
                  </span>
                </div>

                <div className="space-y-1 pt-1 text-xs">
                  <div className="flex justify-between text-ink-muted">
                    <span>Net Total:</span>
                    <span className="font-bold text-ink">
                      ₱{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between text-emerald-800 font-semibold">
                    <span>Paid / Deposit:</span>
                    <span className="font-bold">
                      ₱{amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between pt-1 border-t border-line font-bold">
                    <span>Remaining Balance:</span>
                    <span
                      className={`text-sm ${
                        balance > 0 ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {balance > 0
                        ? `₱${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : 'Settled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-line flex items-center justify-between gap-3 bg-canvas/30 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-5 rounded-xl border border-line bg-surface hover:bg-canvas text-ink text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            Close
          </button>

          <Link
            href={`/dashboard/jobs/${currentJob.id}`}
            className="h-11 px-6 rounded-xl bg-taupe hover:bg-taupe-hover text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xs transition-all active:scale-[0.99] cursor-pointer"
          >
            <span>Open Full Job Order Page / Edit</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Full Image Zoom Overlay (if clicked) */}
        {activePhotoPreview && (
          <div
            className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setActivePhotoPreview(null)}
          >
            <button
              type="button"
              onClick={() => setActivePhotoPreview(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePhotoPreview}
              alt="Full Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
}
