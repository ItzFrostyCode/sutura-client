import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, AlertTriangle, ChevronUp, ChevronDown, Clock, CheckCircle2, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { JobItem } from './dashboardHelpers';

interface DashboardAlertsProps {
  readonly shopVisible: boolean | null;
  readonly toggleVisibility: () => Promise<void>;
  readonly visibilityLoading: boolean;
  readonly unpaidJobs: JobItem[];
  readonly pendingDpJobs: JobItem[];
  readonly balanceExpanded: boolean;
  readonly setBalanceExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  readonly dueToday: JobItem[];
  readonly dueThisWeek: JobItem[];
}

export default function DashboardAlerts({
  shopVisible,
  toggleVisibility,
  visibilityLoading,
  unpaidJobs,
  pendingDpJobs,
  balanceExpanded,
  setBalanceExpanded,
  dueToday,
  dueThisWeek,
}: DashboardAlertsProps) {
  const [dpExpanded, setDpExpanded] = useState(false);
  return (
    <div className="space-y-6 text-[#2D2A26]">
      {/* Shop Visibility Toggle */}
      {shopVisible !== null && (
        <div className="flex items-center justify-between bg-white border border-[#EBE6E0] rounded-2xl px-5 py-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
              shopVisible ? 'bg-[#7A8B76]/10 border border-[#7A8B76]/20' : 'bg-[#A8A19A]/10 border border-[#A8A19A]/20'
            }`}>
              {shopVisible
                ? <Eye size={16} className="text-[#7A8B76]" />
                : <EyeOff size={16} className="text-[#A8A19A]" />
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-[#2D2A26]">
                Shop is <span className={shopVisible ? 'text-[#7A8B76]' : 'text-[#A8A19A]'}>{shopVisible ? 'Public' : 'Hidden'}</span>
              </p>
              <p className="text-xs text-[#A8A19A]">
                {shopVisible ? 'Customers can find and book your shop.' : 'Your shop is hidden from the public catalog.'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleVisibility}
            disabled={visibilityLoading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              shopVisible ? 'bg-[#7A8B76]' : 'bg-[#D1C7BD]'
            } disabled:opacity-60 cursor-pointer`}
            aria-label="Toggle shop visibility"
          >
            {visibilityLoading
              ? <Loader2 size={10} className="absolute left-1 animate-spin text-white" />
              : <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  shopVisible ? 'translate-x-6' : 'translate-x-1'
                }`} />
            }
          </button>
        </div>
      )}

      {/* Balance Collection Alert */}
      {unpaidJobs.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => setBalanceExpanded(p => !p)}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-amber-100/40 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
              <AlertTriangle size={15} className="text-amber-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-amber-800">
                {unpaidJobs.length} completed order{unpaidJobs.length === 1 ? '' : 's'} with outstanding balance
              </p>
              <p className="text-xs text-amber-600">
                Total: ₱{unpaidJobs.reduce((sum, j) => sum + Number.parseFloat(String(j.balance || '0')), 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </div>
            {balanceExpanded ? <ChevronUp size={16} className="text-amber-600 shrink-0" /> : <ChevronDown size={16} className="text-amber-600 shrink-0" />}
          </button>
          {balanceExpanded && (
            <div className="border-t border-amber-200 divide-y divide-amber-100">
              {unpaidJobs.map(j => (
                <Link key={j.id} href={`/dashboard/jobs/${j.id}`} className="flex items-center justify-between px-5 py-2.5 hover:bg-amber-100/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-amber-900">{j.customer?.name || 'Walk-in'}</p>
                    <p className="text-xs text-amber-600">{j.order_number || `#${j.id}`}</p>
                  </div>
                  <span className="text-sm font-bold text-amber-800">
                    ₱{Number.parseFloat(String(j.balance || '0')).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending Deposits Alert — active jobs with no DP collected */}
      {pendingDpJobs.length > 0 && (
        <div className="bg-[#FFF8F0] border border-amber-300 rounded-2xl overflow-hidden">
          <button
            onClick={() => setDpExpanded(p => !p)}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-amber-50/60 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 bg-amber-100 border border-amber-200 rounded-xl flex items-center justify-center shrink-0">
              <CreditCard size={15} className="text-amber-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-amber-900">
                {pendingDpJobs.length} active job{pendingDpJobs.length === 1 ? '' : 's'} with no downpayment collected
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Per shop policy: 50% DP required before cutting starts. Tap to collect.
              </p>
            </div>
            {dpExpanded ? <ChevronUp size={16} className="text-amber-600 shrink-0" /> : <ChevronDown size={16} className="text-amber-600 shrink-0" />}
          </button>
          {dpExpanded && (
            <div className="border-t border-amber-200 divide-y divide-amber-100">
              {pendingDpJobs.slice(0, 8).map(j => (
                <div key={j.id} className="flex items-center justify-between px-5 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-amber-900">{j.customer?.name || 'Walk-in'}</p>
                    <p className="text-xs text-amber-600">{j.order_number || `#${j.id}`} · ₱{Number.parseFloat(String(j.total_amount || '0')).toLocaleString('en-PH', { minimumFractionDigits: 0 })} total</p>
                  </div>
                  <Link
                    href={`/dashboard/jobs/${j.id}#financials`}
                    className="text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                  >
                    Log DP →
                  </Link>
                </div>
              ))}
              {pendingDpJobs.length > 8 && (
                <p className="px-5 py-2 text-xs text-amber-600 text-center">+{pendingDpJobs.length - 8} more — <Link href="/dashboard/payments" className="underline">View all</Link></p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Daily / Weekly Job Summary */}
      {(dueToday.length > 0 || dueThisWeek.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Due Today */}
          <div className="bg-white border border-[#EBE6E0] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-[#B26959]" />
                <p className="text-sm font-semibold text-[#2D2A26]">Due Today</p>
              </div>
              <span className="bg-[#B26959]/10 text-[#B26959] border border-[#B26959]/20 text-xs font-bold px-2 py-0.5 rounded-full">
                {dueToday.length}
              </span>
            </div>
            <div className="space-y-2">
              {dueToday.length === 0
                ? <p className="text-xs text-[#A8A19A] italic">Nothing due today.</p>
                : dueToday.map(j => (
                  <Link key={j.id} href={`/dashboard/jobs/${j.id}`} className="flex items-center justify-between py-1.5 border-b border-[#EBE6E0] last:border-0 hover:text-[#9A8073] transition-colors">
                    <p className="text-sm font-medium text-[#2D2A26] truncate">{j.customer?.name || 'Walk-in'}</p>
                    <span className="text-xs text-[#A8A19A] shrink-0 ml-2">{j.order_number || `#${j.id}`}</span>
                  </Link>
                ))
              }
            </div>
          </div>
          {/* Due This Week */}
          <div className="bg-white border border-[#EBE6E0] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#9A8073]" />
                <p className="text-sm font-semibold text-[#2D2A26]">Due This Week</p>
              </div>
              <span className="bg-[#9A8073]/10 text-[#9A8073] border border-[#9A8073]/20 text-xs font-bold px-2 py-0.5 rounded-full">
                {dueThisWeek.length}
              </span>
            </div>
            <div className="space-y-2">
              {dueThisWeek.length === 0
                ? <p className="text-xs text-[#A8A19A] italic">No upcoming deadlines</p>
                : dueThisWeek.slice(0, 5).map(j => (
                  <Link key={j.id} href={`/dashboard/jobs/${j.id}`} className="flex items-center justify-between py-1.5 border-b border-[#EBE6E0] last:border-0 hover:text-[#9A8073] transition-colors">
                    <p className="text-sm font-medium text-[#2D2A26] truncate">{j.customer?.name || 'Walk-in'}</p>
                    <span className="text-xs text-[#A8A19A] shrink-0 ml-2">
                      {new Date(j.due_date!).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                    </span>
                  </Link>
                ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
