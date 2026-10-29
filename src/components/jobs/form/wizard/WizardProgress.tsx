import { Check } from 'lucide-react';
import { WIZARD_STEPS } from './wizardSteps';

/** The four steps in a row: done ones tick, the open one is solid, later ones wait. A step already reached can be reopened. */
export default function WizardProgress({ id, step, reached, onGo }: Readonly<{ id: string; step: number; reached: number; onGo: (to: number) => void }>) {
  const current = WIZARD_STEPS[step - 1];
  return (
    <nav id={id} aria-label="New job order steps" className="scroll-mt-20 px-4 pt-4 sm:px-6">
      <ol className="grid grid-cols-4 gap-2">
        {WIZARD_STEPS.map((s) => {
          const done = s.id < step;
          const open = s.id === step;
          const canGo = s.id <= reached && !open;
          return (
            <li key={s.id}>
              <button
                type="button"
                disabled={!canGo}
                onClick={() => onGo(s.id)}
                aria-current={open ? 'step' : undefined}
                className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-2 text-sm font-medium transition-colors sm:justify-start sm:px-3 ${
                  open ? 'border-espresso bg-espresso text-white'
                  : done ? 'cursor-pointer border-espresso/15 bg-espresso/[0.06] text-espresso hover:bg-espresso/10'
                  : 'border-espresso/10 bg-white text-espresso/45'
                }`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${open ? 'bg-white/20' : done ? 'bg-espresso text-white' : 'bg-espresso/[0.06]'}`}>
                  {done ? <Check size={13} /> : s.id}
                </span>
                <span className="hidden truncate sm:inline">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm text-espresso/70 sm:hidden">Step {step} of {WIZARD_STEPS.length} · <span className="font-medium text-espresso">{current.label}</span></p>
    </nav>
  );
}
