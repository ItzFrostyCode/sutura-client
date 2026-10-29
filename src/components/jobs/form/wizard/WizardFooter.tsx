import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { BTN, BTN_PRIMARY } from '@/components/shared/plainForm';
import { peso } from '../jobFormHelpers';

interface Props {
  readonly step: number;
  readonly isLast: boolean;
  readonly submitting: boolean;
  readonly total: number;
  /** What the extra orders added in step 2 come to (0 when there are none). */
  readonly extras?: number;
  readonly cancelHref: string;
  readonly onBack: () => void;
  readonly onNext: () => void;
  /** Why the next step cannot open yet (or what failed). It sits here so it is seen wherever the page is scrolled to. */
  readonly message?: string;
  readonly isError?: boolean;
}

/**
 * Always at the bottom of the screen, however short the step is, and always laid out the same way: Cancel on the left; the
 * total, Back and the one main button (Next, or Create Job Order on the last step) on the right. What was typed is kept as a draft.
 */
export default function WizardFooter({ step, isLast, submitting, total, extras = 0, cancelHref, onBack, onNext, message, isError = false }: Props) {
  return (
    <div className="sticky bottom-0 z-20 mt-auto border-t border-espresso/[0.08] bg-surface/90 backdrop-blur-xl">
      {message && (
        <p role="alert" className={`border-b px-4 py-2 text-sm sm:px-6 ${isError ? 'border-danger/30 bg-danger/10 text-danger' : 'border-espresso/10 bg-espresso/[0.04] text-espresso'}`}>{message}</p>
      )}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <Link href={cancelHref} className={BTN}>Cancel</Link>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
          {total > 0 && <p className="hidden text-sm text-espresso/70 sm:block">{extras > 0 ? 'This order' : 'Total'} <strong className="text-base text-espresso">{peso(total)}</strong>{extras > 0 && <> · with extra orders <strong className="text-base text-espresso">{peso(total + extras)}</strong></>}</p>}
          {step > 1 && <button type="button" onClick={onBack} disabled={submitting} className={BTN}><ArrowLeft size={16} />Back</button>}
          {isLast ? (
            <button type="submit" disabled={submitting} className={BTN_PRIMARY}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Create Job Order
            </button>
          ) : (
            <button type="button" onClick={onNext} className={BTN_PRIMARY}>Next<ArrowRight size={16} /></button>
          )}
        </div>
      </div>
    </div>
  );
}
