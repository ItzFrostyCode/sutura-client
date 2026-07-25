'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { CustomerData, JobOrder, MeasurementProfile } from './customerTypes';
import { isWalkInEmail } from './customerHelpers';

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      <div className="md:col-span-2 space-y-6">
        {/* Profile Details */}
        <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#2D2A26]">Client Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[#A8A19A] block mb-0.5 text-xs font-semibold">Full Name</span>
              <span className="text-[#2D2A26] font-medium">{customer?.name}</span>
            </div>
            <div>
              <span className="text-[#A8A19A] block mb-0.5 text-xs font-semibold">Email Address</span>
              <span className="text-[#2D2A26] font-medium">
                {customer?.email && !isWalkInEmail(customer.email) ? customer.email : 'Walk-in (No Email)'}
              </span>
            </div>
            <div>
              <span className="text-[#A8A19A] block mb-0.5 text-xs font-semibold">Phone Number</span>
              <span className="text-[#2D2A26] font-medium">{customer?.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[#A8A19A] block mb-0.5 text-xs font-semibold">Profile Reference</span>
              <span className="text-[#2D2A26] font-medium">Customer ID #{customer?.id}</span>
            </div>
            <div>
              <span className="text-[#A8A19A] block mb-0.5 text-xs font-semibold">Client Type (Suki Tag)</span>
              {customer?.suki_tag ? (() => {
                const tagMap: Record<string, { label: string; cls: string }> = {
                  b2b_suki: { label: '⭐ B2B Suki (Bulk / Corporate)', cls: 'text-amber-700' },
                  reseller: { label: '🏪 Reseller (Palengke / Wholesale)', cls: 'text-purple-700' },
                  walk_in_retail: { label: '🚶 Walk-in Retail', cls: 'text-[#827A73]' },
                };
                const tag = tagMap[customer.suki_tag] ?? { label: customer.suki_tag, cls: 'text-[#2D2A26]' };
                return <span className={`font-medium text-sm ${tag.cls}`}>{tag.label}</span>;
              })() : (
                <span className="text-[#A8A19A] text-sm italic">Not classified</span>
              )}
            </div>
          </div>
          <div>
            <span className="text-[#A8A19A] block mb-0.5 text-xs font-semibold">Shop Notes</span>
            {customer?.shop_notes ? (
              <p className="text-[#2D2A26] text-sm whitespace-pre-wrap bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 mt-1">
                {customer.shop_notes}
              </p>
            ) : (
              <span className="text-[#A8A19A] text-sm italic">No notes yet — add one via Edit Client Info.</span>
            )}
          </div>
        </div>

        {/* Active Jobs Quick Overview */}
        <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-[#2D2A26]">Ongoing Garments Production</h2>
            <button onClick={() => setActiveTab('orders')} className="text-xs text-taupe font-semibold hover:underline flex items-center gap-0.5 cursor-pointer">
              View All Orders <ChevronRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-[#EBE6E0] text-sm">
            {activeJobs.map(job => (
              <div key={job.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                <div>
                  <Link href={`/dashboard/jobs/${job.id}`} className="font-semibold text-taupe hover:underline block">
                    {job.order_number}
                  </Link>
                  <span className="text-xs text-[#827A73]">{job.service?.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-[#2D2A26]">₱{Number.parseFloat(job.total_amount as string).toLocaleString()}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                    job.status === 'pending' ? 'bg-[#FAF6F3] text-[#827A73] border-[#EBE6E0]' : 'bg-[#BCA89F]/10 text-[#BCA89F] border-[#BCA89F]/20'
                  }`}>
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
            {activeJobs.length === 0 && (
              <div className="text-center py-6 text-xs text-[#A8A19A] italic">No active production runs currently.</div>
            )}
          </div>
        </div>
      </div>

      {/* Body Measurements Card */}
      <div className="space-y-6">
        <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-[#2D2A26]">Body Measurements</h2>
              <p className="text-[10px] text-[#A8A19A] mt-0.5">All values in inches (″)</p>
            </div>
            <button
              onClick={() => setActiveTab('measurements')}
              className="text-xs font-semibold text-taupe hover:underline cursor-pointer"
            >
              {measurements.length > 0 ? 'Manage →' : 'Add →'}
            </button>
          </div>

          {measurements.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF6F3] border border-[#EBE6E0] flex items-center justify-center mb-3">
                <ChevronRight size={20} className="text-[#C5BDBA]" />
              </div>
              <p className="text-xs text-[#A8A19A] mb-3">No measurements recorded yet.</p>
              <button
                onClick={() => setActiveTab('measurements')}
                className="text-xs font-bold bg-taupe text-white px-4 py-2 rounded-lg hover:bg-taupe/90 transition-colors cursor-pointer"
              >
                📏 Record Measurements
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
                  <div key={m.id}>
                    <p className="text-[10px] font-bold text-[#9A8073] uppercase tracking-widest mb-2">{m.profile_name}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {entries.slice(0, 8).map(([k, v]) => (
                        <div key={k} className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-2.5 py-2 text-center">
                          <p className="text-[9px] text-[#A8A19A] font-bold uppercase">{KNOWN_LABELS[k] ?? k.replace(/_/g, ' ')}</p>
                          <p className="text-sm font-bold text-[#2D2A26] mt-0.5">{String(v)}<span className="text-[9px] font-normal text-[#A8A19A] ml-0.5">″</span></p>
                        </div>
                      ))}
                    </div>
                    {entries.length > 8 && (
                      <p className="text-[10px] text-[#A8A19A] mt-1 text-center">+{entries.length - 8} more specs</p>
                    )}
                  </div>
                );
              })}
              {measurements.length > 2 && (
                <button onClick={() => setActiveTab('measurements')} className="w-full text-xs text-[#9A8073] font-semibold hover:underline cursor-pointer">
                  View all {measurements.length} profiles →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
