'use client';

import React from 'react';
import { Appointment } from './customerTypes';
import { useBranch } from '@/context/BranchContext';

interface CustomerAppointmentsTabProps {
  readonly appointments: Appointment[];
}

export default function CustomerAppointmentsTab({
  appointments,
}: CustomerAppointmentsTabProps) {
  const { branches } = useBranch();
  const branchName = (id?: number | null) => branches.find(b => b.id === id)?.name ?? '—';

  return (
    <div className="bg-white border border-[#EBE6E0] rounded-2xl shadow-sm overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-[#EBE6E0] bg-[#FAF6F3]/30">
        <h2 className="text-sm font-bold text-[#2D2A26]">Scheduled Customer Appointments</h2>
      </div>
      {/* Mobile cards — no sideways scroll needed */}
      <div className="md:hidden divide-y divide-[#EBE6E0]">
        {appointments.length === 0 ? (
          <p className="p-8 text-center text-[#A8A19A] italic text-sm">No appointments recorded for this customer.</p>
        ) : appointments.map(appt => {
          let statusClass = 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
          if (appt.status === 'completed') statusClass = 'bg-green-50 text-green-700 border-green-200';
          else if (appt.status === 'cancelled') statusClass = 'bg-red-50 text-red-700 border-red-200';
          else if (appt.status === 'no_show') statusClass = 'bg-slate-50 text-slate-700 border-slate-200';
          return (
            <div key={appt.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[#2D2A26]">
                    {new Date(appt.scheduled_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-[#827A73]">{new Date(appt.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase shrink-0 ${statusClass}`}>
                  {appt.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[#524A44] text-sm font-medium">{appt.service?.name || 'Fitting Session / General'}</p>
              <p className="text-xs text-[#827A73]">{branchName(appt.shop_branch_id)}</p>
              {appt.notes && <p className="text-xs text-[#827A73] italic">&quot;{appt.notes}&quot;</p>}
            </div>
          );
        })}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#FAF6F3]/50 border-b border-[#EBE6E0] text-xs uppercase tracking-wider text-[#827A73]">
              <th className="p-4 font-semibold">Date & Time</th>
              <th className="p-4 font-semibold">Garment Service</th>
              <th className="p-4 font-semibold">Branch</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Meeting Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EBE6E0]">
            {appointments.map(appt => (
              <tr key={appt.id} className="hover:bg-[#FAF6F3]/20 transition-colors">
                <td className="p-4 font-semibold text-[#2D2A26]">
                  {new Date(appt.scheduled_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  <span className="block text-xs font-normal text-[#827A73]">{new Date(appt.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                </td>
                <td className="p-4 text-[#524A44] font-medium">{appt.service?.name || 'Fitting Session / General'}</td>
                <td className="p-4 text-xs text-[#827A73]">{branchName(appt.shop_branch_id)}</td>
                <td className="p-4">
                  {(() => {
                    let statusClass = 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
                    if (appt.status === 'completed') statusClass = 'bg-green-50 text-green-700 border-green-200';
                    else if (appt.status === 'cancelled') statusClass = 'bg-red-50 text-red-700 border-red-200';
                    else if (appt.status === 'no_show') statusClass = 'bg-slate-50 text-slate-700 border-slate-200';
                    return (
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${statusClass}`}>
                        {appt.status.replace('_', ' ')}
                      </span>
                    );
                  })()}
                </td>
                <td className="p-4 text-xs text-[#827A73] max-w-sm truncate" title={appt.notes}>
                  {appt.notes || '—'}
                </td>
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[#A8A19A] italic">
                  No appointments recorded for this customer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
