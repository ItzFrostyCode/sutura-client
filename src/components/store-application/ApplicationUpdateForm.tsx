'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { CheckCircle2, FileText, Plus, X } from 'lucide-react';
import PinTools from '@/components/shared/PinTools';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { shrinkImage } from '@/lib/shrinkImage';
import { revealField } from '@/lib/revealField';
import type { SavedLocation } from '@/lib/customerLocation';
import { FIELD_CLASS, FieldLabel, FileField, Section, TextField } from './ApplicationFields';
import SelfieCapture from './SelfieCapture';
import { ageStatus } from './OwnerStep';
import AddressFields, { addressErrors } from './AddressFields';
import { EMPTY_PSGC_ADDRESS, type PsgcAddress } from '@/lib/psgc';
import { GOVERNMENT_ID_TYPES, type PaymentMethod } from './applicationTypes';
import { appendFaceMatch } from './faceMatch';

const LocationPicker = dynamic(() => import('@/components/discovery/LocationPicker'), { ssr: false });

interface UpdateRequest {
  store_name: string;
  items: { key: string; label: string }[];
  note: string;
  expires_at: string;
  owner: { first_name: string; middle_name: string | null; last_name: string; suffix: string | null; birthday: string | null; contact_number: string; email: string | null } | null;
  shop: {
    store_name: string; address: string; district: string | null; latitude: string | null; longitude: string | null;
    province_code: string | null; city_code: string | null; district_code: string | null; barangay_code: string | null;
  } | null;
  payment_method: PaymentMethod | null;
  government_id_type: string | null;
}

// Single-file uploads per requested item: [item key, form field, label, hint, accept].
const FILE_ITEMS: [string, string, string, string, string][] = [
  ['landmark', 'landmark_image', 'Shop Front Photo', 'A clear photo of your shop front and signage — JPG, PNG, or WEBP', 'image/*'],
  ['dti', 'dti_registration', 'DTI Business Name Registration', 'Certificate photo or PDF', 'image/*,.pdf'],
  ['tin', 'tin_id', 'TIN ID or BIR Form 2303', 'Photo or PDF', 'image/*,.pdf'],
  ['barangay', 'brgy_clearance', 'Barangay Business Clearance', 'Photo or PDF', 'image/*,.pdf'],
];

const MAX_BIRTHDAY = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split('T')[0];
})();

const longDate = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });

/**
 * "Update your application", opened from the emailed Request Changes link.
 * Shows SUTURA's note and only the items the admin asked for; everything
 * else stays as originally sent.
 */
export default function ApplicationUpdateForm({ token }: { readonly token: string }) {
  const [request, setRequest] = useState<UpdateRequest | null>(null);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState('');

  const [owner, setOwner] = useState<Record<string, string>>({});
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<SavedLocation | null>(null);
  const [area, setArea] = useState<PsgcAddress>(EMPTY_PSGC_ADDRESS);
  const [areaDistrictRequired, setAreaDistrictRequired] = useState(false);
  const [showAreaErrors, setShowAreaErrors] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [govIdType, setGovIdType] = useState('');
  const [files, setFiles] = useState<Record<string, File>>({});
  const [permits, setPermits] = useState<File[]>([]);

  useEffect(() => {
    if (!token) { setLoadError('This link is missing its code. Open the link from your email again.'); return; }
    api.get('/store-applications/update', { params: { token } })
      .then((res) => {
        const data: UpdateRequest = res.data.data;
        setRequest(data);
        if (data.owner) {
          setOwner(Object.fromEntries(Object.entries(data.owner).map(([k, v]) => [k, v ?? ''])));
        }
        if (data.shop) {
          setShopName(data.shop.store_name);
          setAddress(data.shop.address);
          // Names fill in from the lists once they load; only codes are needed here.
          setArea({
            ...EMPTY_PSGC_ADDRESS,
            province_code: data.shop.province_code ?? '',
            city_code: data.shop.city_code ?? '',
            district_code: data.shop.district_code ?? '',
            barangay_code: data.shop.barangay_code ?? '',
          });
          if (data.shop.latitude && data.shop.longitude) {
            setLocation({ lat: Number(data.shop.latitude), lng: Number(data.shop.longitude), address: data.shop.address, district: data.shop.district ?? '' });
          }
        }
        if (data.payment_method) setPaymentMethod(data.payment_method);
        setGovIdType(data.government_id_type ?? '');
      })
      .catch((err) => setLoadError(getErrorMessage(err, 'This update link has expired or was already used.')));
  }, [token]);

  if (done) {
    return (
      <div role="status" className="mt-8 rounded-2xl border border-line bg-surface px-6 py-9 text-center shadow-[0_1px_2px_rgba(45,42,38,0.04)] sm:px-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage text-white">
          <CheckCircle2 size={26} aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-xl font-bold text-ink">Updates sent</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-body">{done}</p>
      </div>
    );
  }
  if (loadError) {
    return <div role="alert" className="mt-8 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{loadError}</div>;
  }
  if (!request) {
    return <p className="mt-8 text-sm text-ink-muted" aria-busy="true">Loading your application…</p>;
  }

  const has = (key: string) => request.items.some((i) => i.key === key);
  const setFile = (field: string, file: File | null) =>
    setFiles((prev) => { const next = { ...prev }; if (file) next[field] = file; else delete next[field]; return next; });
  const bindOwner = (key: string) => ({ value: owner[key] ?? '', onChange: (e: React.ChangeEvent<HTMLInputElement>) => setOwner({ ...owner, [key]: e.target.value }) });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Each check also takes the person to the field (lib/revealField); the message shows by the button.
    const stop = (message: string, field: string) => { setError(message); revealField(field); };
    if (has('shop')) {
      setShowAreaErrors(true);
      const areaProblem = Object.keys(addressErrors(area, areaDistrictRequired))[0];
      if (areaProblem) return stop('Choose your province, city or municipality, and barangay.', `upd-area-${areaProblem.replace('_code', '')}`);
    }
    if (has('shop') && !location) return stop('Pin your shop on the map.', 'upd-pin');
    if (has('permits') && permits.length === 0) return stop('Attach at least one business permit.', 'upd-permits');
    if (has('selfie') && !files.selfie_with_id) return stop('Take a new selfie holding your ID.', 'upd-selfie');

    const form = new FormData();
    form.append('token', token);
    if (has('owner')) Object.entries(owner).forEach(([k, v]) => { if (v) form.append(k, v); });
    if (has('shop') && location) {
      form.append('store_name', shopName);
      form.append('address', address.trim());
      form.append('province_code', area.province_code);
      form.append('city_code', area.city_code);
      if (area.district_code) form.append('district_code', area.district_code);
      form.append('barangay_code', area.barangay_code);
      form.append('district', location.district);
      form.append('latitude', String(location.lat));
      form.append('longitude', String(location.lng));
    }
    if (has('payment')) form.append('payment_method', paymentMethod);
    if (has('government-id')) form.append('government_id_type', govIdType);
    setSubmitting(true);
    // Same as the application: photos shrunk before upload, the selfie left as captured.
    const docEntries = await Promise.all(
      Object.entries(files).map(async ([field, file]) => [field, field === 'selfie_with_id' ? file : await shrinkImage(file)] as const),
    );
    docEntries.forEach(([field, file]) => form.append(field, file));
    if (has('selfie')) appendFaceMatch(form, files.selfie_with_id);
    (await Promise.all(permits.map(shrinkImage))).forEach((file) => form.append('business_permits[]', file));

    try {
      const res = await api.post('/store-applications/update', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setDone(res.data.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not send your updates. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-8 space-y-8">
      <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 sm:px-6">
        <p className="text-sm font-semibold text-ink">SUTURA asked you to update {request.items.length === 1 ? 'this' : 'these'}:</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {request.items.map((i) => (
            <li key={i.key} className="rounded-full border border-amber-200 bg-surface px-3 py-1 text-xs font-medium text-ink">{i.label}</li>
          ))}
        </ul>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-body">&ldquo;{request.note}&rdquo;</p>
        <p className="mt-3 text-xs text-ink-muted">Everything else stays as you sent it. This link works until {longDate(request.expires_at)}.</p>
      </section>

      {has('owner') && (
        <Section label="Owner details">
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField id="upd-first" label="First name" required {...bindOwner('first_name')} />
              <TextField id="upd-middle" label="Middle name" optional {...bindOwner('middle_name')} />
              <TextField id="upd-last" label="Last name" required {...bindOwner('last_name')} />
              <TextField id="upd-suffix" label="Suffix" optional placeholder="Jr., Sr., III" {...bindOwner('suffix')} />
              <TextField id="upd-birthday" label="Date of birth" type="date" required max={MAX_BIRTHDAY} {...bindOwner('birthday')} status={ageStatus(owner.birthday ?? '')} />
              <TextField id="upd-phone" label="Mobile number" type="tel" required {...bindOwner('contact_number')} />
            </div>
            <TextField id="upd-email" label="Email address" type="email" required {...bindOwner('email')} />
          </div>
        </Section>
      )}

      {has('shop') && (
        <>
          <Section label="Shop details">
            <div className="space-y-5">
              <TextField id="upd-shop" label="Shop name" required value={shopName} onChange={(e) => setShopName(e.target.value)} />
              <AddressFields idPrefix="upd-area" value={area} onChange={setArea} showErrors={showAreaErrors} onDistrictRequiredChange={setAreaDistrictRequired} />
              <TextField id="upd-address" label="Street address" required placeholder="Unit, building, street" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </Section>
          <section data-field="upd-pin">
            <h3 className="mb-2.5 px-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Map pin<span className="text-danger" aria-hidden="true">*</span>
            </h3>
            <PinTools variant="list" current={location} onPickOnMap={() => setPickerOpen(true)} onPin={setLocation} />
          </section>
        </>
      )}

      {FILE_ITEMS.some(([key]) => has(key)) && (
        <Section label="Business documents" flush>
          <div className="divide-y divide-line">
            {FILE_ITEMS.filter(([key]) => has(key)).map(([key, field, label, hint, accept]) => (
              <FileField key={key} id={`upd-${field}`} label={label} hint={hint} accept={accept} file={files[field]} onChange={(f) => setFile(field, f)} />
            ))}
          </div>
        </Section>
      )}

      {has('government-id') && (
        <Section label="Your identity" flush>
          <div className="divide-y divide-line">
            <div className="p-4 sm:p-5">
              <FieldLabel htmlFor="upd-gov-type" label="Government ID type" required />
              <select id="upd-gov-type" required value={govIdType} onChange={(e) => setGovIdType(e.target.value)} className={FIELD_CLASS}>
                <option value="" disabled>Select ID type</option>
                {GOVERNMENT_ID_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <FileField id="upd-government_id" label="Owner's government ID" hint="Front of the ID — photo or PDF" accept="image/*,.pdf" file={files.government_id} onChange={(f) => setFile('government_id', f)} />
          </div>
        </Section>
      )}

      {has('selfie') && (
        <div>
          <SelfieCapture id="upd-selfie" idType={govIdType} file={files.selfie_with_id} onChange={(f) => setFile('selfie_with_id', f)} />
          <p className="mt-2 px-1 text-xs text-ink-muted">
            Covered by the privacy consent you gave when you applied. The selfie is deleted 30 days after your application is decided.
          </p>
        </div>
      )}

      {has('permits') && (
        <div data-field="upd-permits">
          <Section
            label={<>Business permits<span className="text-danger" aria-hidden="true">*</span></>}
            note="These replace the permits you sent before. Up to 5 files (photos or PDFs)."
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
              {permits.length < 5 && (
                <li>
                  <label className="flex min-h-14 cursor-pointer items-center gap-3.5 px-4 text-sm font-medium text-ink transition-colors hover:bg-sunken/60 sm:px-5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dashed border-line-strong text-ink-muted">
                      <Plus size={16} aria-hidden="true" />
                    </span>
                    {permits.length === 0 ? 'Add permit file' : 'Add another file'}
                    <input type="file" accept="image/*,.pdf" multiple className="sr-only"
                      onChange={(e) => { setPermits([...permits, ...Array.from(e.target.files ?? [])].slice(0, 5)); e.target.value = ''; }} />
                  </label>
                </li>
              )}
            </ul>
          </Section>
        </div>
      )}

      {has('payment') && (
        <Section label="Payment" flush>
          <div className="divide-y divide-line">
            <div className="flex gap-2 p-4 sm:p-5">
              {(['gcash'] as const).map((m) => (
                <button key={m} type="button" aria-pressed={paymentMethod === m} onClick={() => setPaymentMethod(m)}
                  className={`min-h-11 flex-1 rounded-xl border px-4 text-sm font-medium transition-colors ${paymentMethod === m ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface text-ink hover:border-ink'}`}>
                  {m === 'gcash' ? 'GCash' : 'Bank Transfer'}
                </button>
              ))}
            </div>
            <FileField id="upd-payment_receipt" label="Payment receipt" hint="A clear screenshot of the completed payment" accept="image/*" file={files.payment_receipt} onChange={(f) => setFile('payment_receipt', f)} />
          </div>
        </Section>
      )}

      {error && <div role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}

      <button type="submit" disabled={submitting}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-ink px-12 text-sm font-semibold text-white transition-colors hover:bg-ink/85 disabled:opacity-50 sm:ml-auto sm:flex sm:w-auto">
        {submitting ? 'Sending…' : 'Send updates'}
      </button>

      {pickerOpen && (
        <LocationPicker
          initial={location}
          confirmLabel="Confirm Shop Location"
          onClose={() => setPickerOpen(false)}
          onConfirm={(loc) => { setLocation(loc); setPickerOpen(false); }}
        />
      )}
    </form>
  );
}
