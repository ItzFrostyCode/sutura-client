'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { JobOrder } from './customerTypes';

interface CustomerJobsTabProps {
  jobs: JobOrder[];
}

export default function CustomerJobsTab({ jobs }: CustomerJobsTabProps) {
  return (
    <div className="bg-white border border-[#EBE6E0] rounded-2xl shadow-sm overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-[#EBE6E0] bg-[#FAF6F3]/30">
        <h2 className="text-sm font-bold text-[#2D2A26]">Garment Job Orders</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#FAF6F3]/50 border-b border-[#EBE6E0] text-xs uppercase tracking-wider text-[#827A73]">
              <th className="p-4 font-semibold">Order Number</th>
              <th className="p-4 font-semibold">Garment / Service</th>
              <th className="p-4 font-semibold text-center">Status</th>
              <th className="p-4 font-semibold text-center">Payment Status</th>
              <th className="p-4 font-semibold text-right">Amount (₱)</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EBE6E0]">
            {jobs.map(job => (
              <tr key={job.id} className="hover:bg-[#FAF6F3]/20 transition-colors">
                <td className="p-4 font-bold text-[#2D2A26]">
                  {job.order_number}
                  {job.intake_channel === 'online' ? (
                    <span className="ml-2 inline-flex items-center text-[9px] font-semibold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 uppercase">Online</span>
                  ) : (
                    <span className="ml-2 inline-flex items-center text-[9px] font-semibold bg-[#F0EAE3] text-[#827A73] px-1.5 py-0.5 rounded border border-[#EBE6E0] uppercase">Walk-in</span>
                  )}
                  <span className="ml-1.5 inline-flex items-center text-[9px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100 uppercase">Pickup</span>
                </td>
                <td className="p-4 text-[#524A44] font-medium">{job.service?.name}</td>
                <td className="p-4 text-center">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                    job.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                    job.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {job.status}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                    job.payment_status === 'paid' ? 'bg-[#7A8B76]/15 text-[#7A8B76] border-[#7A8B76]/20' :
                    job.payment_status === 'partial' ? 'bg-[#BCA89F]/15 text-[#BCA89F] border-[#BCA89F]/20' :
                    'bg-[#B26959]/15 text-[#B26959] border-[#B26959]/20'
                  }`}>
                    {job.payment_status}
                  </span>
                </td>
                <td className="p-4 text-right font-bold text-[#2D2A26]">
                  ₱{parseFloat(job.total_amount as string).toLocaleString()}
                  {parseFloat(job.balance as string) > 0 && (
                    <span className="text-[10px] text-[#B26959] block font-semibold">Bal: ₱{parseFloat(job.balance as string).toLocaleString()}</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <Link 
                    href={`/dashboard/jobs/${job.id}`}
                    className="inline-flex items-center gap-1.5 text-xs text-taupe font-semibold hover:underline"
                  >
                    View details <ChevronRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[#A8A19A] italic">
                  No orders recorded for this customer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
