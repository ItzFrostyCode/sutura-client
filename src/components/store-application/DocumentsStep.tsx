'use client';

import { useState } from 'react';
import { FileText, Lock, Plus, X } from 'lucide-react';
import { revealField } from '@/lib/revealField';
import { FIELD_CLASS, FieldLabel, FileField, Section, StepActions } from './ApplicationFields';
import SelfieCapture from './SelfieCapture';
import { GOVERNMENT_ID_TYPES, REQUIRED_DOCUMENTS } from './applicationTypes';
import type { StoreApplicationState } from './useStoreApplication';

const MAX_PERMITS = 5;

export default function DocumentsStep({ app }: { readonly app: StoreApplicationState }) {
  const { files, setFile, permits, setPermits, governmentIdType, setGovernmentIdType, privacyConsent, setPrivacyConsent, goTo } = app;
  const [selfieMissing, setSelfieMissing] = useState(false);

  const addPermits = (list: FileList | null) => {
    if (!list) return;
    setPermits([...permits, ...Array.from(list)].slice(0, MAX_PERMITS));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!files.selfie_with_id) {
          setSelfieMissing(true);
          revealField('app-selfie');
          return;
        }
        goTo(4);
      }}
      className="space-y-8"
    >
      <p className="flex items-start gap-3 rounded-2xl border border-line bg-surface px-5 py-4 text-sm text-ink-body shadow-[0_1px_2px_rgba(45,42,38,0.04)]">
        <Lock size={16} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden="true" />
        Only the SUTURA review team can see these. They&apos;re used to verify your shop and are never shown on your shop profile.
      </p>

      <Section label="Business documents" flush>
        <div className="divide-y divide-line">
          {REQUIRED_DOCUMENTS.map((doc) => (
            <FileField
              key={doc.key}
              id={`app-doc-${doc.key}`}
              label={doc.label}
              hint={doc.hint}
              accept={doc.accept}
              file={files[doc.key]}
              onChange={(file) => setFile(doc.key, file)}
              required={doc.requirement === 'Required'}
              requirement={doc.requirement}
            />
          ))}
        </div>
      </Section>

      <Section label="Your identity" flush>
        <div className="divide-y divide-line">
          <div className="p-4 sm:p-5">
            <FieldLabel htmlFor="app-gov-id-type" label="Government ID type" required />
            <select id="app-gov-id-type" required value={governmentIdType} onChange={(e) => setGovernmentIdType(e.target.value)} className={FIELD_CLASS}>
              <option value="" disabled>Select an ID</option>
              {GOVERNMENT_ID_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <FileField
            id="app-doc-government_id"
            label="Owner's government ID"
            hint="Clear photo or scan of the ID selected above"
            accept="image/*,.pdf"
            file={files.government_id}
            onChange={(file) => setFile('government_id', file)}
            requirement="Required"
          />
        </div>
      </Section>

      <div id="app-selfie">
        <SelfieCapture
          id="app-selfie-capture"
          idType={governmentIdType}
          file={files.selfie_with_id}
          onChange={(file) => { setFile('selfie_with_id', file); if (file) setSelfieMissing(false); }}
        />
        {selfieMissing && !files.selfie_with_id && (
          <p role="alert" className="mt-2 px-1 text-xs text-danger">Take a selfie holding your ID before you continue.</p>
        )}
      </div>

      <Section
        label="Business or mayor's permit"
        tag={<span className="rounded-full bg-sunken px-2 py-0.5 text-[10px] font-semibold tracking-wider text-ink-muted">Recommended</span>}
        note={`Up to ${MAX_PERMITS} files if you already have one (photos or PDFs). You can skip this; it just helps us approve you faster.`}
        flush
      >
        <ul className="divide-y divide-line">
          {permits.map((file, i) => (
            <li key={`${file.name}-${i}`} className="flex min-h-14 items-center gap-3.5 px-4 sm:px-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sunken text-ink-muted">
                <FileText size={16} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{file.name}</span>
              <button type="button" aria-label={`Remove ${file.name}`} onClick={() => setPermits(permits.filter((_, j) => j !== i))}
                className="flex h-10 w-10 items-center justify-center rounded-full text-ink-muted hover:bg-sunken hover:text-ink">
                <X size={17} aria-hidden="true" />
              </button>
            </li>
          ))}
          {permits.length < MAX_PERMITS && (
            <li>
              <label className="flex min-h-14 cursor-pointer items-center gap-3.5 px-4 text-sm font-medium text-ink transition-colors hover:bg-sunken/60 sm:px-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dashed border-line-strong text-ink-muted">
                  <Plus size={16} aria-hidden="true" />
                </span>
                {permits.length === 0 ? 'Add permit file' : 'Add another file'}
                <input type="file" accept="image/*,.pdf" multiple className="sr-only" onChange={(e) => { addPermits(e.target.files); e.target.value = ''; }} />
              </label>
            </li>
          )}
        </ul>
      </Section>

      {/* Data Privacy Act consent, the last thing before Continue. Nothing is sent until Submit. */}
      <label htmlFor="app-privacy-consent" className="flex cursor-pointer gap-3.5 rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(45,42,38,0.04)]">
        <input
          id="app-privacy-consent"
          type="checkbox"
          required
          checked={privacyConsent}
          onChange={(e) => setPrivacyConsent(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 rounded accent-ink"
        />
        <span className="text-sm leading-relaxed text-ink-body">
          I agree that SUTURA may collect and use my government ID, business documents, and a selfie of me holding my ID
          only to verify my shop, as allowed by the Data Privacy Act of 2012 (RA 10173). Only the SUTURA review team
          can see them. My selfie is deleted 30 days after my application is approved or rejected.{' '}
          <a href="/privacy#shop-applications" target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2">
            Read the privacy notice
          </a>
          <span className="text-danger" aria-hidden="true"> *</span>
        </span>
      </label>

      <StepActions onBack={() => goTo(2)} nextLabel="Continue" />
    </form>
  );
}
