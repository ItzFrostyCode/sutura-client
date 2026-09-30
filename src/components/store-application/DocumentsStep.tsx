'use client';

import { X } from 'lucide-react';
import { FileField, INPUT_CLASS, StepActions } from './ApplicationFields';
import { GOVERNMENT_ID_TYPES, REQUIRED_DOCUMENTS } from './applicationTypes';
import type { StoreApplicationState } from './useStoreApplication';

const MAX_PERMITS = 5;

export default function DocumentsStep({ app }: { readonly app: StoreApplicationState }) {
  const { files, setFile, permits, setPermits, governmentIdType, setGovernmentIdType, goTo } = app;

  const addPermits = (list: FileList | null) => {
    if (!list) return;
    setPermits([...permits, ...Array.from(list)].slice(0, MAX_PERMITS));
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); goTo(4); }} className="space-y-6">
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
        />
      ))}

      <div className="space-y-4 border-t border-line pt-5">
        <div>
          <label htmlFor="app-gov-id-type" className="block text-sm text-ink mb-2">Government ID Type<span className="text-danger">*</span></label>
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
        />
      </div>

      <div className="border-t border-line pt-5">
        <p className="text-sm text-ink mb-1">Business / Mayor&apos;s Permit</p>
        <p className="mobile-caption text-ink-muted mb-3">Optional — up to {MAX_PERMITS} files if you already have one.</p>
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

      <StepActions onBack={() => goTo(2)} nextLabel="Continue" />
    </form>
  );
}
