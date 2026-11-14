'use client';

import MeasurementSheet from '@/components/account/measurements/MeasurementSheet';
import type { MeasurementRecord } from '@/components/measurements/measurementTypes';
import type { ServiceOrderState } from './useServiceOrder';
import { ChoiceCard, SectionLabel } from './orderUi';

const when = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '');

/**
 * "Use measurements on file": which profile (when there is more than one: you, a child, someone from a group order),
 * then every size in it, in the same sheet the customer sees in My Measurements, so they know exactly what the shop
 * will cut by. Nothing here is editable: the shop records measurements; a new measuring visit is the way to change them.
 */
export default function OrderSavedMeasurements({ o }: Readonly<{ o: ServiceOrderState }>) {
  const { f } = o;
  const saved = o.data.saved as unknown as MeasurementRecord[];
  const chosen = saved.find((m) => m.id === f.measurementId) ?? null;

  return (
    <div className="space-y-4">
      {saved.length > 1 ? (
        <fieldset>
          <SectionLabel as="legend" hint="Each person keeps their own measurements.">Whose measurements?</SectionLabel>
          <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="Whose measurements">
            {saved.map((m) => (
              <ChoiceCard key={m.id} selected={f.measurementId === m.id} onSelect={() => f.setMeasurementId(m.id)}
                label={m.profile_name} detail={`Version ${m.version ?? 1}${m.updated_at ? ` · updated ${when(m.updated_at)}` : ''}`} />
            ))}
          </div>
        </fieldset>
      ) : null}

      {chosen && (
        <section aria-label={`Measurements: ${chosen.profile_name}`} className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
          <div className="mb-4">
            <h3 className="mobile-h4 text-ink">{chosen.profile_name}</h3>
            <p className="mobile-caption text-ink-muted">
              Version {chosen.version ?? 1}{chosen.updated_at ? ` · updated ${when(chosen.updated_at)}` : ''}
              {chosen.status === 'pending_fitting' ? ' · to be confirmed at the fitting' : ''}
            </p>
          </div>
          <MeasurementSheet record={chosen} />
        </section>
      )}

      <p className="mobile-body-sm text-ink-muted">
        Not up to date? Choose &ldquo;Have the shop measure me&rdquo; above and the shop takes new measurements.
      </p>
    </div>
  );
}
