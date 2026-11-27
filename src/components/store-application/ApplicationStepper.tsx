import { STEP_LABELS, type ApplicationStep } from './applicationTypes';

const STEPS = [1, 2, 3, 4] as const;

/** Four bars (filled up to the current step) and "Step 2 of 4 · Shop" under them. */
export default function ApplicationStepper({ current }: { readonly current: ApplicationStep }) {
  return (
    <div>
      <ol className="grid grid-cols-4 gap-1.5" aria-label="Application progress">
        {STEPS.map((step) => (
          <li key={step} aria-current={step === current ? 'step' : undefined}>
            <span className="sr-only">{STEP_LABELS[step]}{step < current ? ' (done)' : ''}</span>
            <div className={`h-1.5 rounded-full transition-colors duration-300 ${step <= current ? 'bg-ink' : 'bg-line'}`} aria-hidden="true" />
          </li>
        ))}
      </ol>
      <p className="mt-2.5 text-xs text-ink-muted" aria-hidden="true">
        Step {current} of {STEPS.length} · <span className="font-semibold text-ink">{STEP_LABELS[current]}</span>
      </p>
    </div>
  );
}
