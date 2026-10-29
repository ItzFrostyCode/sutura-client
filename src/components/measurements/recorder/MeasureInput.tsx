import { useState } from 'react';
import { PLAIN_FIELD } from '@/components/shared/plainForm';
import { joinMeasure, splitMeasure, type MeasureUnit } from '@/lib/measurementUnit';

interface Props {
  readonly id?: string;
  readonly label: string;
  readonly value: string;
  /** The unit the measurement is kept in (the shop's, or the record's). A value in the other unit carries it, e.g. "96.5 cm". */
  readonly recordUnit: MeasureUnit;
  readonly onChange: (value: string) => void;
  readonly compact?: boolean;
}

/** One measurement: the number and its own unit, so each field can be inches or centimeters by itself. */
export default function MeasureInput({ id, label, value, recordUnit, onChange, compact = false }: Props) {
  const { number, unit, explicit } = splitMeasure(value, recordUnit);
  // With nothing typed there is nowhere to keep the unit yet, so it is remembered here until a number comes.
  const [picked, setPicked] = useState<MeasureUnit | null>(null);
  const shown = number === '' && !explicit ? picked ?? recordUnit : unit;
  const h = compact ? 'h-10' : 'h-11';
  return (
    <div className="flex">
      <input
        id={id} type="text" inputMode="decimal" value={number} placeholder="0.0" aria-label={id ? undefined : label}
        onChange={(e) => onChange(joinMeasure(e.target.value, shown, recordUnit))}
        className={`${PLAIN_FIELD} ${h} min-w-0 rounded-r-none border-r-0 text-right font-mono`}
      />
      <select
        aria-label={`${label} unit`} value={shown}
        onChange={(e) => { const u = e.target.value as MeasureUnit; setPicked(u); onChange(joinMeasure(number, u, recordUnit)); }}
        className={`${h} w-16 shrink-0 cursor-pointer rounded-r-xl border border-espresso/20 bg-espresso/[0.05] pl-2 text-base text-espresso focus:border-espresso/60 focus:outline-none sm:text-sm`}
      >
        <option value="in">in</option>
        <option value="cm">cm</option>
      </select>
    </div>
  );
}
