import React from 'react';
import { Users, Scissors, TrendingUp } from 'lucide-react';
import { CustomerData } from './customerTypes';
import { isWalkInCustomer } from './customerHelpers';

interface CustomerStatsCardsProps {
  readonly customers: CustomerData[];
}

export default function CustomerStatsCards({ customers }: CustomerStatsCardsProps) {
  const totalSpendAll = customers.reduce((sum, c) => sum + (Number(c.total_spend) || 0), 0);
  const activeJobsTotal = customers.reduce((sum, c) => sum + (Number(c.active_jobs) || 0), 0);
  const onlineCount = customers.filter(c => !isWalkInCustomer(c)).length;
  const walkinCount = customers.filter(c => isWalkInCustomer(c)).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Total Registered Clients</span>
          <div className="text-2xl font-black text-ink">{customers.length}</div>
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <span className="text-blue-600 font-semibold">{onlineCount} Online</span>
            <span>•</span>
            <span className="text-amber-700 font-semibold">{walkinCount} Walk-in</span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-canvas border border-line flex items-center justify-center text-taupe shrink-0">
          <Users size={20} />
        </div>
      </div>

      <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Active In-Pipeline Jobs</span>
          <div className="text-2xl font-black text-ink">{activeJobsTotal}</div>
          <div className="text-xs text-ink-muted">Across current custom production</div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-sage/10 text-sage border border-sage/20 flex items-center justify-center shrink-0">
          <Scissors size={20} />
        </div>
      </div>

      <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Total Client Revenue</span>
          <div className="text-2xl font-black font-mono text-ink">
            ₱{totalSpendAll.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-ink-muted">Cumulative customer spend to date</div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
          <TrendingUp size={20} />
        </div>
      </div>
    </div>
  );
}
