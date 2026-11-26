'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { FileField, INPUT_CLASS, RequirementTag, StepActions } from './ApplicationFields';
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
          document.getElementById('app-selfie')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        goTo(4);
      }}
      className="space-y-6"
    >
      <p className="mobile-body-sm text-ink-muted">
        Only the SUTURA review team can see these. They&apos;re used to verify your shop and are never shown on your store profile.
      </p>

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

      <div className="space-y-4 border-t border-line pt-5">
        <div>
          <label htmlFor="app-gov-id-type" className="block text-sm text-ink mb-2">Government ID Type<RequirementTag value="Required" /></label>
          <select id="app-gov-id-type" required value={governmentIdType} onChange={(e) => setGovernmentIdType(e.target.value)} className={INPUT_CLASS}>
            <option value="" disabled>Select an ID</option>
            {GOVERNMENT_ID_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <FileField
          id="app-doc-government_id"
          label="Owner's Government ID"
          hint="Clear photo or scan of the ID selected above"
          accept="image/*,.pdf"
          file={files.government_id}
          onChange={(file) => setFile('government_id', file)}
          requirement="Required"
        />
        <div id="app-selfie">
          <SelfieCapture
            id="app-selfie-capture"
            idType={governmentIdType}
            file={files.selfie_with_id}
            onChange={(file) => { setFile('selfie_with_id', file); if (file) setSelfieMissing(false); }}
          />
          {selfieMissing && !files.selfie_with_id && (
            <p role="alert" className="mt-2 text-xs text-danger">Take a selfie holding your ID before you continue.</p>
          )}
        </div>
      </div>

      <div className="border-t border-line pt-5">
        <p className="text-sm text-ink mb-1">Business / Mayor&apos;s Permit<RequirementTag value="Recommended" /></p>
        <p className="mobile-caption text-ink-muted mb-3">Up to {MAX_PERMITS} files if you already have one. You can skip this; it just helps us approve you faster.</p>
        {permits.length > 0 && (
          <ul className="mb-3 divide-y divide-line border border-line">
            {permits.map((file, i) => (
              <li key={`${file.name}-${i}`} className="flex min-h-12 items-center gap-3 px-4">
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{file.name}</span>
                <button type="button" aria-label={`Remove ${file.name}`} onClick={() => setPermits(permits.filter((_, j) => j !== i))} className="btn-icon-mobile -mr-3 flex items-center justify-center text-ink-muted hover:text-ink">
                  <X size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
        {permits.length < MAX_PERMITS && (
          <label className="inline-flex min-h-11 cursor-pointer items-center border border-line-strong px-4 text-sm text-ink hover:bg-sunken">
            Add permit file
            <input type="file" accept="image/*,.pdf" multiple className="sr-only" onChange={(e) => { addPermits(e.target.files); e.target.value = ''; }} />
          </label>
        )}
      </div>

      {/* Data Privacy Act consent, the last thing before Continue. Nothing is sent until Submit. */}
      <label htmlFor="app-privacy-consent" className="flex cursor-pointer gap-3 border border-line-strong bg-surface p-4">
        <input
          id="app-privacy-consent"
          type="checkbox"
          required
          checked={privacyConsent}
          onChange={(e) => setPrivacyConsent(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-ink"
        />
        <span className="mobile-body-sm text-ink-body">
          I agree that SUTURA may collect and use my government ID, business documents, and a selfie of me holding my ID
          only to verify my shop, as allowed by the Data Privacy Act of 2012 (RA 10173). Only the SUTURA review team
          can see them. My selfie is deleted 30 days after my application is approved or rejected.{' '}
          <a href="/privacy#shop-applications" target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2">
            Read the privacy notice
          </a>
          <span className="text-danger">*</span>
        </span>
      </label>

      <StepActions onBack={() => goTo(2)} nextLabel="Continue" />
    </form>
  );
}
