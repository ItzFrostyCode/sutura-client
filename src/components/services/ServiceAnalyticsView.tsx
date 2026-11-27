'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Star, Heart, ShoppingBag, Wallet } from 'lucide-react';

import { Service, ServicePackage } from '@/components/services/serviceHelpers';
import ServiceTopPerformersChart from '@/components/services/ServiceTopPerformersChart';
import ServiceRevenueByCategoryChart from '@/components/services/ServiceRevenueByCategoryChart';
import ServiceRatingsBreakdownChart from '@/components/services/ServiceRatingsBreakdownChart';
import ServiceEngagementChart from '@/components/services/ServiceEngagementChart';
import ServiceReviewsView from '@/components/services/ServiceReviewsView';

// Mirrors CatalogAnalyticsView exactly — same KPI-cards + top-performers
// chart shape, for Services instead of Catalog Designs.
export default function ServiceAnalyticsView() {
  const { store, user } = useAuthStore();
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = useCallback(() => {
    if (store?.id) {
      api.get(`/stores/${store.id}/service-packages`).then(res => setPackages(res.data.data ?? [])).catch(() => setPackages([]));
      api.get(`/stores/${store.id}/services`)
        .then(res => {
          setServices(res.data.data);
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
    fetchServices();
  }, [fetchServices]);

  const totalReviews = services.reduce((sum, s) => sum + (s.reviews_count || 0), 0);
  const totalSaves = services.reduce((sum, s) => sum + (s.saves_count || 0), 0);
  // Combo packages sell as one order each; their money is counted once, under the package.
  const totalOrders = services.reduce((sum, s) => sum + (s.job_orders_count || 0), 0) + packages.reduce((sum, p) => sum + (p.job_orders_count || 0), 0);
  const totalRevenue = services.reduce((sum, s) => sum + (s.total_revenue || 0), 0) + packages.reduce((sum, p) => sum + (p.total_revenue || 0), 0);

  const kpiCards = [
    { label: 'Total Reviews', value: totalReviews.toLocaleString(), icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Saves', value: totalSaves.toLocaleString(), icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Total Orders', value: totalOrders.toLocaleString(), icon: ShoppingBag, color: 'text-sage', bg: 'bg-sage/10' },
    { label: 'Total Revenue', value: `₱${totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, icon: Wallet, color: 'text-emerald-700', bg: 'bg-emerald-50' },
  ];

  if (loading) {
    return <div className="py-12 text-center text-ink-faint animate-pulse">Loading analytics…</div>;
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-16 bg-surface border border-line">
        <p className="text-xs text-ink-muted">No services yet. Add some to see performance analytics here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {kpiCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-surface border border-line p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-ink-muted">{card.label}</span>
                <span className={`p-2 ${card.bg} ${card.color}`}>
                  <Icon size={16} />
                </span>
              </div>
              <p className="text-2xl font-bold font-mono text-ink">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ServiceRevenueByCategoryChart services={services} packages={packages} />
        <ServiceRatingsBreakdownChart services={services} />
        <ServiceEngagementChart services={services} packages={packages} />
      </div>

      <ServiceTopPerformersChart services={services} loading={loading} />

      <ServiceReviewsView />
    </div>
  );
}
