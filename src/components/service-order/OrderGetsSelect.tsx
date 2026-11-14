'use client';

import type { ServiceOrderState } from './useServiceOrder';
import type { RosterRow } from './useOrderForm';
import type { Area } from './orderPoints';
import { optionOfRow } from './orderLines';
import { peso } from './orderMath';

const PARTS: { value: Area; label: string }[] = [{ value: 'both', label: 'Set' }, { value: 'top', label: 'Top' }, { value: 'bottom', label: 'Bottom' }];

/**
 * What one person on a group order gets. When the service has options for each part (Complete set, Blouse only…) the
 * person picks an option, priced, and their part follows it; otherwise they pick the part (Set / Top / Bottom). Nothing
 * shows when the order's option already decides it for everyone. One control for the table, the phone cards and the rows.
 */
export default function OrderGetsSelect({ o, row, className, prefix = '' }: Readonly<{ o: ServiceOrderState; row: RosterRow; className: string; prefix?: string }>) {
  const { f } = o;
  const who = row.name.trim() || 'this person';

  if (o.perPerson) {
    const current = optionOfRow(row, o.personOptions, o.option);
    return (
      <select value={current?.id ?? ''} aria-label={`What ${who} gets`} className={className}
        onChange={(e) => {
          const pick = o.personOptions.find((p) => p.id === Number(e.target.value));
          if (!pick) return;
          const area = pick.covers as Area;
          f.updateRow(row.id, { pricingId: pick.id, area, bottomSize: area === 'both' ? row.bottomSize : '' });
        }}>
        {o.personOptions.map((p) => (
          <option key={p.id} value={p.id}>{prefix}{p.label}{o.quoted || !Number(p.amount) ? '' : ` · ${peso(Number(p.amount))}`}</option>
        ))}
      </select>
    );
  }
  if (o.areaLocked) return null;
  const gets = (row.area || o.area || 'both') as Area;
  return (
    <select value={gets} aria-label={`What ${who} gets`} className={className}
      onChange={(e) => { const area = e.target.value as Area; f.updateRow(row.id, { area, bottomSize: area === 'both' ? row.bottomSize : '' }); }}>
      {PARTS.map((g) => <option key={g.value} value={g.value}>{prefix}{g.label}</option>)}
    </select>
  );
}
