'use client';

import { ArrowLeftRight } from 'lucide-react';
import { UNIT_LIMIT, cleanMeasure, measureProblem, type Unit } from './orderPoints';

/**
 * One measurement of one person: the number, and its own unit at the right of the field — tap it to swap between
 * "in" and "cm" (both look the same: a choice, not an on/off). Switching keeps the number.
 * Only a real measurement can be typed: digits and one dot, at most 80 in (2 decimals) or 200 cm (1 decimal). A number
 * too big for inches but fine in cm asks "Is it cm?" with a one-tap switch. The same field on every screen size.
 */
export default function OrderUnitCell({ value, unit, onValue, onUnit, label, disabled = false, wide = false }: Readonly<{
  value: string; unit: Unit; onValue: (v: string) => void; onUnit: (u: Unit) => void; label: string; disabled?: boolean; wide?: boolean;
}>) {
  const next: Unit = unit === 'in' ? 'cm' : 'in';
  const problem = disabled ? null : measureProblem(value, unit);
  const message = problem === 'probably-cm' ? 'Too big for inches. Is it cm?'
    : problem === 'too-big' ? `Max ${UNIT_LIMIT[unit].max} ${unit}.`
      : problem === 'zero' ? 'Enter a number above 0.' : '';

  return (
    <span className={`block ${wide ? 'w-full' : 'w-28'}`}>
      <span className="relative block">
        <input
          type="text" inputMode="decimal" autoComplete="off" maxLength={6} disabled={disabled} value={disabled ? '' : value}
          aria-label={`${label}, in ${unit === 'in' ? 'inches' : 'centimeters'}`} aria-invalid={Boolean(problem)} placeholder={disabled ? '—' : ''}
          onChange={(e) => onValue(cleanMeasure(e.target.value, unit))}
          className={`h-11 w-full min-w-0 rounded-lg border bg-surface pl-2 pr-14 text-center text-base tabular-nums text-ink focus:outline-none disabled:bg-sunken disabled:text-ink-faint ${problem ? 'border-rose-400 focus:border-rose-500' : 'border-line focus:border-ink'}`}
        />
        {!disabled && (
          // in and cm look exactly alike: two equal choices, never "on" and "off". Only the word changes; the arrows say "tap to swap".
          <button type="button" onClick={() => onUnit(next)} aria-label={`${label}: switch to ${next === 'cm' ? 'centimeters' : 'inches'}`}
            className="absolute right-1 top-1/2 flex h-8 -translate-y-1/2 items-center gap-1 rounded-md border border-line bg-sunken px-1.5 text-xs font-semibold text-ink transition-colors hover:border-line-strong">
            {unit}
            <ArrowLeftRight size={11} className="text-ink-muted" aria-hidden />
          </button>
        )}
      </span>
      {message && (
        <span role="alert" className="mt-1 flex flex-wrap items-center gap-x-1 text-left text-xs leading-tight text-rose-700">
          {message}
          {problem === 'probably-cm' && (
            <button type="button" onClick={() => onUnit('cm')} className="font-semibold underline underline-offset-2">Switch to cm</button>
          )}
        </span>
      )}
    </span>
  );
}
