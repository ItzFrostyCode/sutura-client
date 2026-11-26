import { Check } from 'lucide-react';
import { STEP_LABELS, type ApplicationStep } from './applicationTypes';

const STEPS = [1, 2, 3, 4] as const;

export default function ApplicationStepper({ current }: { readonly current: ApplicationStep }) {
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Application progress">
      {STEPS.map((step) => {
        const done = step < current;
        const active = step === current;
        return (
          <li key={step} aria-current={active ? 'step' : undefined}>
            <div className={`h-1 ${step <= current ? 'bg-ink' : 'bg-line'}`} />
            <p className={`mt-2 flex items-center gap-1 mobile-overline ${active ? 'text-ink' : 'text-ink-faint'}`}>
              {done && <Check size={12} strokeWidth={3} />}
              {STEP_LABELS[step]}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
