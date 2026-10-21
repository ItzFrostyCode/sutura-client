import { useState } from 'react';
import { BTN, BTN_SM } from '@/components/shared/plainForm';
import { FIELD, LABEL, Chip } from './FormStep';
import type { JobCreateFormData } from './types';

const PRESETS = [
  { label: 'Suki 10%', mode: 'percent', value: '10', reason: 'Suki customer' },
  { label: 'Student 10%', mode: 'percent', value: '10', reason: 'Student' },
  { label: 'Senior / PWD 20%', mode: 'percent', value: '20', reason: 'Senior / PWD' },
  { label: 'Promo 15%', mode: 'percent', value: '15', reason: 'Promo' },
] as const;

interface Props {
  readonly formData: JobCreateFormData;
  readonly onChange: (patch: Partial<JobCreateFormData>) => void;
}

/** Owner / branch manager only. Hidden until asked for; the net total updates by itself. */
export default function DiscountField({ formData, onChange }: Props) {
  const [open, setOpen] = useState(Number(formData.discount_value) > 0);
  const clear = () => { setOpen(false); onChange({ discount_value: '', discount_reason: '', discount_mode: 'fixed' }); };

  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className={BTN}>Add a discount</button>;
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className={`${LABEL} mb-0`}>Discount</span>
        <button type="button" onClick={clear} className={BTN_SM}>Remove discount</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Chip key={p.label} active={formData.discount_reason === p.reason && formData.discount_value === p.value} onClick={() => onChange({ discount_mode: p.mode, discount_value: p.value, discount_reason: p.reason })}>
            {p.label}
          </Chip>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr_1.5fr]">
        <div className="flex h-11 overflow-hidden rounded-md border border-espresso/25">
          {(['fixed', 'percent'] as const).map((m) => (
            <button key={m} type="button" onClick={() => onChange({ discount_mode: m })} className={`cursor-pointer px-4 text-sm font-semibold ${formData.discount_mode === m ? 'bg-espresso text-white' : 'text-ink-muted hover:bg-sunken'}`}>
              {m === 'fixed' ? '₱' : '%'}
            </button>
          ))}
        </div>
        <input aria-label="Discount amount" type="number" inputMode="decimal" min="0" step="0.01" value={formData.discount_value} onChange={(e) => onChange({ discount_value: e.target.value })} placeholder={formData.discount_mode === 'percent' ? '10' : '200'} className={FIELD} />
        <input aria-label="Discount reason" type="text" value={formData.discount_reason} onChange={(e) => onChange({ discount_reason: e.target.value })} placeholder="Reason (suki, tawad…)" className={FIELD} />
      </div>
    </div>
  );
}
