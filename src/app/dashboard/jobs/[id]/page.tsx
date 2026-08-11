'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Save, Trash2, ShoppingBag, Store, Printer, CreditCard, AlertTriangle, Scissors, X, HelpCircle, LayoutGrid, Users, Zap, Ruler, Link as LinkIcon, BookOpen, ListChecks, Shirt, Mail, CheckCircle2, Circle, RotateCcw } from 'lucide-react';
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
  const [showRejectOrderForm, setShowRejectOrderForm] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [rejectOrderReason, setRejectOrderReason] = useState('');
  const [rejectingOrder, setRejectingOrder] = useState(false);
  // In-page tabs — the page used to stack every card top-to-bottom (~10
  // cards), which made it hard to focus on one concern at a time. Local
  // state, not route-based: everything here shares state from useJobDetail
  // (job, saving, notes, status, etc.) and one "Save Changes" button at the
  // top must keep working no matter which tab is active.
  const [activeTab, setActiveTab] = useState<'overview' | 'production' | 'staff' | 'fulfillment' | 'financials'>('overview');

  // Deep links like /dashboard/jobs/{id}#financials (used by the Home
  // dashboard's "Log DP" shortcut) land on this tab-based page — the hash
  // never selects a tab on its own since tabs are local state, not routes.
  useEffect(() => {
    const validTabs = ['overview', 'production', 'staff', 'fulfillment', 'financials'] as const;
    const hash = window.location.hash.replace('#', '');
    if ((validTabs as readonly string[]).includes(hash)) {
      setActiveTab(hash as typeof activeTab);
    }
  }, []);

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
    handleRejectOrder,
    handleUseCurrentMeasurement,
    handleToggleRosterItem,
    handleDelete,
  } = useJobDetail(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-[#A8A19A]">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading job order details...
      </div>
    );
  }

  if (!job) {
    return <div className="text-[#A8A19A]">Job Order not found.</div>;
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
      <div className="print:hidden max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-white shadow-sm border border-[#EBE6E0] text-[#827A73] hover:text-[#2D2A26] transition-colors"
              type="button"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight flex items-center flex-wrap gap-2">
                {job.order_number}
                {job.intake_channel === 'online' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    <ShoppingBag size={11} /> Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[#F0EAE3] text-[#827A73] px-2 py-0.5 rounded-full">
                    <Store size={11} /> Walk-in
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Store size={11} /> Pickup
                </span>
                {job.is_rush && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full animate-pulse border border-amber-200">
                    <Zap size={11} /> Rush Order
                  </span>
                )}
              </h1>
              <p className="text-[#827A73] text-sm mt-1">Manage lifecycle and financials</p>
              {job.tracking_code && (
                <p className="text-xs text-[#A8A19A] mt-1">
                  Tracking code: <span className="font-mono font-semibold text-[#524A44] select-all">{job.tracking_code}</span>
                  <span className="ml-1">— give this to the customer so they can check status without logging in</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowMessageModal(true)}
              className="p-2 rounded-lg bg-white shadow-sm border border-[#EBE6E0] text-[#A8A19A] hover:text-[#524A44] transition-colors flex items-center gap-2"
              title="Send Update to Customer"
              type="button"
            >
              <Mail size={18} />
            </button>
            <Link
              href={`/print/jobs/${job.id}/ticket`}
              target="_blank"
              className="p-2 rounded-lg bg-white shadow-sm border border-[#EBE6E0] text-[#A8A19A] hover:text-[#524A44] transition-colors flex items-center gap-2"
              title="Print Work Ticket"
            >
              <Printer size={18} />
            </Link>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-2 rounded-lg bg-white shadow-sm border border-[#EBE6E0] text-[#A8A19A] hover:text-[#B26959] transition-colors flex items-center gap-2"
              title="Delete Job Order"
              type="button"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={handleUpdate}
              disabled={saving}
              className="bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              type="button"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
              Save Changes
            </button>
          </div>
        </div>

        {/* DP Gate Alert — tracks progress toward the 50% threshold, not just
            whether anything at all has been paid, so a token payment doesn't
            silently make this look resolved. */}
        {showDownpaymentGate && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl px-5 py-4 flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <CreditCard size={18} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-amber-800 text-sm">
                {jobPaidSoFar > 0 ? 'Downpayment Incomplete' : 'No Downpayment Recorded'}
              </p>
              <p className="text-amber-700 text-xs mt-0.5">
                {jobPaidSoFar > 0
                  ? `₱${jobPaidSoFar.toFixed(2)} of the required ₱${requiredDownpayment.toFixed(2)} (50%) collected — ₱${downpaymentShortfall.toFixed(2)} more is needed before cutting/production can begin.`
                  : `Per shop policy: a 50% downpayment (₱${requiredDownpayment.toFixed(2)}) is required before cutting/production begins. Log the payment below.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('financials')}
              className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
            >
              Log DP →
            </button>
          </div>
        )}

        {/* Rush Order Alert */}
        {job.is_rush && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-3 flex items-center gap-3">
            <AlertTriangle size={15} className="text-orange-500 shrink-0" />
            <p className="text-orange-700 text-sm font-semibold">Rush Order - This job is on an expedited production schedule.</p>
          </div>
        )}

        {/* Cancellation Reason */}
        {job.status === 'cancelled' && job.cancellation_reason && (
          <div className="bg-[#B26959]/10 border border-[#B26959]/25 rounded-2xl px-5 py-3 flex items-start gap-3">
            <X size={15} className="text-[#B26959] shrink-0 mt-0.5" />
            <div>
              <p className="text-[#9A5C4F] text-sm font-semibold">This order was cancelled</p>
              <p className="text-[#9A5C4F]/80 text-xs mt-0.5">
                Reason: {CANCELLATION_REASON_LABELS[job.cancellation_reason] ?? job.cancellation_reason}
              </p>
            </div>
          </div>
        )}

        {/* Rejection Reason */}
        {job.status === 'rejected' && job.rejection_reason && (
          <div className="bg-[#B26959]/10 border border-[#B26959]/25 rounded-2xl px-5 py-3 flex items-start gap-3">
            <X size={15} className="text-[#B26959] shrink-0 mt-0.5" />
            <div>
              <p className="text-[#9A5C4F] text-sm font-semibold">This order was rejected</p>
              <p className="text-[#9A5C4F]/80 text-xs mt-0.5">Reason: {job.rejection_reason}</p>
            </div>
          </div>
        )}

        {/* Decline Order — only valid while the order is still pending;
            backend restricts this to shop_owner/branch_manager server-side. */}
        {job.status === 'pending' && (
          <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-5">
            {showRejectOrderForm ? (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Decline this order</p>
                <input
                  type="text"
                  value={rejectOrderReason}
                  onChange={e => setRejectOrderReason(e.target.value)}
                  placeholder="Why are you declining this order?"
                  className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-rose-400"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowRejectOrderForm(false); setRejectOrderReason(''); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#827A73] hover:text-[#2D2A26]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={rejectingOrder || !rejectOrderReason.trim()}
                    onClick={async () => {
                      setRejectingOrder(true);
                      try {
                        await handleRejectOrder(rejectOrderReason.trim());
                        setShowRejectOrderForm(false);
                        setRejectOrderReason('');
                      } catch {
                        // handled by parent
                      } finally {
                        setRejectingOrder(false);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
                  >
                    {rejectingOrder ? 'Declining…' : 'Confirm Decline'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowRejectOrderForm(true)}
                className="w-full py-2 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg hover:bg-rose-50 transition-colors"
              >
                Decline Order
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1 border-b border-[#EBE6E0]">
          {([
            { key: 'overview', label: 'Overview', icon: LayoutGrid },
            { key: 'production', label: 'Production', icon: Scissors },
            { key: 'staff', label: 'Staff', icon: Users },
            { key: 'fulfillment', label: 'Fulfillment', icon: Store },
            { key: 'financials', label: 'Financials', icon: CreditCard },
          ] as const).map(tab => {
            const TabIcon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                  active
                    ? 'border-[#9A8073] text-[#2D2A26]'
                    : 'border-transparent text-[#827A73] hover:text-[#2D2A26]'
                }`}
              >
                <TabIcon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
              <h2 className="text-lg font-medium text-[#2D2A26] mb-4">Job Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#A8A19A] block mb-1">Customer</span>
                  {job.customer ? (
                    <Link 
                      href={`/dashboard/customers/${job.customer.id}`} 
                      className="text-[#9A8073] hover:text-[#9A8073]/80 hover:underline font-semibold flex items-center gap-1.5"
                    >
                      {job.customer.name}
                      <span className="text-[10px] text-[#A8A19A] font-normal">(View Profile)</span>
                    </Link>
                  ) : (
                    <span className="text-[#524A44] font-medium">Unspecified</span>
                  )}
                </div>
                <div>
                  <span className="text-[#A8A19A] block mb-1">Service</span>
                  <span className="text-[#524A44] font-medium">{job.service?.name}</span>
                </div>
                {job.garment_category && (
                  <div>
                    <span className="text-[#A8A19A] mb-1 flex items-center gap-1.5">
                      <Shirt size={13} /> Garment Category
                    </span>
                    <span className="text-[#524A44] font-medium">{GARMENT_CATEGORY_LABELS[job.garment_category] ?? job.garment_category}</span>
                  </div>
                )}
                {job.material_source && (
                  <div>
                    <span className="text-[#A8A19A] block mb-1">Fabric / Material Source</span>
                    <span className="text-[#524A44] font-medium">
                      {job.material_source === 'customer_supplied' ? "Customer's Own" : 'Shop Supplied'}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-[#A8A19A] block mb-1">Assigned Staff</span>
                  <span className="text-[#524A44] font-medium">{job.assigned_staff?.name || 'Unassigned'}</span>
                </div>
                <div>
                  <span className="text-[#A8A19A] block mb-1">Total Amount</span>
                  <span className="text-[#524A44] font-medium">₱{Number.parseFloat(String(job.total_amount)).toFixed(2)}</span>
                </div>
                {job.is_rush && (
                  <div>
                    <span className="text-[#A8A19A] mb-1 flex items-center gap-1.5">
                      <Zap size={13} /> Rush Fee
                    </span>
                    <span className="text-[#B26959] font-semibold">₱{Number.parseFloat(String(job.rush_fee || '0')).toFixed(2)}</span>
                  </div>
                )}
                {!!job.adjustment_count && job.adjustment_count > 0 && (
                  <div>
                    <span className="text-[#A8A19A] mb-1 flex items-center gap-1.5">
                      <RotateCcw size={13} /> Adjustment Rounds
                    </span>
                    <span className={`font-semibold ${job.adjustment_count > 1 ? 'text-[#B26959]' : 'text-[#524A44]'}`}>
                      {job.adjustment_count}
                      {job.first_adjustment_at && (
                        <span className="text-[#A8A19A] font-normal text-xs ml-1.5">
                          (first on {new Date(job.first_adjustment_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Linked Measurement Profile ───────────────────────────── */}
            {job.measurement && (
              <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-[#2D2A26] flex items-center gap-2">
                    <Ruler size={18} className="text-[#9A8073]" /> {job.measurement.profile_name}
                  </h2>
                  {job.customer && (
                    <Link
                      href={`/dashboard/customers/${job.customer.id}?tab=measurements`}
                      className="text-xs font-semibold text-[#9A8073] hover:underline"
                    >
                      View / Edit →
                    </Link>
                  )}
                </div>
                {job.measurement.is_stale && (
                  <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg p-3">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">This measurement has been corrected since this job was created.</p>
                      <p className="mt-0.5">The numbers below are outdated — a newer version of this profile exists.</p>
                      {job.measurement.current_version_id && (
                        <button
                          type="button"
                          onClick={() => handleUseCurrentMeasurement(job.measurement!.current_version_id!)}
                          className="mt-2 text-xs font-semibold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors"
                        >
                          Use Current Version
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {Object.keys(job.measurement.metrics || {}).length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(job.measurement.metrics).map(([k, v]) => (
                      <div key={k} className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-2.5 py-2 text-center">
                        <p className="text-[9px] text-[#A8A19A] font-bold uppercase">{k.replace(/_/g, ' ')}</p>
                        <p className="text-sm font-bold text-[#2D2A26] mt-0.5">{String(v)}<span className="text-[9px] font-normal text-[#A8A19A] ml-0.5">″</span></p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#A8A19A] italic">No measurement fields recorded on this profile.</p>
                )}
                {job.measurement.notes && (
                  <p className="text-xs text-[#524A44] border-t border-[#EBE6E0] pt-3 mt-3">
                    <span className="font-semibold text-[#827A73]">Notes: </span>
                    {job.measurement.notes}
                  </p>
                )}
              </div>
            )}

            {/* ── Production Cut Sheet ─────────────────────────────────── */}
            <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <Scissors size={16} className="text-amber-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#2D2A26]">Production Instructions</h2>
                  <p className="text-xs text-[#A8A19A] mt-0.5">Cut sheet for the manggagawa — fabric panels, stitch type, linings, embellishments</p>
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
                    <>
                      {job.reference_link && (
                        <a
                          href={job.reference_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-taupe hover:underline font-medium mb-3 inline-flex items-center gap-1.5"
                        >
                          <LinkIcon size={12} /> Reference link
                        </a>
                      )}
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={5}
                        placeholder="e.g. Use cocoon silk panel A for the back. French seam on collar. Add 1cm allowance all sides. Embroidery on left chest pocket only..."
                        className="w-full bg-[#FFFDF7] border border-amber-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-[#2D2A26] placeholder-[#C5BDBA] focus:outline-none resize-y min-h-[100px] leading-relaxed"
                      />
                    </>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
                    {/* Reference image — sized to match Design Catalog card images */}
                    <div className="space-y-2">
                      <a
                        href={mainImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-3/4 bg-[#F0EAE3] rounded-xl overflow-hidden border border-[#EBE6E0]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={mainImage} alt={job.catalog_item?.name ?? 'Design reference'} className="w-full h-full object-cover" />
                      </a>
                      {job.catalog_item && (
                        <p className="text-xs font-medium text-[#524A44] flex items-center gap-1.5">
                          <BookOpen size={12} className="text-[#9A8073]" /> {job.catalog_item.name}
                        </p>
                      )}
                      {extraImages.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {extraImages.map(url => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={url} src={url} alt="Additional reference" className="h-12 w-12 object-cover rounded-lg border border-[#EBE6E0]" />
                          ))}
                        </div>
                      )}
                      {job.reference_link && (
                        <a
                          href={job.reference_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-taupe hover:underline font-medium inline-flex items-center gap-1.5"
                        >
                          <LinkIcon size={12} /> Reference link
                        </a>
                      )}
                    </div>

                    {/* Notes — matches the image column's height, scrolls internally
                        instead of growing the card taller. */}
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="e.g. Use cocoon silk panel A for the back. French seam on collar. Add 1cm allowance all sides. Embroidery on left chest pocket only..."
                      className="w-full min-h-[280px] bg-[#FFFDF7] border border-amber-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-[#2D2A26] placeholder-[#C5BDBA] focus:outline-none resize-none overflow-y-auto leading-relaxed"
                    />
                  </div>
                );
              })()}
              <p className="text-[10px] text-[#A8A19A] mt-2 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-300 shrink-0" />
                These notes will print on the Work Ticket for the production team.
              </p>
            </div>

            {/* Custom Specifications Card */}
            {job.custom_order_data && Object.keys(job.custom_order_data).some(k => k !== 'roster' && k !== 'team_roster') ? (
              <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
                <h2 className="text-lg font-medium text-[#2D2A26] mb-4 flex items-center gap-2">
                  <ListChecks size={18} className="text-[#9A8073]" /> Custom Specifications
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {Object.entries(job.custom_order_data)
                    .filter(([label]) => label !== 'roster' && label !== 'team_roster')
                    .map(([label, value]) => (
                      <div key={label}>
                        <span className="text-[#A8A19A] block mb-1 capitalize">{label.replaceAll('_', ' ')}</span>
                        <span className="text-[#524A44] font-medium">{typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '—'}</span>
                      </div>
                    ))}
                </div>
              </div>
            ) : null}

            {/* Team Roster / Size Sheet Table Card */}
            {(() => {
              const teamRoster = (job.custom_order_data?.team_roster || job.custom_order_data?.roster) as RosterItem[] | undefined;
              if (!teamRoster || teamRoster.length === 0) return null;
              const doneCount = teamRoster.filter(r => r.completed).length;
              return (
                <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-[#2D2A26] flex items-center gap-2">
                      <Shirt size={18} className="text-[#9A8073]" /> Team Roster & Size Sheet
                    </h2>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${doneCount === teamRoster.length ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-[#F0EAE3] text-[#827A73]'}`}>
                      {doneCount}/{teamRoster.length} done
                    </span>
                  </div>
                  {/* Mobile cards — no sideways scroll needed for a 5-column table */}
                  <div className="md:hidden divide-y divide-zinc-150">
                    {teamRoster.map((row, idx: number) => (
                      <div key={`${row.name}-${row.number}-${idx}`} className="py-2.5 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleRosterItem(idx)}
                          className="shrink-0"
                          title={row.completed ? 'Mark as not done' : 'Mark as done'}
                        >
                          {row.completed ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Circle size={18} className="text-zinc-300" />}
                        </button>
                        <span className="text-zinc-400 font-mono text-xs w-5 shrink-0">{idx + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className={`font-medium text-sm truncate ${row.completed ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>{row.name || '—'}</p>
                          {row.print_name && <p className="text-zinc-500 text-xs truncate">{row.print_name}</p>}
                        </div>
                        {row.number && <span className="font-mono text-zinc-600 font-bold text-sm shrink-0">#{row.number}</span>}
                        <span className="px-2 py-0.5 bg-zinc-100 rounded text-[10px] font-bold shrink-0">{row.size}</span>
                      </div>
                    ))}
                  </div>

                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs divide-y divide-zinc-200">
                      <thead>
                        <tr>
                          <th className="pb-2 font-semibold text-zinc-600 w-10">Done</th>
                          <th className="pb-2 font-semibold text-zinc-600 w-12">#</th>
                          <th className="pb-2 font-semibold text-zinc-600">Player/Employee Name</th>
                          <th className="pb-2 font-semibold text-zinc-600">Print Name / Nickname</th>
                          <th className="pb-2 font-semibold text-zinc-600 w-24">Number</th>
                          <th className="pb-2 font-semibold text-zinc-600 w-24">Size</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-150">
                        {teamRoster.map((row, idx: number) => (
                          <tr key={`${row.name}-${row.number}-${idx}`} className={row.completed ? 'bg-emerald-50/40' : undefined}>
                            <td className="py-2.5">
                              <button
                                type="button"
                                onClick={() => handleToggleRosterItem(idx)}
                                title={row.completed ? 'Mark as not done' : 'Mark as done'}
                              >
                                {row.completed ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Circle size={16} className="text-zinc-300" />}
                              </button>
                            </td>
                            <td className="py-2.5 text-zinc-500 font-mono">{idx + 1}</td>
                            <td className={`py-2.5 font-medium ${row.completed ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>{row.name || '—'}</td>
                            <td className="py-2.5 text-zinc-700">{row.print_name || '—'}</td>
                            <td className="py-2.5 font-mono text-zinc-600 font-bold">{row.number || '—'}</td>
                            <td className="py-2.5 text-zinc-700">
                              <span className="px-2 py-0.5 bg-zinc-100 rounded text-[10px] font-bold">{row.size}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-right text-xs text-[#827A73] font-medium mt-4">
                    Total Items: {teamRoster.length}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'production' && (
          <div className="space-y-6">
            {/* Outsourcing Toggle */}
            <div className={`shadow-sm border rounded-2xl p-6 transition-colors ${isOutsourced ? 'bg-[#9A8073]/5 border-[#9A8073]/30' : 'bg-white border-[#EBE6E0]'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="outsourced-toggle" className="text-lg font-medium text-[#2D2A26] cursor-pointer">Outsourcing</label>
                    <button
                      type="button"
                      onClick={() => setShowOutsourcingHelp(p => !p)}
                      className="text-[#A8A19A] hover:text-[#9A8073] transition-colors"
                      title="What is this?"
                    >
                      <HelpCircle size={15} />
                    </button>
                  </div>
                  <p className="text-sm text-[#827A73]">Is this order being outsourced to a partner shop?</p>
                </div>
                <div className="relative inline-flex items-center">
                  <input
                    id="outsourced-toggle"
                    type="checkbox"
                    className="sr-only peer"
                    checked={isOutsourced}
                    onChange={(e) => setIsOutsourced(e.target.checked)}
                  />
                  <label htmlFor="outsourced-toggle" className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7A8B76] cursor-pointer">
                    <span className="sr-only">Toggle Outsourcing</span>
                  </label>
                </div>
              </div>

              {showOutsourcingHelp && (
                <div className="mt-3 p-3 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-xs text-[#524A44] leading-relaxed">
                  Turn this on when you&apos;re subcontracting this job — or part of it, like beadwork or embroidery — to another shop or freelance artisan, usually because you&apos;re overbooked or don&apos;t have that skill or machine in-house. The customer still pays your full Total Amount either way — enter what <strong>you</strong> pay the partner below so you can see your real profit on this job, not just what the customer paid.
                </div>
              )}

              {isOutsourced && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label htmlFor="partnerShopName" className="block text-sm font-medium text-[#524A44] mb-1">Partner Shop Name <span className="text-[#B26959]">*</span></label>
                    <input
                      id="partnerShopName"
                      type="text"
                      required
                      value={partnerShopName}
                      onChange={(e) => setPartnerShopName(e.target.value)}
                      placeholder="e.g. Maria's Tailoring"
                      className="w-full px-4 py-2 bg-white border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                    />
                  </div>

                  <div>
                    <label htmlFor="outsourcingCost" className="block text-sm font-medium text-[#524A44] mb-1">
                      What You&apos;re Paying Them <span className="text-xs font-normal text-[#A8A19A]">(optional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A] font-medium text-sm">₱</span>
                      <input
                        id="outsourcingCost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={outsourcingCost}
                        onChange={(e) => setOutsourcingCost(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-7 pr-3 py-2 bg-white border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>

                  {Number.parseFloat(outsourcingCost || '0') > 0 && (() => {
                    const total = Number.parseFloat(String(job.total_amount)) || 0;
                    const cost = Number.parseFloat(outsourcingCost) || 0;
                    const profit = total - cost;
                    const isLoss = profit <= 0;
                    return (
                      <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm ${isLoss ? 'bg-red-50 border-red-200 text-red-600' : 'bg-[#7A8B76]/10 border-[#7A8B76]/20 text-[#7A8B76]'}`}>
                        <span className="font-medium">{isLoss ? "You're losing money on this job" : 'Your profit on this job'}</span>
                        <span className="font-bold">₱{profit.toFixed(2)}</span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Production Timeline Card */}
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
              // applyDiscount reduces balance directly, not total_amount — this
              // feeds the cancellation modal's "₱X already collected" figure,
              // which directly informs the forfeited-deposit decision, so it
              // must reflect real cash received, not cash plus a discount
              // that was never actually paid.
              collectedAmount={Number.parseFloat(String(job.total_amount)) - Number.parseFloat(String(job.balance)) - Number.parseFloat(String(job.discount_amount ?? 0))}
              onProgressPhotoAdded={refreshJob}
            />
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
            <p className="text-[#524A44] text-sm">
              Are you sure you want to delete this job order? This action cannot be undone.
            </p>
            <div className="pt-4 flex justify-end gap-3 border-t border-[#EBE6E0]">
              <button 
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:text-[#2D2A26] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-[#B26959] hover:bg-[#B26959]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
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
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">{k.replace(/_/g, ' ')}</span>
                    <span className="font-medium text-base border-b border-dashed border-gray-300 pb-1">{String(v)}″</span>
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
                .filter(([k]) => k !== 'roster')
                .map(([k, v]) => (
                  <div key={k} className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">{k}</span>
                    <span className="font-medium text-base border-b border-dashed border-gray-300 pb-1">{typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? String(v) : '—'}</span>
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
