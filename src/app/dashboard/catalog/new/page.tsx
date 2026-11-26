'use client';

import { Suspense } from 'react';
import { useWizardGate } from '@/app/dashboard/services/new/useWizardGate';
import { useCatalogWizard, CATALOG_STEPS } from '@/components/catalog/create/useCatalogWizard';
import CatalogWizardStep from '@/components/catalog/create/CatalogWizardStep';
import ServiceWizardBar from '@/components/services/create/ServiceWizardBar';
import SubscriptionGate from '@/components/SubscriptionGate';

function NewCatalogItemPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <NewCatalogItemContent />
    </Suspense>
  );
}

function NewCatalogItemContent() {
  const allowed = useWizardGate('/dashboard/services');
  const w = useCatalogWizard();
  if (!allowed) return null;
  return (
    <div className="max-w-[599px] min-[600px]:max-w-[680px] mx-auto max-[599px]:pb-24 pb-4">
      <div className="pt-2 pb-6 space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">New design · Step {w.step + 1} of {CATALOG_STEPS.length}</p>
        <div className="flex gap-1" aria-hidden>
          {CATALOG_STEPS.map((s, i) => <span key={s.key} className={`h-1 flex-1 ${i <= w.step ? 'bg-espresso' : 'bg-line'}`} />)}
        </div>
        <div>
          <h1 className="text-[28px] min-[600px]:text-[32px] leading-[1.2] font-bold text-ink">{w.current.title}</h1>
          <p className="text-base min-[600px]:text-lg text-ink-body mt-2 leading-relaxed">{w.current.hint}</p>
        </div>
        <div className="border border-line bg-white p-4 min-[600px]:p-6">
          <CatalogWizardStep section={w.current.key} edit={{ form: w.form, storeId: w.storeId, itemId: 0, fromServiceId: w.fromService }} requirements={w.requirements} onRequirements={w.setRequirements} />
          <ServiceWizardBar step={w.step} total={CATALOG_STEPS.length} last={w.last} saving={w.saving} optional={w.current.optional} finishLabel="Publish design" onBack={w.back} onNext={w.next} />
        </div>
      </div>
    </div>
  );
}

/** Adding a design is a Pro feature (the server refuses too). */
export default function NewCatalogItemPageGated() {
  return <SubscriptionGate feature="catalog"><NewCatalogItemPage /></SubscriptionGate>;
}
