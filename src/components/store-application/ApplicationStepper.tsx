import { STEP_LABELS, type ApplicationStep } from './applicationTypes';

const STEPS = [1, 2, 3, 4] as const;

/** Apple-style progress: four rounded bars, and "Step 2 of 4 · Shop" under them (fits any width). */
export default function ApplicationStepper({ current }: { readonly current: ApplicationStep }) {
  return (
    <div>
      <ol className="flex gap-1.5" aria-label="Application progress">
        {STEPS.map((step) => (
          <li key={step} aria-current={step === current ? 'step' : undefined} aria-label={STEP_LABELS[step]}
            className={`h-1.5 flex-1 rounded-full transition-colors ${step <= current ? 'bg-ink' : 'bg-line'}`} />
        ))}
      </ol>
      <p className="mt-2.5 text-[13px] text-ink-muted">
        Step {current} of {STEPS.length} · <span className="font-semibold text-ink">{STEP_LABELS[current]}</span>
      </p>
    </div>
  );
}
