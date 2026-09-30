import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Trophy, Eye, ShoppingBag } from 'lucide-react';
import { CatalogItem } from './catalogHelpers';
import { getMediaUrl } from '@/lib/media';

interface CatalogTopPerformersChartProps {
  readonly items: CatalogItem[];
  readonly loading: boolean;
}

interface RevenueTooltipPayload {
  readonly payload: CatalogItem;
}

const truncateName = (name: string, max = 22) => (name.length > max ? `${name.slice(0, max - 1)}…` : name);

const RevenueTooltip = ({ active, payload }: { active?: boolean; payload?: readonly RevenueTooltipPayload[] }) => {
  if (active && payload?.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-surface border border-line px-4 py-3 max-w-[220px]">
        <p className="text-xs font-medium text-ink mb-1 leading-snug">{item.name}</p>
        <p className="text-base font-bold text-taupe">
          ₱{Number(item.total_revenue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-ink-faint mt-1">
          {item.order_count || 0} order{item.order_count === 1 ? '' : 's'} • {item.views_count} views
        </p>
      </div>
    );
  }
  return null;
};

export default function CatalogTopPerformersChart({ items, loading }: CatalogTopPerformersChartProps) {
  if (loading) {
    return (
      <div className="bg-surface border border-line p-6 text-center text-sm text-ink-faint py-12">
        Loading top performers…
      </div>
    );
  }

  const hasAnyRevenue = items.some(i => (i.total_revenue || 0) > 0);
  const sortFn = (a: CatalogItem, b: CatalogItem) =>
    hasAnyRevenue ? (b.total_revenue || 0) - (a.total_revenue || 0) : (b.views_count || 0) - (a.views_count || 0);

  // Chart shows the top 8; the ranked list under it goes to 10 — both are
  // a curated leaderboard, not a full data dump of the whole catalog. The
  // full catalog is already one click away on the Designs tab itself.
  const ranked = [...items].sort(sortFn);
  const chartItems = ranked.slice(0, 8).map(i => ({ ...i, chartLabel: truncateName(i.name) }));
  const topTen = ranked.slice(0, 10);

  if (chartItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-surface border border-line p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Trophy size={18} className="text-taupe" />
        <div>
          <h2 className="text-base font-semibold text-ink">Top Performing Designs</h2>
          <p className="text-sm text-ink-faint mt-0.5">
            {hasAnyRevenue ? 'Top 8, ranked by revenue generated.' : 'No orders yet — top 8 by views in the meantime.'}
          </p>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartItems}
            layout="vertical"
            margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
            barSize={18}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#EBE6E0" horizontal={false} />
            <XAxis
              type="number"
              stroke="#A8A19A"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tickFormatter={v => (hasAnyRevenue ? `₱${v >= 1000 ? `${v / 1000}k` : v}` : String(v))}
            />
            <YAxis
              type="category"
              dataKey="chartLabel"
              stroke="#A8A19A"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={150}
            />
            <Tooltip content={<RevenueTooltip />} cursor={{ fill: '#F0EAE3' }} />
            <Bar dataKey={hasAnyRevenue ? 'total_revenue' : 'views_count'} fill="#9A8073" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Ranked list — actual design photos, not another data table. */}
      <div className="pt-2 border-t border-line">
        <p className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-3">Top 10 Leaderboard</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {topTen.map((item, idx) => {
            const primaryImage = item.images.find(img => img.is_primary)?.image_url || item.images[0]?.image_url;
            return (
              <div key={item.id} className="flex items-center gap-3 border border-line p-2 hover:border-line-strong transition-colors">
                <span className="w-5 text-center text-sm font-bold text-ink-faint shrink-0">{idx + 1}</span>
                <div className="w-11 h-11 bg-sunken shrink-0 overflow-hidden">
                  {primaryImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={getMediaUrl(primaryImage)} alt="" className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-ink truncate">{item.name}</p>
                  <div className="flex items-center gap-2.5 text-[11px] text-ink-muted mt-0.5">
                    <span className="flex items-center gap-0.5"><Eye size={10} /> {item.views_count}</span>
                    <span className="flex items-center gap-0.5"><ShoppingBag size={10} /> {item.order_count || 0}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-ink shrink-0">
                  ₱{Number(item.total_revenue || 0).toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
