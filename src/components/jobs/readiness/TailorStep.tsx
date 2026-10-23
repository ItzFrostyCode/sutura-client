import React from 'react';
import { BTN_SM } from '@/components/shared/plainForm';
import type { ReadinessData } from './readinessTypes';

interface TailorStepProps {
  readonly data: ReadinessData;
  readonly onOpen: (what: 'tailors') => void;
}

/** Who will make the order: the names, and (owner / branch manager) the button that opens the tailor list. */
export default function TailorStep({ data, onOpen }: TailorStepProps) {
  const people = data.assignees ?? [];
  const names = people.map((a) => a.name).filter(Boolean).join(', ');

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-ink-muted">{people.length > 0 ? names : 'Nobody is assigned yet.'}</p>
      {data.permissions.can_assign
        ? <button type="button" onClick={() => onOpen('tailors')} className={BTN_SM}>{people.length > 0 ? 'Change' : 'Plan tailors'}</button>
        : people.length === 0 && <p className="text-[13px] text-ink-muted">The owner or branch manager plans the tailors.</p>}
    </div>
  );
}
