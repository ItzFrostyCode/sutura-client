'use client';

import React from 'react';
import RadioRows from '@/components/shared/RadioRows';

export type MeasurementAreaChoice = 'top' | 'bottom' | 'both';

interface AreaSelectorProps {
  readonly personName: string;
  readonly selectedArea: MeasurementAreaChoice;
  readonly onSelectArea: (area: MeasurementAreaChoice) => void;
}

const CHOICES = [
  { value: 'top' as const, title: 'Top', hint: 'Shirts, barongs, jackets, polos' },
  { value: 'bottom' as const, title: 'Bottom', hint: 'Pants, trousers, skirts, shorts' },
  { value: 'both' as const, title: 'Top and bottom', hint: 'Suits, matching sets, uniforms, full body' },
];

/** What needs to be measured on this person. Changing it never wipes values already typed. */
export default function AreaSelector({ personName, selectedArea, onSelectArea }: AreaSelectorProps) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-espresso">What needs to be measured for {personName || 'this person'}?</legend>
      <RadioRows label="Body area" value={selectedArea} onChange={onSelectArea} options={CHOICES} />
    </fieldset>
  );
}
