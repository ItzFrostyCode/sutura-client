'use client';

import { useState } from 'react';
import { ChevronDown, FileText, Lock, Plus, X } from 'lucide-react';
import { CheckRow, enterMovesOn, FIELD, FIELD_ERROR, FieldError, FileField, Group, LABEL, Req, RequirementTag, revealFirstProblem, StepActions } from './ApplicationFields';
import SelfieCapture from './SelfieCapture';
import { MAX_PDF_BYTES, megabytes, prepareUpload } from './uploadPrep';
import { GOVERNMENT_ID_TYPES, REQUIRED_DOCUMENTS } from './applicationTypes';
import type { StoreApplicationState } from './useStoreApplication';

const MAX_PERMITS = 5;

function documentErrors(app: StoreApplicationState): Record<string, string> {
  const e: Record<string, string> = {};
  REQUIRED_DOCUMENTS.forEach((doc) => {
    if (doc.requirement === 'Required' && !app.files[doc.key]) e[`app-doc-${doc.key}`] = `Add your ${doc.label}.`;
  });
  if (!app.governmentIdType) e['app-gov-id-type'] = 'Choose the type of ID you will upload.';
  if (!app.files.government_id) e['app-doc-government_id'] = 'Add a photo or scan of your ID.';
  if (!app.files.selfie_with_id) e['app-selfie'] = 'Take a selfie holding your ID.';
  if (!app.privacyConsent) e['app-privacy-consent'] = 'Tick this box to agree before you continue.';
  return e;
}

export default function DocumentsStep({ app }: { readonly app: StoreApplicationState }) {
  const { files, setFile, permits, setPermits, governmentIdType, setGovernmentIdType, privacyConsent, setPrivacyConsent, goTo } = app;
  const [tried, setTried] = useState(false);
  const [permitError, setPermitError] = useState('');
  const errors: Record<string, string> = { ...app.serverErrors, ...(tried ? documentErrors(app) : {}) };

  // Permits: images are shrunk like the other documents; a PDF over the limit is refused here, by name.
  const addPermits = async (list: FileList | null) => {
    if (!list) return;
    setPermitError('');
    const ready: File[] = [];
    for (const f of Array.from(list)) {
      const r = await prepareUpload(f);
      if (r.error !== undefined) { setPermitError(`${f.name}: ${r.error}`); continue; }
      ready.push(r.file);
    }
    setPermits([...permits, ...ready].slice(0, MAX_PERMITS));
  };

  return (
    <form
      noValidate
      onKeyDown={enterMovesOn}
      onSubmit={(e) => {
        e.preventDefault();
        app.clearServerErrors();
        setTried(true);
        const problems = documentErrors(app);
        if (Object.keys(problems).length > 0) { revealFirstProblem(Object.keys(problems)); return; }
        goTo(4);
      }}
      className="space-y-7 sm:space-y-5 short:space-y-4"
    >
      <p className="flex items-start gap-3 rounded-2xl bg-surface p-4 text-[15px] text-ink-body ring-1 ring-line/80 sm:p-5">
        <Lock size={18} className="mt-0.5 shrink-0 text-taupe" aria-hidden="true" />
        <span>Only the SUTURA review team can see these. They&apos;re used to verify your shop and are never shown on your shop profile.</span>
      </p>

      <Group title="Business documents" flush>
        {REQUIRED_DOCUMENTS.map((doc) => (
          <FileField
            key={doc.key}
            variant="row"
            id={`app-doc-${doc.key}`}
            label={doc.label}
            hint={doc.hint}
            accept={doc.accept}
            file={files[doc.key]}
            onChange={(file) => setFile(doc.key, file)}
            required={doc.requirement === 'Required'}
            requirement={doc.requirement}
            error={errors[`app-doc-${doc.key}`]}
          />
        ))}
      </Group>

      <Group title="Your identity" flush>
        <div data-field="app-gov-id-type" className="px-4 py-3.5 sm:px-5">
          <label htmlFor="app-gov-id-type" className={LABEL}><span>Government ID type<Req /></span></label>
          <div className="relative">
            <select id="app-gov-id-type" aria-required="true" value={governmentIdType} onChange={(e) => setGovernmentIdType(e.target.value)}
              aria-invalid={errors['app-gov-id-type'] ? true : undefined}
              className={`${FIELD} cursor-pointer appearance-none pr-10 ${governmentIdType ? '' : 'text-ink-faint'} ${errors['app-gov-id-type'] ? FIELD_ERROR : ''}`}>
              <option value="" disabled>Select an ID</option>
              {GOVERNMENT_ID_TYPES.map((type) => <option key={type} value={type} className="text-ink">{type}</option>)}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          </div>
          <FieldError id="app-gov-id-type-error" message={errors['app-gov-id-type']} />
        </div>
        <FileField
          variant="row"
          id="app-doc-government_id"
          label="Owner's government ID"
          hint={governmentIdType ? `Clear photo or scan of your ${governmentIdType}` : 'Clear photo or scan of the ID selected above'}
          accept="image/*,.pdf"
          file={files.government_id}
          onChange={(file) => setFile('government_id', file)}
          error={errors['app-doc-government_id']}
        />
      </Group>

      <section id="app-selfie" data-field="app-selfie" className="scroll-mt-24">
        <SelfieCapture
          id="app-selfie-capture"
          idType={governmentIdType}
          file={files.selfie_with_id}
          onChange={(file) => setFile('selfie_with_id', file)}
          invalid={!!errors['app-selfie']}
        />
        <FieldError id="app-selfie-error" message={errors['app-selfie']} />
      </section>

      <Group
        id="app-permits"
        title={<>Business or Mayor&apos;s permit<RequirementTag value="Recommended" /></>}
        flush
        footer={<>Up to {MAX_PERMITS} files if you already have one (photos, or PDFs up to {megabytes(MAX_PDF_BYTES)}). You can skip this; it just helps us approve you faster.</>}
      >
        {permits.map((file, i) => (
          <div key={`${file.name}-${i}`} className="flex min-h-14 items-center gap-3.5 px-4 py-2.5 sm:px-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage/15 text-sage"><FileText size={18} aria-hidden="true" /></span>
            <span className="min-w-0 flex-1 truncate text-[15px] text-ink">{file.name}</span>
            <button type="button" aria-label={`Remove ${file.name}`} onClick={() => setPermits(permits.filter((_, j) => j !== i))}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-muted hover:bg-danger/10 hover:text-danger">
              <X size={17} aria-hidden="true" />
            </button>
          </div>
        ))}
        {permits.length < MAX_PERMITS && (
          <label className="flex min-h-14 cursor-pointer items-center gap-3.5 px-4 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-sunken sm:px-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sunken text-ink-muted"><Plus size={18} aria-hidden="true" /></span>
            {permits.length ? 'Add another file' : 'Add permit file'}
            <input type="file" accept="image/*,.pdf" multiple className="sr-only" onChange={(e) => { const l = e.target.files; void addPermits(l).finally(() => { e.target.value = ''; }); }} />
          </label>
        )}
      </Group>
      {(permitError || errors['app-permits']) && <div className="-mt-5"><FieldError id="app-permits-error" message={permitError || errors['app-permits']} /></div>}

      {/* Data Privacy Act consent, the last thing before Continue. Nothing is sent until Submit. */}
      <div data-field="app-privacy-consent">
        <CheckRow id="app-privacy-consent" required checked={privacyConsent} onChange={setPrivacyConsent} invalid={!!errors['app-privacy-consent']}>
          I agree that SUTURA may collect and use my government ID, business documents, and a selfie of me holding my ID
          only to verify my shop, as allowed by the Data Privacy Act of 2012 (RA 10173). Only the SUTURA review team
          can see them. My selfie is deleted 30 days after my application is approved or rejected.{' '}
          <a href="/privacy#shop-applications" target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2">
            Read the privacy notice
          </a>
        </CheckRow>
        <FieldError id="app-privacy-consent-error" message={errors['app-privacy-consent']} />
      </div>

      <StepActions onBack={() => goTo(2)} nextLabel="Continue" />
    </form>
  );
}
