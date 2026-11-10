'use client';

import ShopStep from '@/components/store-application/ShopStep';
import DocumentsStep from '@/components/store-application/DocumentsStep';
import PlanStep from '@/components/store-application/PlanStep';
import type { StoreApplicationState } from '@/components/store-application/useStoreApplication';
import VerificationNotice from './VerificationNotice';

const PARTS = {
  2: { title: 'Your shop', body: 'What customers will see, and where to find you.' },
  3: { title: 'Verification documents', body: 'The team checks these before your shop goes live.' },
  4: { title: 'Start your trial or choose a plan', body: 'Try SUTURA free for 14 days, or pick a plan and upload your payment receipt.' },
} as const;

/** Step 2 of the wizard, in three short parts: the shop, its documents, and the plan (or free trial). */
export default function BusinessSteps({ app }: { readonly app: StoreApplicationState }) {
  const part = app.step as 2 | 3 | 4;
  // The last part reads as the path the owner chose on /for-shops: a free trial, a paid plan, or (no choice yet) either.
  const copy = part === 4 && app.path === 'trial' && app.trial ? { title: 'Your free trial', body: 'Check what the 14 free days include, then send your application.' }
    : part === 4 && !app.trial && app.path === 'plan' ? { title: 'Choose your plan', body: 'Pick a plan, pay, and upload your payment receipt.' }
    : PARTS[part];
  return (
    <>
      <p className="mobile-overline text-taupe">Part {part - 1} of 3</p>
      <h1 className="text-display text-2xl text-ink mt-1 mb-2">{copy.title}</h1>
      <p className="mb-6 text-sm text-ink-muted leading-relaxed">{copy.body}</p>
      {part === 3 && <VerificationNotice className="mb-6" />}
      {part === 2 && <ShopStep app={app} />}
      {part === 3 && <DocumentsStep app={app} />}
      {part === 4 && <PlanStep app={app} />}
    </>
  );
}
