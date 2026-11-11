import { useCallback, useEffect, useState } from 'react';
import type { ServiceSection } from './serviceEditing';
import { SERVICE_STEPS } from './serviceSteps';
import { stepAnchor } from './ServiceEditableOverview';

/**
 * Guided setup of a new service: walks SERVICE_STEPS in the customer's reading order, opening one section's editor at
 * a time on the real service page. Saving a step moves to the next; optional steps can be skipped.
 */
export function useServiceGuide(open: (section: ServiceSection) => void, discard: () => void, ready: boolean) {
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    // Read once on load: ?guide=1 is set by the "Create New" page right after the draft is made.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ready && step === null && new URLSearchParams(window.location.search).get('guide') === '1') setStep(0);
  }, [ready, step]);

  const goTo = useCallback((i: number) => {
    discard();
    setStep(i);
    if (i < SERVICE_STEPS.length) {
      const section = SERVICE_STEPS[i].section;
      // Let the closed box re-render first, then open the step and bring it into view.
      setTimeout(() => {
        open(section);
        document.getElementById(stepAnchor(section))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    }
  }, [open, discard]);

  useEffect(() => {
    if (step !== null && step < SERVICE_STEPS.length) goTo(step);
    // Only when the guide starts; later moves call goTo themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step === null]);

  /** Called after any section saves: move on when it was the current step. */
  const onSaved = useCallback((section: ServiceSection) => {
    if (step !== null && step < SERVICE_STEPS.length && SERVICE_STEPS[step].section === section) goTo(step + 1);
  }, [step, goTo]);

  const exit = () => {
    discard();
    setStep(null);
    window.history.replaceState(null, '', window.location.pathname);
  };

  return {
    active: step !== null,
    step,
    total: SERVICE_STEPS.length,
    current: step !== null && step < SERVICE_STEPS.length ? SERVICE_STEPS[step] : null,
    done: step !== null && step >= SERVICE_STEPS.length,
    next: () => step !== null && goTo(step + 1),
    back: () => step !== null && step > 0 && goTo(step - 1),
    reopen: () => step !== null && goTo(step),
    onSaved,
    exit,
  };
}
