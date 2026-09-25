import React from 'react';
import { ShoppingBag, Package, TrendingUp } from 'lucide-react';
import { CatalogOrder } from '@/components/orders/orderHelpers';

interface WalkInKPICardsProps {
  readonly orders: CatalogOrder[];
  readonly readyCount: number;
  readonly totalRevenue: number;
}

export function WalkInKPICards({ orders, readyCount, totalRevenue }: WalkInKPICardsProps) {
  const completedCount = orders.filter(o => o.status === 'completed').length;
  const activeCount = orders.filter(o => o.status === 'pending' || o.status === 'ready').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Total Retail Orders</span>
          <div className="text-2xl font-black font-mono text-ink">{orders.length}</div>
          <div className="text-xs text-ink-muted">
            {completedCount} completed • {activeCount} active
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-canvas border border-line flex items-center justify-center text-taupe shrink-0 shadow-2xs">
          <ShoppingBag size={20} />
        </div>
      </div>

      <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Ready for Pickup</span>
          <div className="text-2xl font-black font-mono text-blue-700">{readyCount}</div>
          <div className="text-xs text-ink-muted">Awaiting customer collection</div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
          <Package size={20} />
        </div>
      </div>

      <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Fulfilled Retail Sales</span>
          <div className="text-2xl font-black font-mono text-ink">
            ₱{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-ink-muted">Completed catalog walk-in purchases</div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
          <TrendingUp size={20} />
        </div>
      </div>
    </div>
  );
}
