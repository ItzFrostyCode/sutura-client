'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { getMediaUrl } from '@/lib/media';
import { PRODUCTION_COLUMNS, normalizeJobStatus } from '@/components/jobs/jobHelpers';
import {
  Check, Copy, Ban, AlertCircle, PauseCircle, CalendarDays, CalendarClock, Ruler, Shirt, Store, Wallet, X,
} from 'lucide-react';

export interface TrackedAppointment {
  id: number;
  appointment_type: string;
  status: string;
  scheduled_at: string;
  checked_in_at?: string | null;
  duration_minutes: number | null;
  service_name: string | null;
  branch: { name: string; address: string | null; city: string | null } | null;
}

export interface TrackedOrder {
  order_number: string;
  tracking_code?: string | null;
  status: string;
  garment_category: string | null;
  quantity?: number;
  catalog_item_name?: string | null;
  service_name: string | null;
  service_package?: { id: number; name: string; services?: string[] } | null;
  is_rush: boolean;
  due_date: string | null;
  // Time-of-day refinement on top of due_date — mainly meaningful for
  // same-day repair ETAs ("ready at 3:00 PM"), additive, not a replacement.
  estimated_ready_at?: string | null;
  /** Ready for Fitting: visit the shop by this date (YYYY-MM-DD). */
  fitting_visit_by?: string | null;
  /** The shop's "come in within N days" setting. */
  fitting_visit_days?: number | null;
  /** The shop's Ready-for-Fitting message, already filled in. */
  fitting_message?: string | null;
  // Which production pipeline to draw (server-derived, same signal as the
  // shop's Kanban). Absent on older responses — buildStages() then infers
  // repair from the status alone.
  pipeline?: 'custom' | 'bulk' | 'repair';
  total_amount: number;
  balance: number;
  payment_status: string;
  // Sum of GCash/PayMaya payments submitted but not yet verified by the
  // shop — never reflected in balance/payment_status until confirmed.
  pending_payment_amount?: number;
  store_branch_id?: number | null;
  payment_policy?: 'none' | 'full' | 'deposit' | 'custom' | null;
  payment_policy_percent?: number | null;
  required_deposit?: number;
  fitting_requirement?: 'none' | 'optional' | 'required' | null;
  measurement_requirement?: 'none' | 'existing' | 'shop' | null;
  /** How the customer chose to be measured (shop = "have the shop measure me"). /my-orders only. */
  measurement_source?: 'own' | 'saved' | 'shop' | null;
  /** The visit the shop booked to measure them; null until booked. /my-orders only. */
  measurement_visit?: { scheduled_at: string; status: string } | null;
  id?: number;
  created_at: string;
  updated_at?: string | null;
  // The customer's own original repair request — kept separate from any
  // staff-authored operational notes, never shown mixed together.
  repair_note?: string | null;
  customer_material_status?: 'safe' | 'damaged' | 'lost' | 'returned' | null;
  progress_photos?: string[] | null;
  /** The customer's design / reference photos (else the design's or service's picture). /my-orders only. */
  reference_images?: string[] | null;
  /** Only the photos the customer attached themselves (reference_images can fall back to the design's picture). */
  customer_photos?: string[] | null;
  // Best-effort real per-stage timestamps (see myOrderDetail's own comment)
  // — only present from /my-orders/{id}, not the guest /track lookup, so a
  // stage with no tracked data (or the guest view entirely) just shows no
  // date/time line rather than a wrong one.
  stage_timestamps?: Record<string, string | null>;
  // Appointments linked to this job (job_order_id) — 0..N, may include ones
  // scheduled before the job existed. Customer-safe subset only.
  appointments?: TrackedAppointment[];
  store: { name: string; slug: string; logo_path: string | null } | null;
}

/**
 * Customer-facing presentation collapse of the full internal pipeline into
 * the approved 6 phases (CUSTOMER-WORKFLOW.md §12) — a label only, derived
 * from the same real `status` this file's own detailed stepper already
 * renders below it. Internal statuses are never renamed or removed; this is
 * purely an additional, simpler "where are we, roughly" answer for the
 * customer, shown alongside — not instead of — the full stepper.
 */
export const CUSTOMER_PHASE_STATUS_MAP: Record<string, string> = {
  pending: 'Order Received',
  queued: 'Order Received',
  production: 'In Production',
  design: 'In Production',
  pattern_making: 'In Production',
  mass_cutting_printing: 'In Production',
  cutting: 'In Production',
  sewing: 'In Production',
  in_repair: 'In Production',
  quality_check: 'Quality Check',
  ready_for_fitting: 'Ready for Fitting',
  adjustments: 'Adjustments',
  final_adjustments: 'Adjustments',
  qc_ironing: 'Quality Check',
  qc_check: 'Quality Check',
  ready_for_pickup: 'Ready for Pickup',
  completed: 'Completed',
};

/** Exceptions are shown as-is (their own TERMINAL_STATUSES label below), never collapsed into a phase. */
export function getCustomerPhase(status: string): string | null {
  return CUSTOMER_PHASE_STATUS_MAP[status] ?? null;
}

/**
 * The customer's progress: the same 7 stages as the shop's Orders board (PRODUCTION_COLUMNS, mapped with the board's
 * own normalizeJobStatus), so "where is my order" reads the same on both sides. A repair or a team set skips Ready
 * for Fitting / Adjustments unless the order is actually in one; a stage shows its date when one was recorded.
 */
const STAGE_TIMES: Record<string, string[]> = {
  pending: ['pending'],
  production: ['production', 'design', 'pattern_making', 'mass_cutting_printing', 'mass_cutting', 'cutting', 'sewing', 'queued', 'in_repair'],
  quality_check: ['quality_check', 'qc_ironing', 'qc_check'],
  ready_for_fitting: ['ready_for_fitting'],
  adjustments: ['adjustments', 'final_adjustments'],
  ready_for_pickup: ['ready_for_pickup'],
  completed: ['completed'],
};
const FITTING_STEPS = new Set(['ready_for_fitting', 'adjustments']);

export interface TrackerStage { key: string; label: string; at: string | null }

export function trackerStages(order: Pick<TrackedOrder, 'status' | 'pipeline' | 'stage_timestamps' | 'fitting_requirement'>): { stages: TrackerStage[]; current: number } {
  const column = normalizeJobStatus(order.status);
  const times = order.stage_timestamps ?? {};
  const noFitting = order.pipeline === 'repair' || order.pipeline === 'bulk' || order.fitting_requirement === 'none';
  const stages = PRODUCTION_COLUMNS
    .filter((c) => !(noFitting && FITTING_STEPS.has(c.id) && column !== c.id && !STAGE_TIMES[c.id].some((k) => times[k])))
    .map((c) => {
      // A stage's date is the first one recorded for it (production = when work started).
      const dates = STAGE_TIMES[c.id].map((k) => times[k]).filter((d): d is string => !!d).sort();
      return { key: c.id, label: c.title, at: dates[0] ?? null };
    });
  const current = Math.max(0, stages.findIndex((st) => st.key === column));
  return { stages, current };
}

export const TERMINAL_STATUSES: Record<string, { label: string; Icon: typeof Ban; tone: string }> = {
  cancelled: { label: 'Cancelled', Icon: Ban, tone: 'text-danger bg-danger/10 border-danger/20' },
  rejected: { label: 'Rejected', Icon: AlertCircle, tone: 'text-danger bg-danger/10 border-danger/20' },
  on_hold: { label: 'On Hold', Icon: PauseCircle, tone: 'text-ink-muted bg-sunken border-line' },
};

interface OrderTrackingViewProps {
  readonly order: TrackedOrder;
  /** Kept for the callers; the progress list is always the compact vertical one. */
  readonly stepperLayout?: 'horizontal' | 'vertical';
  /** The customer's page: paying (top of the right column; first on a phone). */
  readonly pay?: React.ReactNode;
  /** The customer's page: rating and "Problem with your order?" (bottom of the right column). */
  readonly extra?: React.ReactNode;
}

const when = (iso: string) => new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
const day = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
const peso = (n: number) => `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;
const CARD = 'rounded-2xl border border-line bg-surface';

/** One fact in the summary: a small icon, a quiet label and the value. */
function Fact({ Icon, label, image, onImage, wide = false, children }: { readonly Icon: typeof Shirt; readonly label: string; readonly image?: string | null; readonly onImage?: () => void; readonly wide?: boolean; readonly children: React.ReactNode }) {
  return (
    <div className={`flex min-w-0 items-start gap-2.5 ${wide ? 'col-span-2 lg:col-span-1' : ''}`}>
      {image ? (
        <button type="button" onClick={onImage} aria-label="View the picture bigger" className="h-12 w-12 shrink-0 cursor-zoom-in overflow-hidden rounded-lg border border-line bg-sunken">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getMediaUrl(image)} alt="" className="h-full w-full object-cover" />
        </button>
      ) : <Icon size={16} className="mt-0.5 shrink-0 text-ink-faint" aria-hidden />}
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">{label}</p>
        <div className="text-sm text-ink">{children}</div>
      </div>
    </div>
  );
}

/** A photo at full size over the page; tap anywhere, X or Esc closes it. */
function PhotoLightbox({ src, onClose }: { readonly src: string; readonly onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Photo" onClick={onClose} className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/85 p-4">
      <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"><X size={22} /></button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={getMediaUrl(src)} alt="" className="max-h-[85dvh] max-w-full rounded-xl object-contain" />
    </div>,
    document.body,
  );
}

/** A row of small square photos that open big. */
function PhotoRow({ title, photos, onOpen }: { readonly title: string; readonly photos: string[]; readonly onOpen: (src: string) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">{title}</p>
      <div className="flex flex-wrap gap-2">
        {photos.map((src) => (
          <button key={src} type="button" onClick={() => onOpen(src)} aria-label={`${title}: view bigger`} className="h-16 w-16 cursor-zoom-in overflow-hidden rounded-lg border border-line bg-sunken">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getMediaUrl(src)} alt="" loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * The order page and the public tracker, Apple-style: one summary card on top (shop, order, status, the facts), then
 * two columns from 768px — progress on the left, notices and visits on the right — so it reads in one screen.
 */
export default function OrderTrackingView({ order, pay, extra }: OrderTrackingViewProps) {
  const [copied, setCopied] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  // "Your photos" = only what the customer attached; the design's / service's own picture is just the item thumbnail.
  const designPhotos = (order.customer_photos ?? []).filter(Boolean);
  const itemImage = (order.reference_images ?? []).find(Boolean) ?? null;
  const shopPhotos = (order.progress_photos ?? []).filter(Boolean);
  const itemName = order.catalog_item_name ?? order.service_package?.name ?? order.service_name ?? order.garment_category ?? 'Garment';
  const terminal = order.status in TERMINAL_STATUSES ? TERMINAL_STATUSES[order.status] : null;
  const { stages, current } = trackerStages(order);
  const done = order.status === 'completed';
  const nowLabel = terminal?.label ?? stages[current]?.label ?? 'Pending';
  const hasMaterialNote = order.customer_material_status && order.customer_material_status !== 'safe';
  const pending = order.pending_payment_amount ?? 0;
  const paid = order.balance <= 0;
  const showMeasureVisit = order.measurement_source === 'shop' && order.measurement_visit?.status !== 'completed'
    && !['completed', 'cancelled', 'rejected'].includes(order.status);
  const hasAside = order.status === 'ready_for_fitting' || showMeasureVisit || (order.appointments?.length ?? 0) > 0 || !!order.repair_note || !!hasMaterialNote
    || designPhotos.length > 0 || shopPhotos.length > 0;
  const hasRight = hasAside || !!pay || !!extra;
  const copy = async () => {
    if (!order.tracking_code) return;
    try { await navigator.clipboard.writeText(order.tracking_code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ }
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <section className={`${CARD} p-4 sm:p-5`}>
        <div className="flex items-start gap-3">
          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-line bg-sunken">
            {order.store?.logo_path
              ? <Image src={getMediaUrl(order.store.logo_path)} alt="" fill sizes="40px" className="object-cover" />
              : <Store size={18} className="m-auto mt-2.5 text-ink-faint" />}
          </span>
          <div className="min-w-0 flex-1">
            {order.store?.slug
              ? <Link href={`/store/${order.store.slug}`} className="text-[13px] font-semibold text-taupe hover:underline">{order.store.name}</Link>
              : <p className="text-[13px] font-semibold text-taupe">Order</p>}
            <h2 className="text-xl font-semibold tracking-tight text-ink">{order.order_number}</h2>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${terminal ? terminal.tone : done ? 'border-sage/25 bg-sage/10 text-sage' : 'border-taupe/20 bg-taupe/10 text-taupe-dark'}`}>{nowLabel}</span>
            {order.is_rush && <span className="rounded-full border border-danger/20 bg-danger/10 px-2 py-0.5 text-[10px] font-semibold text-danger">Rush</span>}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 lg:grid-cols-4">
          <Fact wide Icon={Shirt} label="Item" image={itemImage} onImage={() => itemImage && setPhoto(itemImage)}>
            <span className="font-medium">{itemName}</span>{(order.quantity ?? 1) > 1 && <span className="text-ink-muted"> × {order.quantity}</span>}
            {order.service_package && (order.service_package.services?.length ?? 0) > 0 && (
              <span className="block text-xs text-ink-muted">Includes {order.service_package.services!.join(', ')}</span>
            )}
          </Fact>
          <Fact Icon={CalendarDays} label="Due">{order.due_date ? day(order.due_date) : <span className="text-ink-muted">Not set</span>}</Fact>
          {order.estimated_ready_at && <Fact Icon={CalendarClock} label="Estimated ready">{when(order.estimated_ready_at)}</Fact>}
          <Fact Icon={Wallet} label="Payment">
            {paid ? <>Fully paid · {peso(order.total_amount)}</> : <><span className="font-medium">{peso(order.balance)}</span> left of {peso(order.total_amount)}</>}
            {pending > 0 && !paid && <span className="block text-xs text-amber-700">{peso(pending)} sent · the shop is checking it</span>}
          </Fact>
        </div>

        {order.tracking_code && (
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3 text-xs text-ink-muted">
            <span>Tracking code <span className="ml-1 font-mono text-[13px] font-medium text-ink">{order.tracking_code}</span></span>
            <button type="button" onClick={copy} className="flex h-8 items-center gap-1.5 rounded-full border border-line px-3 font-semibold text-ink hover:bg-sunken">
              <Copy size={12} aria-hidden /> {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </section>

      {/* Tablet and desktop: progress on the left; paying, notices, photos, visits, rating and problems on the right.
          A phone shows one column: pay first, then notices, progress, photos, visits, rating and problems
          (the two column wrappers are display:contents there, so each card takes its own order). */}
      <div className={`flex flex-col gap-4 md:grid md:items-start ${hasRight ? 'md:grid-cols-2' : ''}`}>
        <div className="contents md:block md:space-y-4">
        {/* Progress — the board's stages */}
        <section className={`${CARD} order-3 p-4 sm:p-5 md:order-none`} aria-label="Progress">
          <h3 className="mb-3 text-sm font-semibold text-ink">Progress</h3>
          {terminal ? (
            <div className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm font-semibold ${terminal.tone}`}>
              <terminal.Icon size={18} aria-hidden /> {terminal.label}
            </div>
          ) : (
            <ol>
              {stages.map((st, i) => {
                const isDone = done || i < current;
                const isNow = !done && i === current;
                const last = i === stages.length - 1;
                return (
                  <li key={st.key} className="relative flex gap-3 pb-3 last:pb-0 sm:pb-4" aria-current={isNow ? 'step' : undefined}>
                    {!last && <span aria-hidden className={`absolute left-[9px] top-6 bottom-0 w-0.5 rounded-full ${isDone ? 'bg-sage/60' : 'bg-line'}`} />}
                    <span aria-hidden className={`relative z-[1] mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      isDone ? 'bg-sage text-white' : isNow ? 'border-2 border-taupe bg-surface' : 'border-2 border-line-strong bg-surface'}`}>
                      {isDone && <Check size={12} strokeWidth={3} />}
                      {isNow && <span className="h-2 w-2 rounded-full bg-taupe" />}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3">
                      <span className={`text-sm ${isNow ? 'font-semibold text-ink' : isDone ? 'font-medium text-ink' : 'text-ink-faint'}`}>
                        {st.label}
                        {isNow && <span className="ml-2 rounded-full bg-taupe/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-taupe-dark">Now</span>}
                      </span>
                      {st.at && (isDone || isNow) && <span className="text-xs text-ink-muted">{when(st.at)}</span>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
        </div>

        {hasRight && <div className="contents md:block md:space-y-4">
          {pay && <div className="order-1 empty:hidden md:order-none">{pay}</div>}
          {order.status === 'ready_for_fitting' && (
            <section className="order-2 md:order-none rounded-2xl border border-violet-200 bg-violet-50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-violet-800"><Ruler size={16} aria-hidden /> Ready for fitting</p>
              {/* The shop's own message (Booking Flow Setup), with days and date filled in. */}
              <p className="mt-1 text-sm text-ink-body">
                {order.fitting_message || `Your garment is ready for fitting. Please visit the shop within ${order.fitting_visit_days ?? 7} days.`}
              </p>
            </section>
          )}
          {/* "Have the shop measure me": waiting for the shop to book the visit, then when to come in. */}
          {showMeasureVisit && (
            <section className="order-2 md:order-none rounded-2xl border border-taupe/25 bg-taupe/10 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-taupe-dark"><Ruler size={16} aria-hidden /> Measurement visit</p>
              <p className="mt-1 text-sm text-ink-body">
                {order.measurement_visit
                  ? <>Please come to the shop on <strong className="font-semibold text-ink">{new Date(order.measurement_visit.scheduled_at).toLocaleString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' })}</strong> so they can take your measurements.</>
                  : 'Waiting for the shop to set your measurement visit. You\'ll be notified once it\'s booked.'}
              </p>
            </section>
          )}
          {(designPhotos.length > 0 || shopPhotos.length > 0) && (
            <section className={`${CARD} order-4 md:order-none space-y-3 p-4 sm:p-5`} aria-label="Photos">
              <h3 className="text-sm font-semibold text-ink">Photos</h3>
              {shopPhotos.length > 0 && <PhotoRow title="From the shop" photos={shopPhotos} onOpen={setPhoto} />}
              {designPhotos.length > 0 && <PhotoRow title="Your photos" photos={designPhotos} onOpen={setPhoto} />}
            </section>
          )}
          {order.appointments && order.appointments.length > 0 && (
            <section className={`${CARD} order-5 md:order-none p-4 sm:p-5`}>
              <h3 className="mb-2 text-sm font-semibold text-ink">{order.appointments.length > 1 ? 'Visits' : 'Visit'}</h3>
              <ul className="divide-y divide-line">
                {order.appointments.map((appt) => (
                  <li key={appt.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <CalendarClock size={16} className="shrink-0 text-ink-faint" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium capitalize text-ink">{appt.appointment_type}{appt.service_name ? ` · ${appt.service_name}` : ''}</p>
                      <p className="text-xs text-ink-muted">{when(appt.scheduled_at)}{appt.branch?.name ? ` · ${appt.branch.name}` : ''}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-sunken px-2 py-0.5 text-[11px] font-semibold capitalize text-ink-muted">{appt.status.replace(/_/g, ' ')}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {(order.repair_note || hasMaterialNote) && (
            <section className={`${CARD} order-6 md:order-none space-y-3 p-4 sm:p-5`}>
              {order.repair_note && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">Your repair request</p>
                  <p className="mt-0.5 text-sm text-ink">&ldquo;{order.repair_note}&rdquo;</p>
                </div>
              )}
              {hasMaterialNote && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">Your material</p>
                  <p className="mt-0.5 text-sm capitalize text-ink">{order.customer_material_status}</p>
                </div>
              )}
            </section>
          )}
          {extra && <div className="order-7 space-y-4 empty:hidden md:order-none">{extra}</div>}
        </div>}
      </div>
      {photo && <PhotoLightbox src={photo} onClose={() => setPhoto(null)} />}
    </div>
  );
}
