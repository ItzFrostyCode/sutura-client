'use client';

import { TOP_POINTS, BOTTOM_POINTS, UNIT_LIMIT, UNIT_SHORT, cleanMeasure, measureProblem, sample, type Area, type MeasuringPoint, type Unit } from './orderPoints';

function PointField({ p, id, unit, value, onChange }: Readonly<{ p: MeasuringPoint; id: string; unit: Unit; value: string; onChange: (v: string) => void }>) {
  const problem = measureProblem(value, unit);
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-base font-medium text-ink">
        {p.label}{p.optional && <span className="font-normal text-ink-faint"> (optional)</span>}
      </label>
      <p className="mobile-caption mb-1.5 text-ink-muted">{p.tip}</p>
      <div className="relative">
        <input
          id={id} type="text" inputMode="decimal" autoComplete="off" maxLength={6} value={value} placeholder={sample(p, unit)}
          aria-invalid={Boolean(problem)} onChange={(e) => onChange(cleanMeasure(e.target.value, unit))}
          className={`h-12 w-full rounded-xl border bg-surface pl-4 pr-12 text-base tabular-nums text-ink placeholder:text-ink-faint focus:outline-none focus:ring-4 focus:ring-ink/5 ${problem ? 'border-rose-400' : 'border-line focus:border-ink'}`}
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-muted">{UNIT_SHORT[unit]}</span>
      </div>
      {problem && (
        <p role="alert" className="mobile-caption mt-1 text-rose-700">
          {problem === 'probably-cm' ? 'Too big for inches. If this is cm, switch “Measure in” to centimeters above and type the numbers again.'
            : problem === 'too-big' ? `Max ${UNIT_LIMIT[unit].max} ${unit}.` : 'Enter a number above 0.'}
        </p>
      )}
    </div>
  );
}

/**
 * The measuring fields of the chosen part (Top, Bottom, or both under their own headings), each with where to measure
 * and the unit inside the field. `keyBy` picks what the values are stored under: the point key (one person, read by
 * individual_measurements) or its label (a group's Custom Fit row, read as fit_metrics).
 */
export default function OrderPointInputs({ area, unit, values, onChange, idPrefix, keyBy = 'key' }: Readonly<{
  area: Area | ''; unit: Unit; values: Record<string, string>; onChange: (k: string, v: string) => void; idPrefix: string; keyBy?: 'key' | 'label';
}>) {
  const groups: { title: string; points: readonly MeasuringPoint[] }[] = [];
  if (area !== 'bottom') groups.push({ title: 'Top', points: TOP_POINTS });
  if (area === 'bottom' || area === 'both') groups.push({ title: 'Bottom', points: BOTTOM_POINTS });

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.title} className="space-y-4">
          {groups.length > 1 && <p className="mobile-overline text-ink-muted">{g.title}</p>}
          <div className="grid grid-cols-1 gap-4 min-[481px]:grid-cols-2">
            {g.points.map((p) => {
              const k = keyBy === 'key' ? p.key : p.label;
              return <PointField key={k} p={p} id={`${idPrefix}-${p.key}`} unit={unit} value={values[k] ?? ''} onChange={(v) => onChange(k, v)} />;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
