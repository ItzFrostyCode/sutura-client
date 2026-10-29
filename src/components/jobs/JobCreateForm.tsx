'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { BTN, BTN_PRIMARY } from '@/components/shared/plainForm';
import { useAuthStore } from '@/store/useAuthStore';
import ApplePage, { AppleBar } from './ui/ApplePage';
import { useJobCreateForm } from './form/useJobCreateForm';
import { useJobWizard } from './form/wizard/useJobWizard';
import WizardProgress from './form/wizard/WizardProgress';
import WizardFooter from './form/wizard/WizardFooter';
import StepCustomer from './form/wizard/StepCustomer';
import StepOrder from './form/wizard/StepOrder';
import StepSizing from './form/wizard/StepSizing';
import StepReview from './form/wizard/StepReview';
import { useJobDraft } from './form/wizard/jobDraft';
import { extrasTotal } from './form/ExtraServices';

/**
 * New Job Order in four steps (Bongo's approved flow): Customer → Order details → Sizing → Review & pay.
 * One step is on screen at a time with a single main button; every step is built from the same sections as before.
 */
export default function JobCreateForm() {
  const searchParams = useSearchParams();
  // Arrived from a specific page (e.g. a design's "Tailor this Design")? Back and Cancel return there. Dashboard paths only.
  const returnParam = searchParams.get('return');
  const backHref = returnParam?.startsWith('/dashboard/') && !returnParam.startsWith('//') ? returnParam : '/dashboard/jobs';
  // Select the stored roles array itself: a selector that builds a new array each call loops forever.
  const roles = useAuthStore((s) => s.user?.roles);
  const canCollectMoney = !!roles?.some((r) => ['store_owner', 'branch_manager', 'super_admin'].includes(r.name));
  const form = useJobCreateForm();
  const wizard = useJobWizard(form);
  const draft = useJobDraft(form, wizard);

  if (form.loading) {
    return (
      <ApplePage>
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-faint">
          <Loader2 className="h-6 w-6 animate-spin text-espresso" />
          <span>Loading…</span>
        </div>
      </ApplePage>
    );
  }

  const customerName = form.customers.find((c) => c.id.toString() === form.formData.customer_id)?.name;
  // Enter inside a field goes to the next step; only the last step creates the order.
  const onSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    if (wizard.isLast) return form.handleSubmit(e);
    e.preventDefault();
    wizard.next();
  };
  const alert = 'mx-auto mt-4 w-full max-w-3xl px-4 sm:px-6';

  return (
    <ApplePage plain>
      <form onSubmit={onSubmit} className="flex min-h-[calc(100dvh-4rem)] flex-col">
        <AppleBar stuck>
          <Link href={backHref} aria-label="Back to orders" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-espresso/[0.05] hover:text-ink">
            <ArrowLeft size={20} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[17px] font-semibold text-ink">New Job Order</h1>
            {customerName && <p className="truncate text-[13px] text-ink-muted">{customerName}{form.service ? ` · ${form.service.name}` : ''}</p>}
          </div>
        </AppleBar>

        <WizardProgress id={wizard.topId} step={wizard.step} reached={wizard.reached} onGo={wizard.go} />

        {draft.offer && (
          <div className={alert}>
            <div role="status" className="flex flex-col gap-3 rounded-lg border border-espresso/30 bg-white px-4 py-3 text-sm text-espresso sm:flex-row sm:items-center sm:justify-between">
              <p>You have an unfinished order{draft.customerName ? <> for <strong>{draft.customerName}</strong></> : ''}. Continue where you stopped, or start a new one.</p>
              <div className="flex gap-2">
                <button type="button" onClick={draft.startOver} className={BTN}>Start over</button>
                <button type="button" onClick={draft.resume} className={BTN_PRIMARY}>Continue</button>
              </div>
            </div>
          </div>
        )}
        {form.below && (
          <div className={alert}>
            <div role="alert" className="flex flex-col gap-3 rounded-lg border border-espresso/30 bg-white px-4 py-3 text-sm text-espresso sm:flex-row sm:items-center sm:justify-between">
              <p>{form.below.message}</p>
              {form.below.canContinue && <button type="button" onClick={form.continueAnyway} disabled={form.submitting} className={BTN_PRIMARY}>Continue anyway</button>}
            </div>
          </div>
        )}
        <div className={`w-full flex-1 px-4 py-4 sm:px-6 sm:py-6 ${wizard.step === 3 ? '' : 'mx-auto max-w-3xl'}`}>
          {wizard.step === 1 && <StepCustomer form={form} />}
          {wizard.step === 2 && <StepOrder form={form} canCollectMoney={canCollectMoney} />}
          {wizard.step === 3 && <StepSizing form={form} />}
          {wizard.step === 4 && <StepReview form={form} canCollectMoney={canCollectMoney} />}
        </div>

        <WizardFooter
          step={wizard.step} isLast={wizard.isLast} submitting={form.submitting} total={form.pricing.total} extras={extrasTotal(form)}
          cancelHref={backHref} onBack={wizard.back} onNext={wizard.next}
          message={form.error || form.formError || wizard.notice} isError={Boolean(form.error || form.formError)}
        />
      </form>
    </ApplePage>
  );
}
