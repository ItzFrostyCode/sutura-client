'use client';

import React from 'react';
import { DollarSign, ShoppingBag, Eye, Heart, Star } from 'lucide-react';
import { DetailedCatalogItem } from './detailTypes';

interface CatalogKPIBandProps {
  item: DetailedCatalogItem;
}

export default function CatalogKPIBand({ item }: CatalogKPIBandProps) {
  const stats = [
    {
      label: 'Total Revenue',
      value: `₱${Number(item.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      sub: 'From all orders',
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      label: 'Total Orders',
      value: String(item.order_count ?? (item.catalog_orders_count || 0) + (item.job_orders_count || 0)),
      sub: `${item.catalog_orders_count || 0} walk-in · ${item.job_orders_count || 0} custom`,
      icon: ShoppingBag,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      label: 'Storefront Views',
      value: String(item.views_count || 0),
      sub: 'Customer impressions',
      icon: Eye,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      label: 'Wishlist Saves',
      value: String(item.saves_count || 0),
      sub: 'Saved by customers',
      icon: Heart,
      color: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      label: 'Average Rating',
      value: item.reviews_avg_rating ? `${item.reviews_avg_rating} ★` : 'No rating',
      sub: `${item.reviews_count || 0} customer reviews`,
      icon: Star,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-white rounded-2xl p-4 shadow-sm border border-line flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">{stat.label}</span>
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${stat.color}`}>
                <Icon size={14} />
              </div>
            </div>
            <div>
              <p className="text-xl font-black text-ink tracking-tight">{stat.value}</p>
              <p className="text-[10px] text-ink-muted mt-0.5">{stat.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
