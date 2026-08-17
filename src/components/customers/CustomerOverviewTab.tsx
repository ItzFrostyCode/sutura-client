'use client';

import React from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Ruler,
  Star,
  Store,
  User,
  Scissors,
  Package,
  Calendar,
  FileText,
  Clock,
  Sparkles,
  ArrowUpRight,
  type LucideIcon
} from 'lucide-react';
import { CustomerData, JobOrder, MeasurementProfile } from './customerTypes';
import { isWalkInEmail, SUKI_TAG_CONFIG } from './customerHelpers';

interface CustomerOverviewTabProps {
  readonly customer: CustomerData | null;
  readonly jobs: JobOrder[];
  readonly measurements: MeasurementProfile[];
  readonly setActiveTab: (tab: 'overview' | 'measurements' | 'orders' | 'appointments' | 'history') => void;
}

export default function CustomerOverviewTab({
  customer,
  jobs,
  measurements,
  setActiveTab,
}: CustomerOverviewTabProps) {
  const activeJobs = jobs.filter(j => !['completed', 'cancelled'].includes(j.status));
  const sukiCfg = customer?.suki_tag ? SUKI_TAG_CONFIG[customer.suki_tag] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
      
      {/* LEFT COLUMN: Client Details & Active Production (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Profile & Loyalty Details Card */}
        <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-line pb-4 min-h-12">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-canvas border border-line flex items-center justify-center text-taupe shrink-0 shadow-2xs">
                <User size={15} />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-ink uppercase tracking-wider">Client Atelier Profile</h2>
                <p className="text-[11px] text-ink-muted">Contact details and loyalty tier</p>
              </div>
            </div>

            {sukiCfg && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${sukiCfg.badgeCls}`}>
                {sukiCfg.label}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="p-3.5 bg-canvas border border-line rounded-xl space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">Full Name</span>
              <span className="text-ink font-bold text-sm block">{customer?.name}</span>
            </div>

            <div className="p-3.5 bg-canvas border border-line rounded-xl space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">Email Contact</span>
              <span className="text-ink font-medium block truncate">
                {customer?.email && !isWalkInEmail(customer.email) ? customer.email : 'Walk-in Client (No Email)'}
              </span>
            </div>

            <div className="p-3.5 bg-canvas border border-line rounded-xl space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">Phone / Mobile</span>
              <span className="text-ink font-bold font-mono text-sm block">{customer?.phone || 'N/A'}</span>
            </div>

            <div className="p-3.5 bg-canvas border border-line rounded-xl space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">CRM Reference</span>
              <span className="text-ink font-semibold block">Customer ID #{customer?.id}</span>
            </div>
          </div>

          {/* Atelier Shop Notes Callout */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2 text-xs font-bold text-ink-muted uppercase tracking-wider">
              <FileText size={13} className="text-taupe" />
              <span>Private Atelier Notes</span>
            </div>
            {customer?.shop_notes ? (
              <div className="p-4 bg-canvas border border-line rounded-xl text-xs text-ink-body whitespace-pre-wrap leading-relaxed shadow-2xs">
                {customer.shop_notes}
              </div>
            ) : (
              <div className="p-4 bg-canvas/40 border border-dashed border-line rounded-xl text-xs text-ink-faint italic">
                No special atelier instructions or fit preferences recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Ongoing Garments in Production */}
        <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex justify-between items-center border-b border-line pb-4 min-h-12">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-sage/10 text-sage border border-sage/20 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                <Scissors size={14} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-ink uppercase tracking-wider">Ongoing Garments Production</h3>
                <p className="text-[11px] text-ink-muted">{activeJobs.length} custom orders in progress</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className="text-xs text-taupe font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({jobs.length})</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {activeJobs.length > 0 ? (
            <div className="space-y-2.5">
              {activeJobs.map(job => (
                <Link
                  key={job.id}
                  href={`/dashboard/jobs/${job.id}`}
                  className="flex items-center justify-between p-3.5 bg-canvas hover:bg-surface border border-line hover:border-taupe rounded-xl transition-all group shadow-2xs"
                >
                  <div className="space-y-0.5 min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ink group-hover:text-taupe transition-colors text-xs">
                        {job.order_number}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full border uppercase tracking-wider bg-sage/10 text-sage border-sage/20">
                        {job.status}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted truncate">{job.service?.name || 'Custom Tailoring Service'}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="font-black font-mono text-ink text-xs">
                        ₱{Number.parseFloat(String(job.total_amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-ink-faint">
                        {job.due_date ? `Due ${new Date(job.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}` : 'No deadline'}
                      </div>
                    </div>
                    <ArrowUpRight size={15} className="text-ink-faint group-hover:text-taupe transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-ink-faint border border-dashed border-line rounded-xl bg-canvas/40 space-y-2">
              <Package size={24} className="mx-auto opacity-40" />
              <p className="text-xs font-medium">No active production runs right now</p>
              <Link
                href={`/dashboard/jobs/new?customer_id=${customer?.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-taupe text-white text-xs font-bold uppercase tracking-wider shadow-2xs hover:bg-taupe-hover transition-colors"
              >
                <Scissors size={12} /> Create Job Order
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Body Measurements Snapshot & Quick Hub (4 cols) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Measurements Snapshot Card */}
        <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex justify-between items-center border-b border-line pb-4 min-h-12">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-canvas border border-line flex items-center justify-center text-taupe shrink-0 shadow-2xs">
                <Ruler size={15} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-ink uppercase tracking-wider">Body Measurements</h3>
                <p className="text-[11px] text-ink-muted">All values in inches (″)</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('measurements')}
              className="text-xs font-bold text-taupe hover:underline cursor-pointer"
            >
              {measurements.length > 0 ? 'Manage →' : 'Add →'}
            </button>
          </div>

          {measurements.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-line rounded-xl bg-canvas/40 space-y-2">
              <Ruler size={22} className="mx-auto text-ink-faint opacity-40" />
              <p className="text-xs text-ink-faint">No measurements recorded yet.</p>
              <button
                type="button"
                onClick={() => setActiveTab('measurements')}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-taupe text-white px-3.5 py-2 rounded-xl hover:bg-taupe-hover transition-colors cursor-pointer shadow-2xs"
              >
                <Ruler size={12} /> Record Specs
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {measurements.slice(0, 2).map(m => {
                const KNOWN_LABELS: Record<string, string> = {
                  chest: 'Chest', waist: 'Waist', hip: 'Hip',
                  shoulder: 'Shoulder', sleeve: 'Sleeve', neck: 'Neck',
                  inseam: 'Inseam', thigh: 'Thigh',
                  shirt_length: 'Shirt Length', pant_length: 'Pant Length',
                  bust: 'Bust', back_length: 'Back Length',
                };
                const entries = Object.entries(m.metrics || {});
                return (
                  <div key={m.id} className="p-3.5 bg-canvas border border-line rounded-xl space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink uppercase tracking-wider">{m.profile_name}</span>
                      <span className="text-[9px] font-bold text-taupe bg-taupe/10 px-2 py-0.5 rounded border border-taupe/20 uppercase tracking-wider">
                        Profile #{m.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {entries.slice(0, 6).map(([k, v]) => (
                        <div key={k} className="h-14 bg-surface border border-line rounded-lg p-2 flex flex-col justify-center text-center shadow-2xs">
                          <p className="text-[9px] text-ink-muted font-bold uppercase tracking-wider truncate">{KNOWN_LABELS[k] ?? k.replace(/_/g, ' ')}</p>
                          <p className="text-xs font-black font-mono text-ink mt-0.5">{String(v)}<span className="text-[9px] font-normal text-ink-faint ml-0.5">″</span></p>
                        </div>
                      ))}
                    </div>

                    {entries.length > 6 && (
                      <p className="text-[10px] text-ink-muted text-center font-medium">+{entries.length - 6} more specs in profile</p>
                    )}
                  </div>
                );
              })}

              {measurements.length > 2 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('measurements')}
                  className="w-full py-2.5 text-center text-xs text-taupe font-bold hover:underline cursor-pointer border border-line rounded-xl bg-canvas hover:bg-surface transition-colors shadow-2xs"
                >
                  View all {measurements.length} profiles →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick Atelier Shortcuts */}
        <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-3 border-b border-line pb-4 min-h-12">
            <div className="w-8 h-8 rounded-xl bg-canvas border border-line flex items-center justify-center text-taupe shrink-0 shadow-2xs">
              <Sparkles size={15} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-ink uppercase tracking-wider">Quick Actions</h4>
              <p className="text-[11px] text-ink-muted">Fast atelier shortcuts</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <Link
              href={`/dashboard/jobs/new?customer_id=${customer?.id}`}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-canvas hover:bg-surface border border-line text-xs font-semibold text-ink transition-colors shadow-2xs group"
            >
              <span className="flex items-center gap-2.5">
                <Scissors size={14} className="text-taupe" />
                <span>Create Custom Job Order</span>
              </span>
              <ChevronRight size={13} className="text-ink-muted group-hover:text-taupe transition-colors" />
            </Link>

            <Link
              href={`/dashboard/appointments?customer_id=${customer?.id}`}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-canvas hover:bg-surface border border-line text-xs font-semibold text-ink transition-colors shadow-2xs group"
            >
              <span className="flex items-center gap-2.5">
                <Calendar size={14} className="text-taupe" />
                <span>Book Fitting Appointment</span>
              </span>
              <ChevronRight size={13} className="text-ink-muted group-hover:text-taupe transition-colors" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

