'use client';

import React from 'react';
import { Job } from '../jobTypes';
import { GARMENT_CATEGORY_LABELS } from '../jobHelpers';

interface JobPrintWorkTicketProps {
  job: Job;
  store: { name?: string } | null;
}

export default function JobPrintWorkTicket({ job, store }: JobPrintWorkTicketProps) {
  const measurementMetrics = job.measurement?.metrics || {};
  const metricEntries = Object.entries(measurementMetrics);

  const customSpecEntries = job.custom_order_data
    ? Object.entries(job.custom_order_data).filter(
        ([k]) => !['roster', 'team_roster', 'size_breakdown', 'personalization_config'].includes(k)
      )
    : [];

  return (
    <div className="hidden print:block w-full text-black text-sm">
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-wider">{store?.name || 'SUTURA'}</h1>
          <p className="text-gray-600 font-medium">Job Order Work Ticket</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">#{job.order_number}</p>
          <p className="text-gray-600 font-medium mt-1">
            Printed: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
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
            <p className="text-base"><strong>Material:</strong> {job.material_source === 'customer_supplied' ? "Customer's Own" : 'Store Supplied'}</p>
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
            ⚠ Outsourced to Partner Store{job.partner_store_name ? `: ${job.partner_store_name}` : ''}
          </p>
        </div>
      )}

      {job.measurement && (
        <div className="mb-8">
          <h2 className="font-bold uppercase tracking-widest text-xs border-b border-black pb-1 mb-3">
            Measurements — {job.measurement.profile_name}
          </h2>
          {metricEntries.length > 0 ? (
            <div className="grid grid-cols-4 gap-x-8 gap-y-3">
              {metricEntries.map(([k, v]) => (
                <div key={k} className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">{k.replaceAll('_', ' ')}</span>
                  <span className="font-medium text-base border-b border-dashed border-gray-300 pb-1">
                    {typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v ?? '')}″
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">No measurement fields recorded.</p>
          )}
          {job.measurement.notes && <p className="text-sm mt-2"><strong>Notes:</strong> {job.measurement.notes}</p>}
        </div>
      )}

      {customSpecEntries.length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold uppercase tracking-widest text-xs border-b border-black pb-1 mb-3">Custom Specifications</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {customSpecEntries.map(([k, v]) => (
              <div key={k} className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase font-semibold">{k.replaceAll('_', ' ')}</span>
                <span className="font-medium text-base border-b border-dashed border-gray-300 pb-1">
                  {typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? String(v) : '—'}
                </span>
              </div>
            ))}
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
            <div className="border-b border-black h-8 mb-2" />
            <p className="text-xs uppercase font-semibold">Master Cutter</p>
          </div>
          <div className="text-center w-48">
            <div className="border-b border-black h-8 mb-2" />
            <p className="text-xs uppercase font-semibold">Sewing Quality Check</p>
          </div>
          <div className="text-center w-48">
            <div className="border-b border-black h-8 mb-2" />
            <p className="text-xs uppercase font-semibold">Final Finishing</p>
          </div>
        </div>
      </div>
    </div>
  );
}
