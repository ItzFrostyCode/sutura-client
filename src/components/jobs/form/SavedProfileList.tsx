import { MeasurementStatusBadge } from '@/components/measurements/MeasurementStatus';
import { unitOfMetrics } from '@/lib/measurementUnit';
import MeasurementPurpose from '@/components/measurements/MeasurementPurpose';
import { MetricPill, humanizeMetricKey } from '@/components/measurements/measurementHelpers';
import type { CustomerMeasurement } from './types';

interface Props {
  readonly profiles: CustomerMeasurement[];
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
  /** The consultation this order is written up from: its measurements are marked. */
  readonly appointmentId?: string | null;
}

/** The customer's saved measurements, all in view: pick the one this order is cut from. */
export default function SavedProfileList({ profiles, selectedId, onSelect, appointmentId }: Props) {
  return (
    <ul className="divide-y divide-espresso/[0.06] overflow-hidden rounded-lg border border-espresso/[0.08]">
      {profiles.map((m) => {
        const on = String(m.id) === selectedId;
        const metrics = Object.entries(m.metrics ?? {}).filter(([k, v]) => Boolean(v) && !k.startsWith('_'));
        return (
          <li key={m.id}>
            <label className={`flex cursor-pointer gap-3 p-3 ${on ? 'bg-espresso/[0.05]' : 'hover:bg-espresso/[0.02]'}`}>
              <input type="radio" name="measurement-profile" checked={on} onChange={() => onSelect(String(m.id))} className="mt-1 h-5 w-5 shrink-0 accent-espresso" />
              <span className="min-w-0 flex-1 space-y-1.5">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-ink">{m.profile_name}</span>
                  <span className="text-xs text-ink-muted">Version {m.version ?? 1} · {new Date(m.updated_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <MeasurementStatusBadge status={m.status} />
                  {appointmentId && String(m.appointment_id) === appointmentId && <span className="rounded-full border border-taupe/30 bg-espresso/[0.05] px-2 py-0.5 text-[10px] font-medium text-espresso">Taken at this consultation</span>}
                </span>
                <MeasurementPurpose record={m} />
                {metrics.length > 0 ? (
                  <span className="flex flex-wrap gap-1.5">{metrics.map(([k, v]) => <MetricPill key={k} label={humanizeMetricKey(k)} value={String(v)} unit={unitOfMetrics(m.metrics)} />)}</span>
                ) : (
                  <span className="block text-xs text-ink-faint">{m.photo_urls?.length ? 'Paper sheet photos only — no typed values.' : 'No values typed in.'}</span>
                )}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
