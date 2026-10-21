import { Scissors } from 'lucide-react';
import type { MeasurementRecord } from './measurementTypes';

/** "Measured for: Service · Design" — the answer to what this measurement was taken for. */
export default function MeasurementPurpose({ record, className = '' }: Readonly<{ record: Pick<MeasurementRecord, 'service' | 'catalog_item'>; className?: string }>) {
  const names = [record.service?.name, record.catalog_item?.name].filter(Boolean);
  return (
    <p className={`flex min-w-0 items-center gap-1.5 text-xs ${names.length ? 'text-ink-body' : 'text-ink-faint'} ${className}`}>
      <Scissors size={12} className="shrink-0 text-taupe" />
      <span className="shrink-0 font-semibold">Measured for</span>
      <span className="truncate">{names.length ? names.join(' · ') : 'No service chosen'}</span>
    </p>
  );
}
