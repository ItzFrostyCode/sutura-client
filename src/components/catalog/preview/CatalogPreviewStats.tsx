import { Eye, Heart, Star, ShoppingBag, Wallet } from 'lucide-react';
import { CatalogItem } from '../catalogHelpers';

interface CatalogPreviewStatsProps {
  item: CatalogItem;
}

// Owner-only strip — the one part of the preview a customer never sees.
export default function CatalogPreviewStats({ item }: Readonly<CatalogPreviewStatsProps>) {
  const stats = [
    { label: 'Views', value: item.views_count || 0, Icon: Eye },
    { label: 'Saves', value: item.saves_count || 0, Icon: Heart },
    { label: 'Rating', value: item.reviews_avg_rating ? Number(item.reviews_avg_rating).toFixed(1) : '0.0', Icon: Star },
    { label: 'Orders', value: item.order_count || 0, Icon: ShoppingBag },
    {
      label: 'Revenue',
      value: `₱${Number(item.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      Icon: Wallet,
    },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 border border-line bg-surface">
      {stats.map(({ label, value, Icon }) => (
        <div key={label} className="px-3 py-2 border-r border-b sm:border-b-0 border-line last:border-r-0 min-w-0">
          <span className="flex items-center gap-1 text-[11px] text-ink-muted">
            <Icon size={12} className="shrink-0" /> {label}
          </span>
          <p className="text-sm font-semibold text-ink truncate">{value}</p>
        </div>
      ))}
    </div>
  );
}
