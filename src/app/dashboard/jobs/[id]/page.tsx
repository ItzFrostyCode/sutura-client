'use client';

import React, { useState } from 'react';
import { ArrowLeft, Loader2, Save, Trash2, ShoppingBag, Store, Printer, CreditCard, AlertTriangle, Scissors, HelpCircle, LayoutGrid, Users, Zap, Link as LinkIcon, BookOpen, Shirt, Mail, CheckCircle2, Circle, Clock, Copy, X, Ruler, Check } from 'lucide-react';
import Modal from '@/components/Modal';
import Link from 'next/link';
import JobProductionTimeline from '@/components/jobs/JobProductionTimeline';
import JobFulfillmentCard from '@/components/jobs/JobFulfillmentCard';
import JobStaffAssignmentCard from '@/components/jobs/JobStaffAssignmentCard';
import JobFinancialsCard from '@/components/jobs/JobFinancialsCard';
import SendCustomerMessageModal from '@/components/jobs/SendCustomerMessageModal';
import { useJobDetail } from '@/components/jobs/useJobDetail';
import { RosterItem } from '@/components/jobs/jobTypes';
import { CANCELLATION_REASON_LABELS, GARMENT_CATEGORY_LABELS } from '@/components/jobs/jobHelpers';

export default function JobDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;
  const [showOutsourcingHelp, setShowOutsourcingHelp] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  // In-page tabs — lazy initialized from URL hash (e.g. #financials from dashboard quick actions)
  // to avoid cascading renders from synchronous setState inside useEffect.
  const [activeTab, setActiveTab] = useState<'overview' | 'production' | 'staff' | 'fulfillment' | 'financials'>(() => {
    if (typeof window === 'undefined') return 'overview';
    const validTabs = ['overview', 'production', 'staff', 'fulfillment', 'financials'] as const;
    const hash = window.location.hash.replace('#', '');
    if ((validTabs as readonly string[]).includes(hash)) {
      return hash as 'overview' | 'production' | 'staff' | 'fulfillment' | 'financials';
    }
    return 'overview';
  });

  const {
    shop,
    router,
    job,
    loading,
    saving,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDeleting,
    status,
    setStatus,
    notes,
    setNotes,
    completionPhotoUrl,
    setCompletionPhotoUrl,
    setCancellationReason,
    setHoldReason,
    refreshJob,
    isOutsourced,
    setIsOutsourced,
    partnerShopName,
    setPartnerShopName,
    outsourcingCost,
    setOutsourcingCost,
    allStaff,
    staffAssignments,
    setStaffAssignments,
    staffCompletions,
    savingStaff,
    handleUpdate,
    handleUpdateStaff,
    handleChargePayment,
    handleApplyDiscount,
    handleUpdatePayment,
    handleRejectPayment,
    handleUseCurrentMeasurement,
    handleToggleRosterItem,
    handleDelete,
    hasUnsavedChanges,
    dirtyTabs,
    handleResetChanges,
  } = useJobDetail(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-ink-faint">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading job order details...
      </div>
    );
  }

  if (!job) {
    return <div className="text-ink-faint">Job Order not found.</div>;
  }

  // The 50% downpayment gate is enforced cumulatively (any partial payment
  // counts toward it), so the banner must track progress toward that
  // threshold rather than just "has anything been paid at all" — otherwise
  // a token payment (e.g. ₱70 of an ₱8,000 job) silently makes the warning
  // disappear even though production still can't legally start.
  const jobTotalAmount = Number.parseFloat(String(job.total_amount)) || 0;
  const jobPaidSoFar = jobTotalAmount - (Number.parseFloat(String(job.balance)) || 0);
  const requiredDownpayment = jobTotalAmount * 0.5;
  const downpaymentShortfall = Math.max(0, requiredDownpayment - jobPaidSoFar);
  const showDownpaymentGate = job.status !== 'cancelled' && job.status !== 'completed' && downpaymentShortfall > 0;

  return (
    <>
      <div className="print:hidden space-y-4">
        {/* Top Header & Global Actions (Clean directly on canvas) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => router.back()}
              className="p-2.5 rounded-xl bg-surface hover:bg-canvas border border-line text-ink-muted hover:text-ink transition-colors shadow-2xs shrink-0"
              type="button"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight flex items-center flex-wrap gap-2">
                {job.order_number}
                {job.intake_channel === 'online' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                    <ShoppingBag size={11} /> Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-sunken text-ink-muted px-2.5 py-0.5 rounded-full border border-line">
                    <Store size={11} /> Walk-in
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <Store size={11} /> {job.fulfillment_type === 'delivery' ? 'Delivery' : 'Pickup'}
                </span>
                {job.is_rush && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-300">
                    <Zap size={11} /> Rush Order
                  </span>
                )}
              </h1>
              <p className="text-xs text-ink-muted mt-0.5">
                Manage lifecycle, specifications, and financials
                {job.tracking_code && (
                  <span className="ml-2 text-ink-faint">
                    • Tracking: <strong className="font-mono text-ink-body select-all">{job.tracking_code}</strong>
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            {hasUnsavedChanges && (
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full animate-in fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Unsaved changes
              </span>
            )}

            {hasUnsavedChanges && (
              <button
                onClick={handleResetChanges}
                type="button"
                className="h-9 px-3 rounded-xl bg-surface hover:bg-canvas border border-line text-ink-muted hover:text-ink transition-colors text-xs font-semibold shadow-2xs active:scale-95"
                title="Discard draft changes"
              >
                Discard
              </button>
            )}

            <button
              onClick={() => setShowMessageModal(true)}
              className="h-9 w-9 rounded-xl bg-surface hover:bg-canvas border border-line text-ink-muted hover:text-ink transition-colors flex items-center justify-center shadow-2xs active:scale-95"
              title="Message Customer"
              type="button"
            >
              <Mail size={15} />
            </button>
            <button
              onClick={() => window.print()}
              className="h-9 w-9 rounded-xl bg-surface hover:bg-canvas border border-line text-ink-muted hover:text-ink transition-colors flex items-center justify-center shadow-2xs active:scale-95"
              title="Print Physical Work Ticket"
              type="button"
            >
              <Printer size={15} />
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="h-9 w-9 rounded-xl bg-surface hover:bg-rose-50 border border-line hover:border-rose-200 text-ink-faint hover:text-rose-600 transition-colors flex items-center justify-center shadow-2xs active:scale-95"
              title="Delete Job Order"
              type="button"
            >
              <Trash2 size={15} />
            </button>
            
            <button
              onClick={handleUpdate}
              disabled={saving || !hasUnsavedChanges}
              className={`h-9 px-4 rounded-xl font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 active:scale-95 ${
                hasUnsavedChanges
                  ? 'bg-taupe hover:bg-taupe-hover text-white ring-2 ring-taupe/30 shadow-md cursor-pointer'
                  : 'bg-surface border border-line text-ink-muted/70 font-semibold cursor-default hover:bg-surface opacity-80'
              }`}
              type="button"
              title={hasUnsavedChanges ? 'Click to save all pending changes' : 'All changes are saved'}
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : hasUnsavedChanges ? (
                <Save size={14} />
              ) : (
                <Check size={14} className="text-sage" />
              )}
              <span>{hasUnsavedChanges ? 'Save Changes' : 'Saved'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-1 border-b border-line overflow-x-auto hide-scrollbar">
          {([
            { key: 'overview', label: 'Overview', icon: LayoutGrid },
            { key: 'production', label: 'Production', icon: Scissors },
            { key: 'staff', label: 'Staff', icon: Users },
            { key: 'fulfillment', label: 'Fulfillment', icon: Store },
            { key: 'financials', label: 'Financials', icon: CreditCard },
          ] as const).map(tab => {
            const TabIcon = tab.icon;
            const active = activeTab === tab.key;
            const isTabDirty = Boolean(dirtyTabs[tab.key as keyof typeof dirtyTabs]);
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold border-b-2 -mb-px transition-colors shrink-0 ${
                  active
                    ? 'border-taupe text-ink bg-surface/40 rounded-t-lg'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                <TabIcon size={15} />
                <span>{tab.label}</span>
                {isTabDirty && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Unsaved changes in this tab" />
                )}
              </button>
            );
          })}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Cancellation / Rejection Notice (if applicable) */}
            {job.status === 'cancelled' && job.cancellation_reason && (
              <div className="bg-danger/10 border border-danger/25 rounded-2xl p-4 flex items-start gap-3">
                <X size={16} className="text-danger shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="text-[#9A5C4F] font-bold">This order was cancelled</p>
                  <p className="text-[#9A5C4F]/80 mt-0.5">Reason: {CANCELLATION_REASON_LABELS[job.cancellation_reason] ?? job.cancellation_reason}</p>
                </div>
              </div>
            )}

            {job.status === 'rejected' && job.rejection_reason && (
              <div className="bg-danger/10 border border-danger/25 rounded-2xl p-4 flex items-start gap-3">
                <X size={16} className="text-danger shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="text-[#9A5C4F] font-bold">This order was rejected</p>
                  <p className="text-[#9A5C4F]/80 mt-0.5">Reason: {job.rejection_reason}</p>
                </div>
              </div>
            )}
          <div className="space-y-6">
            {/* ── Quick KPI / Order Summary Strip ───────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {/* Due Date Card */}
              <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs">
                <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">Target Due Date</span>
                <p className="text-base sm:text-lg font-bold text-ink mt-1">
                  {job.due_date ? new Date(job.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Due Date Set'}
                </p>
                <p className="text-xs text-ink-muted mt-0.5 flex items-center gap-1">
                  <Clock size={12} className="text-taupe" />
                  {job.due_date ? 'Production schedule target' : 'Pending deadline confirmation'}
                </p>
              </div>

              {/* Payment Summary Card */}
              <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs">
                <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">Payment Status</span>
                <p className="text-base sm:text-lg font-bold text-ink mt-1">
                  ₱{Number.parseFloat(String(job.total_amount || 0)).toFixed(2)}
                </p>
                <p className="text-xs mt-0.5 font-semibold flex items-center gap-1">
                  {Number.parseFloat(String(job.balance || 0)) <= 0 ? (
                    <span className="text-emerald-700">✓ Fully Paid</span>
                  ) : (
                    <span className="text-amber-700">₱{Number.parseFloat(String(job.balance)).toFixed(2)} balance remaining</span>
                  )}
                </p>
              </div>

              {/* Client Status Card */}
              <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs">
                <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">Customer</span>
                <p className="text-base sm:text-lg font-bold text-ink mt-1 truncate">
                  {job.customer?.name || 'Walk-in Guest'}
                </p>
                <p className="text-xs text-ink-muted mt-0.5 flex items-center gap-1 truncate">
                  {job.customer_job_count && job.customer_job_count > 1 ? (
                    <span className="text-amber-700 font-bold">★ Suki (Order #{job.customer_job_count})</span>
                  ) : (
                    <span>New Customer Order</span>
                  )}
                </p>
              </div>

              {/* Production Stage Card */}
              <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs">
                <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">Current Stage</span>
                <p className="text-base sm:text-lg font-bold text-ink mt-1 capitalize">
                  {job.status.replaceAll('_', ' ')}
                </p>
                <p className="text-xs text-ink-muted mt-0.5 truncate">
                  Staff: <strong className="text-ink-body font-semibold">{job.assigned_staff?.name || 'Unassigned'}</strong>
                </p>
              </div>
            </div>

            {/* ── Main 2-Column Responsive Layout ───────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (8 of 12 columns) */}
              <div className="lg:col-span-8 space-y-6">
                {/* 1. Client & Garment Specifications Card */}
                <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between border-b border-line pb-4">
                    <div>
                      <h2 className="text-base font-bold text-ink">Garment & Order Specifications</h2>
                      <p className="text-xs text-ink-muted mt-0.5">Primary tailoring requirements and fabric allocation</p>
                    </div>
                    {job.customer && (
                      <Link
                        href={`/dashboard/customers/${job.customer.id}`}
                        className="text-xs font-bold text-taupe hover:text-taupe-hover hover:underline"
                      >
                        View Customer Profile →
                      </Link>
                    )}
                  </div>

                  {(() => {
                    const resolvedCategory =
                      job.service?.category ||
                      (job.service?.categories && job.service.categories.length > 0 ? job.service.categories.join(', ') : null) ||
                      (job.garment_category ? (GARMENT_CATEGORY_LABELS[job.garment_category] ?? job.garment_category) : null) ||
                      'Custom Apparel & Tailoring';

                    return (
                      <>
                        {/* Clean Spec Sheet Property Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-sm py-1">
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">Customer</span>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-ink text-sm">{job.customer?.name || 'Walk-in Customer'}</p>
                              {job.customer?.suki_tag && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800">
                                  {job.customer.suki_tag.toUpperCase()}
                                </span>
                              )}
                            </div>
                            {job.customer?.email && (
                              <p className="text-xs text-ink-muted">{job.customer.email}</p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">Service & Category</span>
                            <p className="font-bold text-ink text-sm">{job.service?.name || 'Custom Garment'}</p>
                            <p className="text-xs text-ink-muted font-medium">
                              Category: <strong className="text-ink-body font-semibold">{resolvedCategory}</strong>
                            </p>
                          </div>

                          <div className="space-y-1 border-t border-line/60 pt-3 sm:border-0 sm:pt-0">
                            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">Fabric & Material</span>
                            <p className="font-bold text-ink text-sm">
                              {job.material_source === 'customer_supplied' ? "Customer's Own Fabric" : (job.custom_order_data?.fabric_preference ? `${job.custom_order_data.fabric_preference} (Shop Supplied)` : 'Shop Supplied Material')}
                            </p>
                            <p className="text-xs text-ink-muted">
                              {job.material_source === 'customer_supplied' ? 'Customer dropped off fabric material' : 'In-house fabric & sublimation inventory'}
                            </p>
                          </div>

                          <div className="space-y-1 border-t border-line/60 pt-3 sm:border-0 sm:pt-0">
                            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">Assigned Staff</span>
                            <p className="font-bold text-ink text-sm">{job.assigned_staff?.name || 'Unassigned'}</p>
                            <p className="text-xs text-ink-muted">
                              {job.staff_stages && job.staff_stages.length > 0 ? `${job.staff_stages.length} multi-stage role(s) assigned` : 'Assigned to primary shop queue'}
                            </p>
                          </div>
                        </div>

                        {/* Custom Specifications Attributes (if available) */}
                        {job.custom_order_data && Object.keys(job.custom_order_data).some(k => !['roster', 'team_roster', 'fabric_preference', 'team_name'].includes(k)) && (
                          <div className="pt-3 border-t border-line">
                            <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Custom Design Specifications</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                              {Object.entries(job.custom_order_data)
                                .filter(([label]) => !['roster', 'team_roster', 'fabric_preference', 'team_name'].includes(label))
                                .map(([label, value]) => (
                                  <div key={label} className="text-xs">
                                    <span className="text-[10px] font-bold text-ink-muted uppercase block truncate">{label.replaceAll('_', ' ')}</span>
                                    <span className="font-semibold text-ink block truncate">
                                      {typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '—'}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* 2. Production Instructions & Cut Sheet */}
                <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center shrink-0">
                      <Scissors size={16} className="text-amber-700" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-bold text-ink">Production Cut Sheet & Tailor Notes</h2>
                      <p className="text-xs text-ink-muted mt-0.5">Instructions for manggagawa — stitch types, seam allowances, linings, and embellishments</p>
                    </div>
                  </div>

                  {(() => {
                    const catalogImageUrl = job.catalog_item?.images?.find(i => i.is_primary)?.image_url
                      ?? job.catalog_item?.images?.[0]?.image_url
                      ?? job.catalog_item?.fabric_image_url
                      ?? null;
                    const heroImages = [catalogImageUrl, ...(job.reference_images ?? [])].filter((u): u is string => !!u);
                    const mainImage = heroImages[0];
                    const extraImages = heroImages.slice(1);

                    if (!mainImage) {
                      return (
                        <div className="space-y-2">
                          {job.reference_link && (
                            <a
                              href={job.reference_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-taupe hover:underline font-bold mb-2 inline-flex items-center gap-1.5"
                            >
                              <LinkIcon size={12} /> External Reference Link
                            </a>
                          )}
                          <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={5}
                            placeholder="e.g. Use cocoon silk panel A for the back. French seam on collar. Add 1cm allowance all sides. Embroidery on left chest pocket only..."
                            className="w-full bg-[#FFFDF7] border border-amber-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-ink placeholder-[#C5BDBA] focus:outline-none resize-y min-h-[120px] leading-relaxed shadow-2xs"
                          />
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
                        <div className="space-y-2.5">
                          <a
                            href={mainImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block aspect-3/4 bg-sunken rounded-xl overflow-hidden border border-line shadow-2xs"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={mainImage} alt={job.catalog_item?.name ?? 'Design reference'} className="w-full h-full object-cover" />
                          </a>
                          {job.catalog_item && (
                            <p className="text-xs font-bold text-ink-body flex items-center gap-1.5 truncate">
                              <BookOpen size={13} className="text-taupe shrink-0" /> {job.catalog_item.name}
                            </p>
                          )}
                          {extraImages.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {extraImages.map(url => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img key={url} src={url} alt="Additional reference" className="h-12 w-12 object-cover rounded-lg border border-line shadow-2xs" />
                              ))}
                            </div>
                          )}
                          {job.reference_link && (
                            <a
                              href={job.reference_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-taupe hover:underline font-bold inline-flex items-center gap-1.5"
                            >
                              <LinkIcon size={12} /> Reference link
                            </a>
                          )}
                        </div>

                        <textarea
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          placeholder="e.g. Use cocoon silk panel A for the back. French seam on collar. Add 1cm allowance all sides. Embroidery on left chest pocket only..."
                          className="w-full min-h-[220px] bg-[#FFFDF7] border border-amber-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-ink placeholder-[#C5BDBA] focus:outline-none resize-none overflow-y-auto leading-relaxed shadow-2xs"
                        />
                      </div>
                    );
                  })()}

                  <p className="text-[11px] text-ink-muted flex items-center gap-1.5 pt-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    These cut sheet instructions will automatically print on the physical Work Ticket.
                  </p>
                </div>

                {/* 3. Linked Measurement Profile Card */}
                {job.measurement && (
                  <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-line pb-3">
                      <h2 className="text-base font-bold text-ink flex items-center gap-2">
                        <Ruler size={17} className="text-taupe" /> {job.measurement.profile_name}
                      </h2>
                      {job.customer && (
                        <Link
                          href={`/dashboard/customers/${job.customer.id}?tab=measurements`}
                          className="text-xs font-bold text-taupe hover:underline"
                        >
                          Customer Measurements →
                        </Link>
                      )}
                    </div>

                    {job.measurement.is_stale && (
                      <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl p-3.5 shadow-2xs">
                        <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-600" />
                        <div className="flex-1">
                          <p className="font-bold">A newer measurement profile was updated after this order was placed.</p>
                          <p className="mt-0.5 text-amber-700">Would you like to sync this job with the latest customer measurements?</p>
                          {job.measurement.current_version_id && (
                            <button
                              type="button"
                              onClick={() => handleUseCurrentMeasurement(job.measurement!.current_version_id!)}
                              className="mt-2 text-xs font-bold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors shadow-2xs"
                            >
                              Sync with Current Version
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {Object.keys(job.measurement.metrics || {}).length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {Object.entries(job.measurement.metrics).map(([k, v]) => (
                          <div key={k} className="bg-canvas/50 border border-line rounded-xl p-2.5 text-center">
                            <p className="text-[10px] text-ink-muted font-bold uppercase truncate">{k.replaceAll('_', ' ')}</p>
                            <p className="text-sm font-bold text-ink mt-0.5">{typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v ?? '')}<span className="text-[10px] font-normal text-ink-faint ml-0.5">″</span></p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-ink-faint italic">No measurement metrics recorded.</p>
                    )}

                    {job.measurement.notes && (
                      <p className="text-xs text-ink-muted border-t border-line pt-3">
                        <strong className="text-ink-body">Measurement Notes:</strong> {job.measurement.notes}
                      </p>
                    )}
                  </div>
                )}

                {/* 4. Team Roster / Bulk Size Sheet Table Card (if team order) */}
                {(() => {
                  const teamRoster = (job.custom_order_data?.team_roster || job.custom_order_data?.roster) as RosterItem[] | undefined;
                  if (!teamRoster || teamRoster.length === 0) return null;
                  const doneCount = teamRoster.filter(r => r.completed).length;
                  return (
                    <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                      <div className="flex items-center justify-between border-b border-line pb-3">
                        <h2 className="text-base font-bold text-ink flex items-center gap-2">
                          <Shirt size={17} className="text-taupe" /> Team Roster & Size Sheet
                        </h2>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${doneCount === teamRoster.length ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-sunken text-ink-muted border border-line'}`}>
                          {doneCount}/{teamRoster.length} Completed
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs divide-y divide-line">
                          <thead>
                            <tr className="text-ink-muted font-bold uppercase tracking-wider text-[10px]">
                              <th className="pb-2.5 w-10">Done</th>
                              <th className="pb-2.5 w-12">#</th>
                              <th className="pb-2.5">Player / Staff Name</th>
                              <th className="pb-2.5">Print Name</th>
                              <th className="pb-2.5 w-20">Number</th>
                              <th className="pb-2.5 w-20">Size</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line/60">
                            {teamRoster.map((row, idx: number) => (
                              <tr key={`${row.name}-${row.number}-${idx}`} className={row.completed ? 'bg-emerald-50/40' : undefined}>
                                <td className="py-2.5">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleRosterItem(idx)}
                                    title={row.completed ? 'Mark as pending' : 'Mark as completed'}
                                  >
                                    {row.completed ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Circle size={16} className="text-line-strong" />}
                                  </button>
                                </td>
                                <td className="py-2.5 text-ink-faint font-mono">{idx + 1}</td>
                                <td className={`py-2.5 font-bold ${row.completed ? 'text-ink-faint line-through' : 'text-ink'}`}>{row.name || '—'}</td>
                                <td className="py-2.5 text-ink-muted">{row.print_name || '—'}</td>
                                <td className="py-2.5 font-mono text-ink font-bold">{row.number || '—'}</td>
                                <td className="py-2.5">
                                  <span className="px-2 py-0.5 bg-canvas border border-line rounded text-[10px] font-bold text-ink">{row.size}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Right Sidebar Column (4 of 12 columns) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Financials Snapshot Card */}
                <div className="bg-surface border border-line rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <h3 className="font-bold text-sm text-ink flex items-center gap-2">
                      <CreditCard size={15} className="text-taupe" /> Financial Breakdown
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('financials')}
                      className="text-xs font-bold text-taupe hover:underline"
                    >
                      Full Ledger →
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between text-ink-muted">
                      <span>Total Amount:</span>
                      <strong className="text-ink font-bold">₱{Number.parseFloat(String(job.total_amount || 0)).toFixed(2)}</strong>
                    </div>
                    {job.is_rush && Number.parseFloat(String(job.rush_fee || 0)) > 0 && (
                      <div className="flex justify-between text-amber-700 font-semibold">
                        <span>Includes Rush Fee:</span>
                        <span>+₱{Number.parseFloat(String(job.rush_fee)).toFixed(2)}</span>
                      </div>
                    )}
                    {job.discount_amount && Number.parseFloat(String(job.discount_amount)) > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Discount Applied:</span>
                        <span>-₱{Number.parseFloat(String(job.discount_amount)).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-ink-muted pt-2 border-t border-line">
                      <span>Total Paid So Far:</span>
                      <strong className="text-emerald-700 font-bold">₱{jobPaidSoFar.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between text-sm font-bold pt-2 border-t border-line text-ink">
                      <span>Remaining Balance:</span>
                      <span className={Number.parseFloat(String(job.balance || 0)) > 0 ? 'text-amber-700 font-extrabold' : 'text-emerald-700 font-extrabold'}>
                        ₱{Number.parseFloat(String(job.balance || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* 50% Downpayment Progress Meter */}
                  <div className="pt-2 space-y-2">
                    <div className="flex justify-between text-[11px] font-bold text-ink-muted">
                      <span>50% Downpayment Policy</span>
                      <span>{jobPaidSoFar >= requiredDownpayment ? '✓ Met' : `₱${jobPaidSoFar.toFixed(0)} / ₱${requiredDownpayment.toFixed(0)}`}</span>
                    </div>
                    <div className="w-full h-2 bg-canvas rounded-full overflow-hidden border border-line">
                      <div
                        className={`h-full rounded-full transition-all ${jobPaidSoFar >= requiredDownpayment ? 'bg-emerald-600' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(100, (jobPaidSoFar / requiredDownpayment) * 100)}%` }}
                      />
                    </div>
                    {showDownpaymentGate && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-0.5">
                        <p className="font-bold text-amber-900 flex items-center gap-1.5">
                          <CreditCard size={13} className="text-amber-700" />
                          Downpayment Required
                        </p>
                        <p className="text-amber-800 text-[11px] leading-snug">
                          ₱{downpaymentShortfall.toFixed(2)} more needed before cutting/production starts.
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('financials')}
                    className="w-full py-2.5 bg-taupe hover:bg-taupe-hover text-white text-xs font-bold rounded-xl shadow-2xs transition-colors"
                  >
                    Log Payment / Deposit
                  </button>
                </div>

                {/* Production Stage Tracker Card */}
                <div className="bg-surface border border-line rounded-2xl p-5 shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <h3 className="font-bold text-sm text-ink flex items-center gap-2">
                      <Scissors size={15} className="text-taupe" /> Pipeline Status
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('production')}
                      className="text-xs font-bold text-taupe hover:underline"
                    >
                      Timeline →
                    </button>
                  </div>

                  <div className="p-3 bg-canvas/50 border border-line rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-muted font-bold">Active Stage:</span>
                      <span className="font-bold text-ink capitalize bg-surface px-2.5 py-0.5 rounded-md border border-line shadow-2xs">
                        {job.status.replaceAll('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-line/60">
                      <span className="text-ink-muted">Assigned Tailor:</span>
                      <span className="font-bold text-ink">{job.assigned_staff?.name || 'Unassigned'}</span>
                    </div>
                  </div>

                  {job.is_outsourced && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs space-y-1">
                      <span className="font-bold text-purple-900 block">Outsourced Production</span>
                      <p className="text-purple-800">Partner: {job.partner_shop_name || 'Subcontractor'}</p>
                      {job.outsourcing_cost && (
                        <p className="text-purple-700">Cost: ₱{Number.parseFloat(String(job.outsourcing_cost)).toFixed(2)}</p>
                      )}
                    </div>
                  )}

                  {!!job.adjustment_count && job.adjustment_count > 0 && (
                    <div className="p-3 bg-canvas border border-line rounded-xl text-xs flex items-center justify-between">
                      <span className="text-ink-muted font-semibold">Fitting Adjustments:</span>
                      <span className="font-bold text-amber-700">{job.adjustment_count} round(s)</span>
                    </div>
                  )}
                </div>

                {/* Fulfillment & Tracking Card */}
                <div className="bg-surface border border-line rounded-2xl p-5 shadow-2xs space-y-3">
                  <h3 className="font-bold text-sm text-ink flex items-center gap-2 border-b border-line pb-3">
                    <Store size={15} className="text-taupe" /> Tracking & Logistics
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-canvas/50 border border-line rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">Customer Tracking Code</span>
                      <div className="flex items-center justify-between">
                        <code className="font-mono font-bold text-sm text-ink select-all">{job.tracking_code || job.order_number}</code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(job.tracking_code || job.order_number);
                          }}
                          className="p-1.5 rounded-lg border border-line bg-surface hover:bg-canvas text-ink-muted hover:text-ink transition-colors"
                          title="Copy tracking code"
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between text-ink-muted pt-1">
                      <span>Intake Channel:</span>
                      <strong className="text-ink font-semibold capitalize">{job.intake_channel}</strong>
                    </div>
                    <div className="flex justify-between text-ink-muted">
                      <span>Fulfillment Mode:</span>
                      <strong className="text-ink font-semibold capitalize">{job.fulfillment_type}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {activeTab === 'production' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Main Production Timeline Column (8 of 12 columns) */}
            <div className="lg:col-span-8 space-y-6">
              <JobProductionTimeline
                job={job}
                status={status}
                setStatus={setStatus}
                notes={notes}
                setNotes={setNotes}
                completionPhotoUrl={completionPhotoUrl}
                setCompletionPhotoUrl={setCompletionPhotoUrl}
                setCancellationReason={setCancellationReason}
                setHoldReason={setHoldReason}
                collectedAmount={Number.parseFloat(String(job.total_amount)) - Number.parseFloat(String(job.balance)) - Number.parseFloat(String(job.discount_amount ?? 0))}
                onProgressPhotoAdded={refreshJob}
              />
            </div>

            {/* Right Sidebar Column (4 of 12 columns) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Outsourcing Toggle Card */}
              <div className={`border rounded-2xl p-5 transition-colors shadow-2xs ${isOutsourced ? 'bg-taupe/5 border-taupe/30' : 'bg-surface border-line'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <label htmlFor="outsourced-toggle" className="text-sm font-bold text-ink cursor-pointer">Outsourcing</label>
                      <button
                        type="button"
                        onClick={() => setShowOutsourcingHelp(p => !p)}
                        className="text-ink-faint hover:text-taupe transition-colors"
                        title="What is this?"
                      >
                        <HelpCircle size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5">Outsource to a partner shop?</p>
                  </div>
                  <div className="relative inline-flex items-center">
                    <input
                      id="outsourced-toggle"
                      type="checkbox"
                      className="sr-only peer"
                      checked={isOutsourced}
                      onChange={(e) => setIsOutsourced(e.target.checked)}
                    />
                    <label htmlFor="outsourced-toggle" className="w-10 h-5 bg-canvas border border-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sage cursor-pointer">
                      <span className="sr-only">Toggle Outsourcing</span>
                    </label>
                  </div>
                </div>

                {showOutsourcingHelp && (
                  <div className="mt-3 p-3 bg-canvas border border-line rounded-xl text-xs text-ink-body leading-relaxed">
                    Turn this on when you&apos;re subcontracting this job — or part of it, like beadwork or embroidery — to another shop or freelance artisan, usually because you&apos;re overbooked or don&apos;t have that skill or machine in-house. The customer still pays your full Total Amount either way — enter what <strong>you</strong> pay the partner below so you can see your real profit on this job, not just what the customer paid.
                  </div>
                )}

                {isOutsourced && (
                  <div className="mt-4 space-y-3 pt-3 border-t border-line">
                    <div>
                      <label htmlFor="partnerShopName" className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                        Partner Shop Name <span className="text-danger">*</span>
                      </label>
                      <input
                        id="partnerShopName"
                        type="text"
                        required
                        value={partnerShopName}
                        onChange={(e) => setPartnerShopName(e.target.value)}
                        placeholder="e.g. Maria's Tailoring"
                        className="w-full px-3.5 py-2 bg-surface border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe shadow-2xs"
                      />
                    </div>

                    <div>
                      <label htmlFor="outsourcingCost" className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                        What You&apos;re Paying Them <span className="text-[11px] font-normal text-ink-faint lowercase">(optional)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint font-bold text-xs">₱</span>
                        <input
                          id="outsourcingCost"
                          type="number"
                          step="0.01"
                          min="0"
                          value={outsourcingCost}
                          onChange={(e) => setOutsourcingCost(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-7 pr-3 py-2 bg-surface border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>

                    {Number.parseFloat(outsourcingCost || '0') > 0 && (() => {
                      const total = Number.parseFloat(String(job.total_amount)) || 0;
                      const cost = Number.parseFloat(outsourcingCost) || 0;
                      const profit = total - cost;
                      const isLoss = profit <= 0;
                      return (
                        <div className={`flex items-center justify-between px-3.5 py-2 rounded-xl border text-xs ${isLoss ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-sage/10 border-sage/20 text-sage'}`}>
                          <span className="font-medium">{isLoss ? "Losing money" : 'Your profit'}</span>
                          <span className="font-bold">₱{profit.toFixed(2)}</span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Quick Production Context Snapshot */}
              <div className="bg-surface border border-line rounded-2xl p-5 shadow-2xs space-y-3">
                <h3 className="font-bold text-sm text-ink flex items-center gap-2 border-b border-line pb-2.5">
                  <Scissors size={15} className="text-taupe" /> Production Snapshot
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-ink-muted">
                    <span>Active Stage:</span>
                    <strong className="text-ink font-bold capitalize bg-canvas px-2 py-0.5 rounded border border-line">{status.replaceAll('_', ' ')}</strong>
                  </div>
                  <div className="flex justify-between text-ink-muted">
                    <span>Assigned Tailor:</span>
                    <strong className="text-ink font-bold">{job.assigned_staff?.name || 'Unassigned'}</strong>
                  </div>
                  {job.due_date && (
                    <div className="flex justify-between text-ink-muted">
                      <span>Due Date:</span>
                      <strong className="text-ink font-bold">{new Date(job.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                    </div>
                  )}
                  {job.is_rush && (
                    <div className="flex justify-between text-amber-700 font-bold pt-1 border-t border-line">
                      <span>Priority:</span>
                      <span>⚡ Rush Order</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="space-y-6">
            <JobStaffAssignmentCard
              allStaff={allStaff}
              staffAssignments={staffAssignments}
              setStaffAssignments={setStaffAssignments}
              staffCompletions={staffCompletions}
              handleUpdateStaff={handleUpdateStaff}
              savingStaff={savingStaff}
            />
          </div>
        )}

        {activeTab === 'fulfillment' && (
          <div className="space-y-6">
            <JobFulfillmentCard
              isOutsourced={job.is_outsourced}
              partnerShopName={job.partner_shop_name}
              outsourcingCost={job.outsourcing_cost}
            />
          </div>
        )}

        {activeTab === 'financials' && (
          <div className="space-y-6" id="financials">
            <JobFinancialsCard
              job={job}
              saving={saving}
              onCharge={handleChargePayment}
              onApplyDiscount={handleApplyDiscount}
              onUpdatePayment={handleUpdatePayment}
              onRejectPayment={handleRejectPayment}
            />
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
          <div className="space-y-4">
            <p className="text-ink-body text-sm">
              Are you sure you want to delete this job order? This action cannot be undone.
            </p>
            <div className="pt-4 flex justify-end gap-3 border-t border-line">
              <button 
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-ink-body hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-danger hover:bg-danger/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                type="button"
              >
                {isDeleting && <Loader2 size={16} className="animate-spin" />}
                Yes, Delete
              </button>
            </div>
          </div>
        </Modal>

        {shop && (
          <SendCustomerMessageModal
            isOpen={showMessageModal}
            onClose={() => setShowMessageModal(false)}
            shopId={shop.id}
            jobId={job.id}
            orderNumber={job.order_number}
            shopName={shop.name || 'SUTURA'}
            customerName={job.customer?.name || 'Customer'}
            customerEmail={job.customer?.email}
          />
        )}
      </div>

      {/* Print View */}
      <div className="hidden print:block w-full text-black text-sm">
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-wider">{shop?.name || 'SUTURA'}</h1>
            <p className="text-gray-600 font-medium">Job Order Work Ticket</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">#{job.order_number}</p>
            <p className="text-gray-600 font-medium mt-1">Printed: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="space-y-2">
            <h2 className="font-bold uppercase tracking-widest text-xs border-b border-black pb-1 mb-3">Customer Information</h2>
            <p className="text-base"><strong>Name:</strong> {job.customer?.name || 'Unspecified'}</p>
          </div>
          <div className="space-y-2">
            <h2 className="font-bold uppercase tracking-widest text-xs border-b border-black pb-1 mb-3">Job Details</h2>
            <p className="text-base"><strong>Service:</strong> {job.service?.name}</p>
            {job.garment_category && (
              <p className="text-base"><strong>Garment:</strong> {GARMENT_CATEGORY_LABELS[job.garment_category] ?? job.garment_category}</p>
            )}
            {job.material_source && (
              <p className="text-base"><strong>Material:</strong> {job.material_source === 'customer_supplied' ? "Customer's Own" : 'Shop Supplied'}</p>
            )}
            <p className="text-base"><strong>Intake Channel:</strong> {job.intake_channel.replace('_', ' ').toUpperCase()}</p>
            <p className="text-base"><strong>Fulfillment:</strong> Store Pickup</p>
            <p className="text-base"><strong>Status:</strong> {job.status.replaceAll('_', ' ').toUpperCase()}</p>
            {job.due_date && <p className="text-base"><strong>Due Date:</strong> {new Date(job.due_date).toLocaleDateString()}</p>}
          </div>
        </div>

        {job.is_outsourced && (
          <div className="border-2 border-black rounded-lg p-3 mb-6">
            <p className="text-sm font-black uppercase tracking-wide">
              ⚠ Outsourced to Partner Shop{job.partner_shop_name ? `: ${job.partner_shop_name}` : ''}
            </p>
          </div>
        )}

        {job.measurement && (
          <div className="mb-8">
            <h2 className="font-bold uppercase tracking-widest text-xs border-b border-black pb-1 mb-3">
              Measurements — {job.measurement.profile_name}
            </h2>
            {Object.keys(job.measurement.metrics || {}).length > 0 ? (
              <div className="grid grid-cols-4 gap-x-8 gap-y-3">
                {Object.entries(job.measurement.metrics).map(([k, v]) => (
                  <div key={k} className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">{k.replaceAll('_', ' ')}</span>
                    <span className="font-medium text-base border-b border-dashed border-gray-300 pb-1">{typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v ?? '')}″</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 italic">No measurement fields recorded.</p>
            )}
            {job.measurement.notes && <p className="text-sm mt-2"><strong>Notes:</strong> {job.measurement.notes}</p>}
          </div>
        )}

        {job.custom_order_data && Object.keys(job.custom_order_data).length > 0 && (
          <div className="mb-8">
            <h2 className="font-bold uppercase tracking-widest text-xs border-b border-black pb-1 mb-3">Custom Specifications</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {Object.entries(job.custom_order_data)
                .filter(([k]) => !['roster', 'team_roster'].includes(k))
                .map(([k, v]) => (
                  <div key={k} className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">{k.replaceAll('_', ' ')}</span>
                    <span className="font-medium text-base border-b border-dashed border-gray-300 pb-1">
                      {typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? String(v) : '—'}
                    </span>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="font-bold uppercase tracking-widest text-xs border-b border-black pb-1 mb-3">Production Notes & Instructions</h2>
          <div className="min-h-[120px] border border-black p-4 rounded bg-gray-50/50">
            {job.notes ? (
              <p className="whitespace-pre-wrap text-base">{job.notes}</p>
            ) : (
              <p className="text-gray-400 italic">No special instructions provided.</p>
            )}
          </div>
        </div>
        
        {/* QA Sign-off area */}
        <div className="mt-16 pt-8 border-t border-dashed border-gray-400">
          <div className="flex justify-between items-end px-8">
            <div className="text-center w-48">
              <div className="border-b border-black h-8 mb-2"></div>
              <p className="text-xs uppercase font-semibold">Master Cutter</p>
            </div>
            <div className="text-center w-48">
              <div className="border-b border-black h-8 mb-2"></div>
              <p className="text-xs uppercase font-semibold">Sewing Quality Check</p>
            </div>
            <div className="text-center w-48">
              <div className="border-b border-black h-8 mb-2"></div>
              <p className="text-xs uppercase font-semibold">Final Finishing</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
