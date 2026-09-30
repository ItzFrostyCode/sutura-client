import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Star } from 'lucide-react';
import type { Service } from './serviceHelpers';

const BUCKETS = [
  { label: '5.0', min: 4.75, max: 5.01 },
  { label: '4.0–4.9', min: 4.0, max: 4.75 },
  { label: '3.0–3.9', min: 3.0, max: 4.0 },
  { label: '2.0–2.9', min: 2.0, max: 3.0 },
  { label: '< 2.0', min: 0, max: 2.0 },
];

export default function ServiceRatingsBreakdownChart({ services }: Readonly<{ services: Service[] }>) {
  const rated = useMemo(() => services.filter((s) => (s.reviews_count ?? 0) > 0 && s.reviews_avg_rating != null), [services]);
  const data = useMemo(() => BUCKETS.map((b) => ({ label: b.label, count: rated.filter((s) => Number(s.reviews_avg_rating) >= b.min && Number(s.reviews_avg_rating) < b.max).length })), [rated]);

  return (
    <div className="bg-surface border border-line p-5">
      <div className="flex items-center gap-2 mb-1">
        <Star size={16} className="text-taupe" />
        <h3 className="text-sm font-semibold text-ink">Services by Rating</h3>
      </div>
      <p className="text-xs text-ink-faint mb-4">{rated.length} rated service{rated.length === 1 ? '' : 's'}, by average star rating.</p>
      {rated.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-xs text-ink-faint">No ratings yet.</div>
      ) : (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBE6E0" horizontal={false} />
              <XAxis type="number" stroke="#A8A19A" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="label" stroke="#A8A19A" fontSize={11} tickLine={false} axisLine={false} width={62} />
              <Tooltip formatter={(v) => [`${v} service${Number(v) === 1 ? '' : 's'}`, '']} contentStyle={{ backgroundColor: '#fff', borderColor: '#EBE6E0', borderRadius: 0, fontSize: 12 }} />
              <Bar dataKey="count">
                {data.map((d) => <Cell key={d.label} fill={d.label === '5.0' ? '#9A8073' : '#D9CDB8'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
