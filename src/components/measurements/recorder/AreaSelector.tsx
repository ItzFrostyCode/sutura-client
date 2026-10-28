'use client';

import React from 'react';
import Segmented from '@/components/shared/Segmented';
import { COVERS_FIELD, COVERS_HINT, COVERS_LABEL } from '@/lib/orderUnits';

export type MeasurementAreaChoice = 'top' | 'bottom' | 'both';

interface AreaSelectorProps {
  readonly personName: string;
  /** '' = nothing chosen yet: no button is selected. */
  readonly selectedArea: MeasurementAreaChoice | '';
  readonly onSelectArea: (area: MeasurementAreaChoice) => void;
  /** Customer-facing look: square, taupe, and a plainer question. */
  readonly square?: boolean;
}

const CHOICES = (['top', 'bottom', 'both'] as const).map((value) => ({ value, label: COVERS_LABEL[value], hint: COVERS_HINT[value] }));

/** What this person gets / needs measured, in one row. Asked first, before any size. */
export default function AreaSelector({ personName, selectedArea, onSelectArea, square = false }: AreaSelectorProps) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-espresso">{COVERS_FIELD}</legend>
      <Segmented label="Body area" value={selectedArea as MeasurementAreaChoice} onChange={onSelectArea} options={CHOICES} hint={CHOICES.find((c) => c.value === selectedArea)?.hint} square={square} />
    </fieldset>
  );
}
