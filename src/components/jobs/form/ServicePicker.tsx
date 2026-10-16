import { SERVICE_GROUPS, type ServiceGroupKey } from '@/lib/garmentTaxonomy';
import { formatTurnaround } from '@/lib/formatTurnaround';
import { LABEL } from './FormStep';
import { peso } from './jobFormHelpers';
import type { ServiceData } from './types';

interface Props {
  readonly services: ServiceData[];
  readonly selectedId: string;
  readonly onPick: (id: string) => void;
  readonly garmentLabel: string | null;
}

/** The shop's services that can do this garment. Price, time and kind of work are shown so no one has to open the Services page. */
export default function ServicePicker({ services, selectedId, onPick, garmentLabel }: Props) {
  if (services.length === 0) {
    return <p className="text-sm text-ink-muted">This shop has no services yet. Add one under Services first.</p>;
  }
  return (
    <fieldset>
      <legend className={LABEL}>
        Service <span className="text-danger">*</span>
        {garmentLabel && <span className="ml-1 font-normal normal-case tracking-normal text-ink-faint">— that can do {garmentLabel}</span>}
      </legend>
      <ul className="divide-y divide-line border-y border-line">
        {services.map((s) => {
          const on = s.id.toString() === selectedId;
          const kind = s.service_category && s.service_category in SERVICE_GROUPS ? SERVICE_GROUPS[s.service_category as ServiceGroupKey].label : null;
          const price = Number(s.base_price) > 0 ? `From ${peso(Number(s.base_price))}` : 'Price on quotation';
          return (
            <li key={s.id}>
              <label className={`flex min-h-14 cursor-pointer items-center gap-3 px-1 py-2.5 ${on ? 'bg-taupe/5' : 'hover:bg-canvas'}`}>
                <input type="radio" name="job-service" required checked={on} onChange={() => onPick(s.id.toString())} className="h-5 w-5 shrink-0 accent-taupe" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{s.name}</span>
                  {kind && <span className="block truncate text-xs text-ink-muted">{kind}</span>}
                </span>
                <span className="shrink-0 text-right text-xs text-ink-muted">
                  <span className="block font-semibold text-ink">{price}</span>
                  <span>{formatTurnaround(s.estimated_days, s.estimated_days_max)}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
