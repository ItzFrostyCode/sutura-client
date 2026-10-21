import { ArrowRight, CalendarDays, CheckCircle2, ClipboardList, Loader2 } from 'lucide-react';
import StatusStepper, { type StepperStage } from '@/components/shared/StatusStepper';

const KEYS = ['details', 'schedule', 'review'] as const;
const STAGES: StepperStage[] = [
  { key: 'details', label: 'Details', Icon: ClipboardList },
  { key: 'schedule', label: 'Schedule', Icon: CalendarDays },
  { key: 'review', label: 'Review', Icon: CheckCircle2 },
];

/** The customer's booking progress strip (Details → Schedule → Review), under the shop's name, so the shop's forms look and move the same way. */
export function WizardProgress({ step, store }: Readonly<{ step: 1 | 2 | 3; store?: string }>) {
  return (
    <div className="mb-5">
      {store && <p className="mb-3 text-sm font-semibold text-ink">{store}</p>}
      <StatusStepper stages={STAGES} currentKey={KEYS[step - 1]} layout="horizontal" />
    </div>
  );
}

const PRIMARY = 'flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-taupe text-base font-semibold text-white shadow-xs transition-colors hover:bg-taupe-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50';

/** The one button under a step, full width, as on the customer's booking. Going back is the arrow in the header. */
export function WizardBar({ step, nextLabel, nextDisabled, submitting, onNext, formId, submitLabel }: Readonly<{
  step: 1 | 2 | 3; nextLabel: string; nextDisabled: boolean; submitting?: boolean; onNext: () => void;
  /** The form the last step submits. */ formId: string; submitLabel: string;
}>) {
  return step < 3 ? (
    <button type="button" onClick={onNext} disabled={nextDisabled} className={PRIMARY}>{nextLabel}<ArrowRight size={18} /></button>
  ) : (
    <button type="submit" form={formId} disabled={nextDisabled || submitting} className={PRIMARY}>
      {submitting && <Loader2 size={18} className="animate-spin" />}{submitLabel}
    </button>
  );
}
