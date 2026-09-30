import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Star } from 'lucide-react';
import { CatalogItem } from './catalogHelpers';

interface CatalogRatingsBreakdownChartProps {
  readonly items: CatalogItem[];
}

const BUCKETS = [
  { label: '5.0', min: 4.75, max: 5.01 },
  { label: '4.0–4.9', min: 4.0, max: 4.75 },
  { label: '3.0–3.9', min: 3.0, max: 4.0 },
  { label: '2.0–2.9', min: 2.0, max: 3.0 },
  { label: '< 2.0', min: 0, max: 2.0 },
];

export default function CatalogRatingsBreakdownChart({ items }: CatalogRatingsBreakdownChartProps) {
  const data = useMemo(() => {
    const rated = items.filter(i => i.reviews_count > 0 && i.reviews_avg_rating != null);
    return BUCKETS.map(b => ({
      label: b.label,
      count: rated.filter(i => {
        const r = Number(i.reviews_avg_rating);
        return r >= b.min && r < b.max;
      }).length,
    }));
  }, [items]);

  const ratedCount = items.filter(i => i.reviews_count > 0).length;

  return (
    <div className="bg-surface border border-line p-5">
      <div className="flex items-center gap-2 mb-1">
        <Star size={16} className="text-taupe" />
        <h3 className="text-sm font-semibold text-ink">Designs by Rating</h3>
      </div>
      <p className="text-xs text-ink-faint mb-4">{ratedCount} rated design{ratedCount === 1 ? '' : 's'}, by average star rating.</p>

      {ratedCount === 0 ? (
        <div className="h-48 flex items-center justify-center text-xs text-ink-faint">No ratings yet.</div>
      ) : (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBE6E0" horizontal={false} />
              <XAxis type="number" stroke="#A8A19A" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="label" stroke="#A8A19A" fontSize={11} tickLine={false} axisLine={false} width={62} />
              <Tooltip
                formatter={(val) => [`${val} design${Number(val) === 1 ? '' : 's'}`, '']}
                contentStyle={{ backgroundColor: '#fff', borderColor: '#EBE6E0', borderRadius: '0.5rem', fontSize: 12 }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.map((d) => (
                  <Cell key={d.label} fill={d.label === '5.0' ? '#9A8073' : '#D9CDB8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
