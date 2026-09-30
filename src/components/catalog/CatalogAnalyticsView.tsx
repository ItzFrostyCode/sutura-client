'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Eye, Heart, ShoppingBag, Wallet, Activity } from 'lucide-react';

import { CatalogItem } from '@/components/catalog/catalogHelpers';
import CatalogTopPerformersChart from '@/components/catalog/CatalogTopPerformersChart';
import CatalogRevenueByCategoryChart from '@/components/catalog/CatalogRevenueByCategoryChart';
import CatalogRatingsBreakdownChart from '@/components/catalog/CatalogRatingsBreakdownChart';
import CatalogReviewsView from '@/components/catalog/CatalogReviewsView';

// Views -> Saves -> Orders, each stage's bar scaled against the biggest of
// the three so the drop-off between stages actually reads visually instead
// of being three unrelated numbers.
function EngagementFunnel({ items }: { readonly items: CatalogItem[] }) {
  const totalViews = items.reduce((sum, i) => sum + (i.views_count || 0), 0);
  const totalSaves = items.reduce((sum, i) => sum + (i.saves_count || 0), 0);
  const totalOrders = items.reduce((sum, i) => sum + (i.order_count || 0), 0);
  const max = Math.max(totalViews, 1);

  // One hue, light -> dark by stage (a funnel is a sequence of the same
  // metric narrowing, not three unrelated categories) — see dataviz skill.
  const stages = [
    { label: 'Views', value: totalViews, icon: Eye, color: '#86b6ef' },
    { label: 'Saves', value: totalSaves, icon: Heart, color: '#3987e5' },
    { label: 'Orders', value: totalOrders, icon: ShoppingBag, color: '#1c5cab' },
  ];

  return (
    <div className="bg-surface border border-line p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-taupe" />
        <h3 className="text-sm font-semibold text-ink">Engagement Funnel</h3>
      </div>
      <div className="space-y-3.5">
        {stages.map((s) => {
          const Icon = s.icon;
          const widthPct = Math.max((s.value / max) * 100, s.value > 0 ? 4 : 0);
          return (
            <div key={s.label}>
              <div className="flex items-center justify-between mb-1 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-ink-body">
                  <Icon size={12} style={{ color: s.color }} /> {s.label}
                </span>
                <span className="font-bold text-ink">{s.value.toLocaleString()}</span>
              </div>
              <div className="h-2.5 bg-canvas w-full">
                <div className="h-full" style={{ width: `${widthPct}%`, backgroundColor: s.color }} />
              </div>
            </div>
          );
        })}
      </div>
      {totalViews > 0 && (
        <p className="text-[11px] text-ink-faint mt-4 pt-3 border-t border-line/60">
          {((totalOrders / totalViews) * 100).toFixed(1)}% of views convert into an order.
        </p>
      )}
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color, bg }: {
  readonly label: string; readonly value: string | number; readonly icon: React.ElementType;
  readonly color: string; readonly bg: string;
}) {
  return (
    <div className="bg-surface border border-line p-4 sm:p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-ink-muted">{label}</span>
        <span className={`p-2 rounded-xl ${bg} ${color}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className="text-2xl font-bold font-mono text-ink">{value}</p>
    </div>
  );
}

export default function CatalogAnalyticsView() {
  const { store, user } = useAuthStore();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(() => {
    if (store?.id) {
      api.get(`/stores/${store.id}/catalog`)
        .then(res => {
          setItems(res.data.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else if (user?.id) {
      setTimeout(() => setLoading(false), 0);
    }
  }, [store, user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const totalViews = items.reduce((sum, i) => sum + (i.views_count || 0), 0);
  const totalSaves = items.reduce((sum, i) => sum + (i.saves_count || 0), 0);
  const totalOrders = items.reduce((sum, i) => sum + (i.order_count || 0), 0);
  const totalRevenue = items.reduce((sum, i) => sum + Number(i.total_revenue || 0), 0);

  const kpiCards = [
    { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, color: 'text-taupe', bg: 'bg-taupe/10' },
    { label: 'Total Saves', value: totalSaves.toLocaleString(), icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Total Orders', value: totalOrders.toLocaleString(), icon: ShoppingBag, color: 'text-sage', bg: 'bg-sage/10' },
    { label: 'Total Revenue', value: `₱${totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, icon: Wallet, color: 'text-emerald-700', bg: 'bg-emerald-50' },
  ];

  if (loading) {
    return <div className="py-12 text-center text-ink-faint animate-pulse">Loading analytics…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 bg-surface border border-line">
        <p className="text-xs text-ink-muted">No catalog designs yet. Add some to your Design Catalog to see performance analytics here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {kpiCards.map(card => <KpiCard key={card.label} {...card} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <CatalogRevenueByCategoryChart items={items} />
        <CatalogRatingsBreakdownChart items={items} />
        <EngagementFunnel items={items} />
      </div>

      <CatalogTopPerformersChart items={items} loading={loading} />

      <div className="pt-2">
        <CatalogReviewsView />
      </div>
    </div>
  );
}
