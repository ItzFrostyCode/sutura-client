'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Eye, Heart, ShoppingBag, Wallet } from 'lucide-react';

import { CatalogItem } from '@/components/catalog/catalogHelpers';
import CatalogModuleTabs from '@/components/catalog/CatalogModuleTabs';
import CatalogTopPerformersChart from '@/components/catalog/CatalogTopPerformersChart';

export default function CatalogAnalyticsPage() {
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
    { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, color: 'text-[#9A8073]', bg: 'bg-[#9A8073]/10' },
    { label: 'Total Saves', value: totalSaves.toLocaleString(), icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Total Orders', value: totalOrders.toLocaleString(), icon: ShoppingBag, color: 'text-[#7A8B76]', bg: 'bg-[#7A8B76]/10' },
    { label: 'Total Revenue', value: `₱${totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, icon: Wallet, color: 'text-emerald-700', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-6 pb-12 text-[#2D2A26]">
      <div>
        <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Catalog Showcase</h1>
        <p className="text-[#827A73] text-sm mt-1">Your made-to-order Design Catalog, Walk-in Orders, and performance analytics in one place.</p>
      </div>

      <CatalogModuleTabs />

      {loading ? (
        <div className="py-12 text-center text-[#A8A19A] animate-pulse">Loading analytics…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#EBE6E0]">
          <p className="text-[#827A73]">No catalog items yet. Add some to your Design Catalog to see performance analytics here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpiCards.map(card => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="bg-white border border-[#EBE6E0] rounded-2xl p-5 shadow-sm">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.bg} mb-3`}>
                    <Icon size={16} className={card.color} />
                  </div>
                  <p className="text-xs font-semibold text-[#A8A19A] uppercase tracking-wider">{card.label}</p>
                  <p className="text-xl font-bold text-[#2D2A26] mt-1">{card.value}</p>
                </div>
              );
            })}
          </div>

          <CatalogTopPerformersChart items={items} loading={false} />
        </div>
      )}
    </div>
  );
}
