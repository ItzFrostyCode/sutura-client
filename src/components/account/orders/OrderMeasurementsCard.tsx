'use client';

import { Ruler, CheckCircle2, Clock, Users, User } from 'lucide-react';
import type { MeasurementData } from '@/components/shared/OrderTrackingView';

interface OrderMeasurementsCardProps {
  readonly measurements?: MeasurementData | null;
  readonly peopleCount?: number | null;
}

/**
 * Customer-Facing Order Measurements & Sizing Card.
 * Displays tailored body measurements, standard garment size,
 * tailor-verification status, or full team sizing roster.
 */
export default function OrderMeasurementsCard({ measurements, peopleCount }: OrderMeasurementsCardProps) {
  if (!measurements) return null;

  const { metrics, size, unit = 'in', verified, profile_name, team_roster } = measurements;
  const metricEntries = metrics ? Object.entries(metrics) : [];
  const hasRoster = Array.isArray(team_roster) && team_roster.length > 0;

  return (
    <section aria-labelledby="order-measurements-title" className="card-soft p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sunken text-taupe">
            <Ruler size={20} />
          </div>
          <div>
            <span className="mobile-overline text-ink-muted">Tailoring Specifications</span>
            <h2 id="order-measurements-title" className="mobile-h4 text-ink">
              {profile_name ? `Measurements · ${profile_name}` : 'Measurements & Sizing'}
            </h2>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            verified ? 'bg-emerald-50 text-emerald-800' : 'bg-sunken text-ink-muted'
          }`}
        >
          {verified ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Clock size={13} />}
          {verified ? 'Tailor Verified' : 'Customer Submitted'}
        </span>
      </div>

      {/* Standard Size indicator if available */}
      {size && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-sunken/60 px-3.5 py-2 text-sm">
          <User size={15} className="text-taupe shrink-0" />
          <span className="text-ink-muted">Ordered Size:</span>
          <span className="font-semibold text-ink">{size}</span>
        </div>
      )}

      {/* Custom Body Points Grid */}
      {metricEntries.length > 0 && (
        <div className="mt-4">
          <p className="mobile-caption mb-2 font-medium uppercase tracking-wider text-ink-muted">
            Anatomical Body Dimensions ({unit})
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
            {metricEntries.map(([point, val]) => (
              <div key={point} className="rounded-xl border border-line bg-surface p-2.5">
                <p className="mobile-caption truncate text-ink-muted">{point}</p>
                <p className="mobile-body-sm mt-0.5 font-mono font-semibold text-ink">
                  {val} <span className="text-xs font-normal text-ink-faint">{unit}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Roster Sizing (for Bulk / Team Orders) */}
      {hasRoster && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="mobile-caption font-medium uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
              <Users size={14} /> Team Roster ({team_roster.length} members)
            </p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-sunken/50 text-ink-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">#</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Name</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Gender</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Cut</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Size</th>
                  <th scope="col" className="px-3 py-2 font-semibold">No.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-mono">
                {team_roster.map((person, idx) => (
                  <tr key={idx} className="hover:bg-sunken/30">
                    <td className="px-3 py-2 text-ink-faint">{idx + 1}</td>
                    <td className="px-3 py-2 font-sans font-medium text-ink">{person.name}</td>
                    <td className="px-3 py-2 font-sans text-ink-body">{person.gender ?? '—'}</td>
                    <td className="px-3 py-2 font-sans text-ink-body">{person.cut ?? '—'}</td>
                    <td className="px-3 py-2 font-semibold text-ink">{person.size}</td>
                    <td className="px-3 py-2 text-ink-muted">{person.number ? `#${person.number}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
