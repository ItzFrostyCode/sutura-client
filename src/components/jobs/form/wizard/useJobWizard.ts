import { useState } from 'react';
import type { JobCreateForm } from '../useJobCreateForm';
import { LAST_STEP, stepProblem } from './wizardSteps';

const TOP_ID = 'job-wizard-top';

const scrollToTop = () => document.getElementById(TOP_ID)?.scrollIntoView({ block: 'start', behavior: 'smooth' });

/** Which step of New Job Order is open. You may always go back; going forward needs the step you are on to be done. */
export function useJobWizard(form: JobCreateForm) {
  const [step, setStep] = useState(1);
  const [reached, setReached] = useState(1);
  const [notice, setNotice] = useState('');

  const open = (to: number) => {
    setNotice('');
    setStep(to);
    setTimeout(scrollToTop, 0);
  };

  const next = () => {
    const problem = stepProblem(step, form);
    if (problem) return setNotice(problem);
    const to = Math.min(LAST_STEP, step + 1);
    setReached((r) => Math.max(r, to));
    open(to);
  };

  return {
    step, reached, notice, topId: TOP_ID, isLast: step === LAST_STEP,
    next,
    back: () => step > 1 && open(step - 1),
    go: (to: number) => to <= reached && open(to),
    /** Back to where an unfinished order was left. */
    restore: (to: number) => { const at = Math.min(LAST_STEP, Math.max(1, to)); setStep(at); setReached(at); },
  };
}

export type JobWizard = ReturnType<typeof useJobWizard>;
