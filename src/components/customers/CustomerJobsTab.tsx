'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';
import { JobOrder } from './customerTypes';
import { useBranch } from '@/context/BranchContext';

interface CustomerJobsTabProps {
  jobs: JobOrder[];
}

export default function CustomerJobsTab({ jobs }: CustomerJobsTabProps) {
  // A customer's history can genuinely span branches — Jobs/Appointments are
  // the two places that carry a real shop_branch_id, but neither surfaced it
  // here, so there was no way to tell which branch a given order happened at
  // without opening it individually. Cross-referencing against the same
  // branches list the header switcher already uses, no new fetch needed.
  const { branches } = useBranch();
  const branchName = (id?: number | null) => branches.find(b => b.id === id)?.name;

  return (
    <div className="bg-surface border border-line rounded-2xl shadow-sm overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-line bg-canvas/30">
        <h2 className="text-sm font-bold text-ink">Garment Job Orders</h2>
      </div>
      {/* Mobile cards — no sideways scroll needed */}
      <div className="md:hidden divide-y divide-line">
        {jobs.length === 0 ? (
          <p className="p-8 text-center text-ink-faint italic text-sm">No orders recorded for this customer.</p>
        ) : jobs.map(job => (
          <Link key={job.id} href={`/dashboard/jobs/${job.id}`} className="block p-4 space-y-2 hover:bg-canvas/20 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-ink flex items-center gap-1.5 flex-wrap">
                  {job.order_number}
                  {job.intake_channel === 'online' ? (
                    <span className="inline-flex items-center text-[9px] font-semibold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 uppercase">Online</span>
                  ) : (
                    <span className="inline-flex items-center text-[9px] font-semibold bg-sunken text-ink-muted px-1.5 py-0.5 rounded border border-line uppercase">Walk-in</span>
                  )}
                  {branchName(job.shop_branch_id) && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-sunken text-ink-muted px-1.5 py-0.5 rounded border border-line">
                      <MapPin size={9} /> {branchName(job.shop_branch_id)}
                    </span>
                  )}
                </p>
                <p className="text-ink-body text-sm mt-1">{job.service?.name}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-ink text-sm">₱{parseFloat(job.total_amount as string).toLocaleString()}</p>
                {parseFloat(job.balance as string) > 0 && (
                  <p className="text-[10px] text-danger font-semibold">Bal: ₱{parseFloat(job.balance as string).toLocaleString()}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                job.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                job.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {job.status}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                job.payment_status === 'paid' ? 'bg-sage/15 text-sage border-sage/20' :
                job.payment_status === 'partial' ? 'bg-[#BCA89F]/15 text-[#BCA89F] border-[#BCA89F]/20' :
                'bg-danger/15 text-danger border-danger/20'
              }`}>
                {job.payment_status}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-canvas/50 border-b border-line text-xs uppercase tracking-wider text-ink-muted">
              <th className="p-4 font-semibold">Order Number</th>
              <th className="p-4 font-semibold">Garment / Service</th>
              <th className="p-4 font-semibold text-center">Status</th>
              <th className="p-4 font-semibold text-center">Payment Status</th>
              <th className="p-4 font-semibold text-right">Amount (₱)</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {jobs.map(job => (
              <tr key={job.id} className="hover:bg-canvas/20 transition-colors">
                <td className="p-4 font-bold text-ink">
                  {job.order_number}
                  {job.intake_channel === 'online' ? (
                    <span className="ml-2 inline-flex items-center text-[9px] font-semibold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 uppercase">Online</span>
                  ) : (
                    <span className="ml-2 inline-flex items-center text-[9px] font-semibold bg-sunken text-ink-muted px-1.5 py-0.5 rounded border border-line uppercase">Walk-in</span>
                  )}
                  <span className="ml-1.5 inline-flex items-center text-[9px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100 uppercase">Pickup</span>
                  {branchName(job.shop_branch_id) && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 text-[9px] font-semibold bg-sunken text-ink-muted px-1.5 py-0.5 rounded border border-line">
                      <MapPin size={9} />
                      {branchName(job.shop_branch_id)}
                    </span>
                  )}
                </td>
                <td className="p-4 text-ink-body font-medium">{job.service?.name}</td>
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
                    job.payment_status === 'paid' ? 'bg-sage/15 text-sage border-sage/20' :
                    job.payment_status === 'partial' ? 'bg-[#BCA89F]/15 text-[#BCA89F] border-[#BCA89F]/20' :
                    'bg-danger/15 text-danger border-danger/20'
                  }`}>
                    {job.payment_status}
                  </span>
                </td>
                <td className="p-4 text-right font-bold text-ink">
                  ₱{parseFloat(job.total_amount as string).toLocaleString()}
                  {parseFloat(job.balance as string) > 0 && (
                    <span className="text-[10px] text-danger block font-semibold">Bal: ₱{parseFloat(job.balance as string).toLocaleString()}</span>
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
                <td colSpan={6} className="p-8 text-center text-ink-faint italic">
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
