'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Eye, Heart, ShoppingBag, Wallet } from 'lucide-react';

import { CatalogItem } from '@/components/catalog/catalogHelpers';
import CatalogTopPerformersChart from '@/components/catalog/CatalogTopPerformersChart';

export default function CatalogAnalyticsView() {
  const { shop, user } = useAuthStore();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(() => {
    if (shop?.id) {
      api.get(`/shops/${shop.id}/catalog`)
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
  }, [shop, user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const totalViews = items.reduce((sum, i) => sum + (i.views_count || 0), 0);
  const totalSaves = items.reduce((sum, i) => sum + (i.saves_count || 0), 0);
  const totalOrders = items.reduce((sum, i) => sum + (i.order_count || 0), 0);
  const totalRevenue = items.reduce((sum, i) => sum + (i.total_revenue || 0), 0);

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
      <div className="text-center py-16 bg-surface rounded-2xl border border-line shadow-2xs">
        <p className="text-xs text-ink-muted">No catalog items yet. Add some to your Design Catalog to see performance analytics here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-ink-muted">{card.label}</span>
                <span className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                  <Icon size={16} />
                </span>
              </div>
              <p className="text-2xl font-bold font-mono text-ink">{card.value}</p>
            </div>
          );
        })}
      </div>

      <CatalogTopPerformersChart items={items} loading={loading} />
    </div>
  );
}
