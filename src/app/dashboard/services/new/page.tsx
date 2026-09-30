'use client';

import { Suspense } from 'react';
import { useWizardGate } from './useWizardGate';
import { useServiceWizard, WIZARD_STEPS } from '@/components/services/create/useServiceWizard';
import ServiceWizardStep from '@/components/services/create/ServiceWizardStep';
import ServiceWizardBar from '@/components/services/create/ServiceWizardBar';

function NewServiceWizard() {
  const w = useServiceWizard();
  const allowed = useWizardGate();
  if (!allowed) return null;
  return (
    <div className="max-w-[599px] min-[600px]:max-w-[680px] mx-auto max-[599px]:pb-24 pb-4">
      <div className="pt-2 pb-6 space-y-4">
        <p className="px-4 min-[375px]:px-6 min-[600px]:px-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">New service · Step {w.step + 1} of {WIZARD_STEPS.length}</p>
        <div className="flex gap-1 mx-4 min-[375px]:mx-6 min-[600px]:mx-0" aria-hidden>
          {WIZARD_STEPS.map((s, i) => <span key={s.key} className={`h-1 flex-1 ${i <= w.step ? 'bg-taupe' : 'bg-line'}`} />)}
        </div>
        <div className="px-4 min-[375px]:px-6 min-[600px]:px-0">
          <h1 className="text-[28px] min-[600px]:text-[32px] leading-[1.2] font-bold text-ink">{w.current.title}</h1>
          <p className="text-base text-ink-muted mt-2">{w.current.hint}</p>
        </div>
        <div className="border-y max-[599px]:border-x-0 min-[600px]:border border-line bg-white p-4 min-[600px]:p-6">
          <ServiceWizardStep section={w.current.key} edit={{ draft: w.draft, setDraft: w.setDraft, storeId: w.storeId }} />
          <ServiceWizardBar step={w.step} total={WIZARD_STEPS.length} last={w.last} saving={w.saving} optional={w.current.optional} onBack={w.back} onNext={w.next} />
        </div>
      </div>
    </div>
  );
}

export default function NewServicePage() {
  return <Suspense><NewServiceWizard /></Suspense>;
}
