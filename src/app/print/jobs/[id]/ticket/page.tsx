'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { usePrintAuthGuard } from '@/hooks/usePrintAuthGuard';

interface RosterItem { name?: string; print_name?: string; number?: string | number; size?: string; completed?: boolean; }

interface Job {
  id: number;
  order_number?: string;
  tracking_code?: string | null;
  status: string;
  intake_channel: string;
  is_rush?: boolean;
  total_amount: string | number;
  balance?: string | number;
  discount_amount?: string | number | null;
  due_date?: string;
  notes?: string;
  created_at: string;
  customer?: { id: number; name: string; phone?: string; email?: string; };
  service?: { name: string; };
  assigned_staff?: { name: string; };
  // The real endpoint (JobOrderController@show) returns this as a single
  // `measurement` object with a free-form `metrics` map — there is no fixed
  // chest/waist/hip schema and no plural `measurements` key at all. This
  // page previously read a `measurements` field that never existed in the
  // response, so the printed Work Ticket's measurements section silently
  // never rendered for any job, ever.
  measurement?: {
    profile_name?: string;
    metrics?: Record<string, string | number>;
    notes?: string | null;
  };
  custom_order_data?: Record<string, unknown>;
  completion_photo_url?: string | null;
  reference_images?: string[] | null;
  reference_link?: string | null;
  material_source?: 'shop_supplied' | 'customer_supplied' | null;
  garment_category?: string | null;
  is_outsourced?: boolean;
  partner_shop_name?: string | null;
}

const GARMENT_CATEGORY_LABELS: Record<string, string> = {
  barong: 'Barong Tagalog',
  gown: 'Gown',
  suit: 'Suit',
  filipiniana: 'Filipiniana',
  uniform: 'School Uniform',
  lab_gown: 'Lab Gown',
  scrub_suit: 'Scrub Suit',
  corporate_wear: 'Corporate Wear',
  alteration_repair: 'Alterations & Repair',
};

export default function PrintWorkTicketPage() {
  usePrintAuthGuard();
  const { id } = useParams<{ id: string }>();
  const { shop } = useAuthStore();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shop?.id || !id) return;
    api.get(`/shops/${shop.id}/jobs/${id}`)
      .then(res => { setJob(res.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [shop?.id, id]);

  useEffect(() => {
    if (!loading && job) {
      setTimeout(() => window.print(), 400);
    }
  }, [loading, job]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500 text-sm animate-pulse">Preparing work ticket...</p>
      </div>
    );
  }
  if (!job) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500 text-sm">Job not found.</p>
      </div>
    );
  }

  const total       = Number.parseFloat(String(job.total_amount || 0));
  const balance     = Number.parseFloat(String(job.balance      || 0));
  const discount    = Number.parseFloat(String(job.discount_amount || 0));
  // job_orders has no standalone "downpayment" column — the amount paid so
  // far is total minus balance minus any discount (applyDiscount reduces
  // balance directly, not total_amount, so without subtracting it here too
  // a discount would silently get counted as "Downpayment Collected" —
  // money the customer never actually paid).
  const dp          = total - balance - discount;
  const roster      = (job.custom_order_data?.team_roster || job.custom_order_data?.roster) as RosterItem[] | undefined;
  const poNumber    = job.custom_order_data?.po_number as string | undefined;

  const customSpecs = job.custom_order_data
    ? Object.entries(job.custom_order_data).filter(([k, v]) =>
        !['team_roster', 'roster', 'po_number'].includes(k) && v !== null && v !== undefined && String(v).trim() !== ''
      )
    : [];

  const dueFmt = job.due_date
    ? new Date(job.due_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  const createdFmt = new Date(job.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

  const meas = job.measurement;
  const measEntries = Object.entries(meas?.metrics || {});

  const materialSourceLabel = job.material_source === 'customer_supplied'
    ? 'Customer-Supplied — do not cut from shop stock'
    : 'Shop-Supplied';

  return (
    <>
      {/* Print-specific global styles injected inline. No fill colors, no
          boxed/bordered sections, no icons/emoji anywhere on this page —
          this ticket gets printed once per job order, routinely on a
          shop's everyday inkjet, so every mark on the page is either plain
          black text or a single hairline rule. */}
      <style>{`
        @page { size: A4; margin: 18mm 16mm; }
        @media print {
          .no-print { display: none !important; }
        }
        body { font-family: 'Arial', sans-serif; background: #fff; }
      `}</style>

      {/* Screen back button */}
      <div className="no-print fixed top-4 left-4 z-50 flex gap-3">
        <button onClick={() => window.history.back()} className="bg-white border border-gray-300 shadow text-sm px-4 py-2 hover:bg-gray-50">← Back</button>
        <button onClick={() => window.print()} className="bg-black text-white text-sm px-4 py-2 hover:bg-gray-800">Print</button>
      </div>

      {/*
        ─── TICKET BODY ────────────────────────────────────────────────────
        globals.css's @media print rule hides `body *` by default and only
        un-hides #receipt-print-area (a pattern shared with OrderReceiptModal) —
        without this id, this whole standalone page prints/PDFs as a blank sheet.
      */}
      <div id="receipt-print-area" className="max-w-[780px] mx-auto p-8 text-black text-sm leading-relaxed">

        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-black">
              {shop?.name ?? 'SUTURA'}
            </h1>
            <p className="text-xs text-gray-600 mt-0.5">Production Work Ticket</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-black">{job.order_number ?? `#${job.id}`}</p>
            {job.tracking_code && (
              <p className="text-xs text-gray-600 mt-0.5">
                Track online: <span className="font-mono font-bold text-black">{job.tracking_code}</span>
              </p>
            )}
            {job.is_rush && (
              <p className="text-xs font-black uppercase tracking-widest underline mt-1">Rush Order</p>
            )}
          </div>
        </div>

        {/* 2-column: Client + Order info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Client Information</p>
            <table className="w-full text-sm">
              <tbody>
                <tr><td className="text-gray-600 pr-3 pb-1 font-medium w-28">Name</td><td className="font-bold pb-1">{job.customer?.name ?? '—'}</td></tr>
                <tr><td className="text-gray-600 pr-3 pb-1 font-medium">Phone</td><td className="pb-1">{job.customer?.phone ?? '—'}</td></tr>
                {job.customer?.email && !job.customer.email.startsWith('walkin_') && (
                  <tr><td className="text-gray-600 pr-3 font-medium">Email</td><td>{job.customer.email}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Order Details</p>
            <table className="w-full text-sm">
              <tbody>
                <tr><td className="text-gray-600 pr-3 pb-1 font-medium w-28">Service</td><td className="font-bold pb-1">{job.service?.name ?? '—'}</td></tr>
                {job.garment_category && (
                  <tr><td className="text-gray-600 pr-3 pb-1 font-medium">Garment</td><td className="pb-1">{GARMENT_CATEGORY_LABELS[job.garment_category] ?? job.garment_category}</td></tr>
                )}
                <tr><td className="text-gray-600 pr-3 pb-1 font-medium">Channel</td><td className="pb-1 capitalize">{job.intake_channel?.replace('_', '-') ?? '—'}</td></tr>
                <tr><td className="text-gray-600 pr-3 pb-1 font-medium">Date In</td><td className="pb-1">{createdFmt}</td></tr>
                <tr><td className="text-gray-600 pr-3 pb-1 font-medium">Due Date</td><td className="font-bold underline pb-1">{dueFmt}</td></tr>
                {job.assigned_staff && <tr><td className="text-gray-600 pr-3 font-medium">Tailor</td><td>{job.assigned_staff.name}</td></tr>}
                {poNumber && <tr><td className="text-gray-600 pr-3 font-medium">PO #</td><td className="font-medium">{poNumber}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Design/Material Reference Photos — always shown when present,
            regardless of material source. */}
        {((job.reference_images && job.reference_images.length > 0) || job.reference_link) && (
          <div className="mb-6">
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Reference Photos</p>
            {job.reference_images && job.reference_images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {job.reference_images.map((url) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={url} src={url} alt="Design/material reference" width={88} height={88} className="border border-gray-400 object-cover" />
                ))}
              </div>
            )}
            {job.reference_link && (
              <p className="text-xs text-gray-700 mt-1 break-all">{job.reference_link}</p>
            )}
          </div>
        )}

        {/* Production Instructions (Cut Sheet) — the single most important
            section on the ticket, so everything a cutter/sewer needs is
            gathered here instead of scattered across separate warning
            boxes: material source, outsourcing, written notes, and every
            custom spec captured at intake (fabric, color, style details,
            alteration damage notes, etc.), not just the freeform notes. */}
        <div className="border-t-2 border-black pt-3 mb-6">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Production Instructions / Cut Sheet</p>

          <table className="w-full text-sm mb-2">
            <tbody>
              <tr>
                <td className="text-gray-600 pr-3 pb-1 font-medium w-40 align-top">Material Source</td>
                <td className={`pb-1 align-top ${job.material_source === 'customer_supplied' ? 'font-black underline' : 'font-medium'}`}>
                  {materialSourceLabel}
                </td>
              </tr>
              {job.is_outsourced && (
                <tr>
                  <td className="text-gray-600 pr-3 pb-1 font-medium align-top">Outsourced To</td>
                  <td className="pb-1 font-black underline align-top">
                    Partner Shop{job.partner_shop_name ? ` — ${job.partner_shop_name}` : ''}
                  </td>
                </tr>
              )}
              {customSpecs.map(([label, value]) => (
                <tr key={label}>
                  <td className="text-gray-600 pr-3 pb-1 font-medium align-top capitalize">{label.replaceAll('_', ' ')}</td>
                  <td className="pb-1 font-medium align-top">
                    {typeof value === 'string' || typeof value === 'number' ? String(value) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-3 mb-1">Written Instructions</p>
          <p className="text-sm text-black whitespace-pre-wrap leading-relaxed">
            {job.notes?.trim() || 'No specific instructions written. Proceed with standard production guidelines.'}
          </p>
        </div>

        {/* Measurements */}
        {meas && (
          <div className="mb-6">
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">
              Body Measurements{meas.profile_name ? ` — ${meas.profile_name}` : ''}
            </p>
            {measEntries.length > 0 ? (
              <table className="w-full text-sm">
                <tbody>
                  {measEntries.map(([label, val]) => (
                    <tr key={label}>
                      <td className="text-gray-600 pr-3 py-0.5 font-medium capitalize w-48">{label.replace(/_/g, ' ')}</td>
                      <td className="py-0.5 font-bold">{String(val)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-gray-500 italic">No measurement fields recorded on this profile.</p>
            )}
            {meas.notes && (
              <p className="mt-2 text-xs text-gray-600 italic">Note: {meas.notes}</p>
            )}
          </div>
        )}

        {/* Team Roster */}
        {roster && roster.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">
              Team Roster / Size Sheet ({roster.length} pcs — {roster.filter(r => r.completed).length} of {roster.length} done)
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 font-bold text-black border-b-2 border-black">#</th>
                  <th className="text-left px-3 py-2 font-bold text-black border-b-2 border-black">Name</th>
                  <th className="text-left px-3 py-2 font-bold text-black border-b-2 border-black">Print Name</th>
                  <th className="text-left px-3 py-2 font-bold text-black border-b-2 border-black">No.</th>
                  <th className="text-left px-3 py-2 font-bold text-black border-b-2 border-black">Size</th>
                  <th className="text-left px-3 py-2 font-bold text-black border-b-2 border-black">Done</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((r, i) => (
                  <tr key={i} className="border-b border-gray-300">
                    <td className="px-3 py-1.5 text-gray-500">{i + 1}</td>
                    <td className="px-3 py-1.5 font-medium">{r.name ?? '—'}</td>
                    <td className="px-3 py-1.5">{r.print_name ?? '—'}</td>
                    <td className="px-3 py-1.5">{r.number ?? '—'}</td>
                    <td className="px-3 py-1.5 font-bold">{r.size ?? '—'}</td>
                    <td className="px-3 py-1.5 font-bold">{r.completed ? 'DONE' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Financial Summary */}
        <div className="border-t-2 border-black pt-4 mt-4">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Payment Summary</p>
          <div className="flex justify-end">
            <table className="text-sm">
              <tbody>
                <tr>
                  <td className="text-gray-600 pr-12 pb-1">Total Amount</td>
                  <td className="font-bold text-right pb-1">₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                </tr>
                {discount > 0 && (
                  <tr>
                    <td className="text-gray-600 pr-12 pb-1">Discount Applied</td>
                    <td className="font-bold text-right pb-1">−₱{discount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                  </tr>
                )}
                <tr>
                  <td className="text-gray-600 pr-12 pb-1">Downpayment Collected</td>
                  <td className="font-bold text-right pb-1">₱{dp.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr className="border-t border-gray-400">
                  <td className="text-black font-bold pr-12 pt-1">Balance Due</td>
                  <td className="text-lg font-black text-right pt-1 underline">
                    ₱{balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Signature Footer */}
        <div className="grid grid-cols-3 gap-8 mt-10 pt-6 border-t border-gray-300">
          {['Prepared by', 'Checked by', 'Received by'].map(label => (
            <div key={label} className="text-center">
              <div className="border-b border-gray-500 h-10 mb-2" />
              <p className="text-xs text-gray-600">{label}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-[9px] text-gray-400 mt-6">
          Printed by SUTURA Shop Management System · {new Date().toLocaleString('en-PH')}
        </p>
      </div>
    </>
  );
}
