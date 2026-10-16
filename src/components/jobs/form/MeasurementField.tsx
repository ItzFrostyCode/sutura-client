import Link from 'next/link';
import { FIELD, LABEL, Chip } from './FormStep';
import type { CustomerMeasurement } from './types';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

interface Props {
  readonly customerId: string;
  readonly measurements: CustomerMeasurement[];
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
  readonly standardSize: string;
  readonly onStandardSize: (size: string) => void;
}

/** The customer's saved measurements (newest first), or a standard size when they have none yet. */
export default function MeasurementField({ customerId, measurements, selectedId, onSelect, standardSize, onStandardSize }: Props) {
  if (!customerId) return <p className="text-sm text-ink-faint">Choose the customer first to see their measurements.</p>;
  const record = (
    <Link href={`/dashboard/measurements?customer_id=${customerId}`} className="text-xs font-semibold text-taupe hover:underline">
      {measurements.length === 0 ? 'Record measurements' : 'View / edit'}
    </Link>
  );
  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <label htmlFor="measurement_id" className={`${LABEL} mb-0`}>Measurements</label>
          {record}
        </div>
        {measurements.length > 0 ? (
          <select id="measurement_id" value={selectedId} onChange={(e) => onSelect(e.target.value)} className={FIELD}>
            <option value="">None yet — take them later</option>
            {measurements.map((m, i) => (
              <option key={m.id} value={m.id}>V{m.version} · {m.profile_name}{i === 0 ? ' (latest)' : ''}</option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-ink-muted">No saved measurements for this customer.</p>
        )}
      </div>
      {!selectedId && (
        <div>
          <span className={LABEL}>Or a standard size</span>
          <div className="flex flex-wrap gap-2">
            {SIZES.map((s) => <Chip key={s} active={standardSize === s} onClick={() => onStandardSize(standardSize === s ? 'Custom Measurements' : s)}>{s}</Chip>)}
          </div>
        </div>
      )}
    </div>
  );
}
