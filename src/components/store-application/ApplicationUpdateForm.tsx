'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { CheckCircle2, FileText, MapPin, X } from 'lucide-react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import type { SavedLocation } from '@/lib/customerLocation';
import { FileField, INPUT_CLASS, TextField } from './ApplicationFields';
import { GOVERNMENT_ID_TYPES, type PaymentMethod } from './applicationTypes';

const LocationPicker = dynamic(() => import('@/components/discovery/LocationPicker'), { ssr: false });

interface UpdateRequest {
  store_name: string;
  items: { key: string; label: string }[];
  note: string;
  expires_at: string;
  owner: { first_name: string; middle_name: string | null; last_name: string; suffix: string | null; birthday: string | null; contact_number: string; email: string | null } | null;
  shop: { store_name: string; address: string; district: string | null; latitude: string | null; longitude: string | null } | null;
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
      <div className="py-10 text-center">
        <CheckCircle2 size={40} className="mx-auto text-sage" aria-hidden="true" />
        <h2 className="mobile-h2 text-ink mt-4">Updates sent</h2>
        <p className="mobile-body-md text-ink-muted mt-2 mx-auto max-w-md">{done}</p>
      </div>
    );
  }
  if (loadError) {
    return <div role="alert" className="mt-6 border border-danger/30 bg-danger/5 p-4 text-sm text-danger">{loadError}</div>;
  }
  if (!request) {
    return <p className="mt-6 text-sm text-ink-muted" aria-busy="true">Loading your application…</p>;
  }

  const has = (key: string) => request.items.some((i) => i.key === key);
  const setFile = (field: string, file: File | null) =>
    setFiles((prev) => { const next = { ...prev }; if (file) next[field] = file; else delete next[field]; return next; });
  const bindOwner = (key: string) => ({ value: owner[key] ?? '', onChange: (e: React.ChangeEvent<HTMLInputElement>) => setOwner({ ...owner, [key]: e.target.value }) });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (has('shop') && !location) return setError('Pin your shop on the map.');
    if (has('permits') && permits.length === 0) return setError('Attach at least one business permit.');

    const form = new FormData();
    form.append('token', token);
    if (has('owner')) Object.entries(owner).forEach(([k, v]) => { if (v) form.append(k, v); });
    if (has('shop') && location) {
      form.append('store_name', shopName);
      form.append('address', address);
      form.append('district', location.district);
      form.append('latitude', String(location.lat));
      form.append('longitude', String(location.lng));
    }
    if (has('payment')) form.append('payment_method', paymentMethod);
    if (has('government-id')) form.append('government_id_type', govIdType);
    Object.entries(files).forEach(([field, file]) => form.append(field, file));
    permits.forEach((file) => form.append('business_permits[]', file));

    setSubmitting(true);
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
    <form onSubmit={submit} className="mt-6 space-y-8">
      <section className="border-l-2 border-alert bg-alert/5 px-4 py-3.5">
        <p className="text-sm font-semibold text-ink">SUTURA asked you to update {request.items.length === 1 ? 'this' : 'these'}:</p>
        <ul className="mt-1.5 list-disc pl-5 text-sm text-ink">
          {request.items.map((i) => <li key={i.key}>{i.label}</li>)}
        </ul>
        <p className="mt-3 whitespace-pre-line text-sm text-ink-body">&ldquo;{request.note}&rdquo;</p>
        <p className="mt-3 mobile-caption text-ink-muted">Everything else stays as you sent it. This link works until {longDate(request.expires_at)}.</p>
      </section>

      {has('owner') && (
        <fieldset className="space-y-5">
          <legend className="mobile-h3 text-ink mb-4">Owner details</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField id="upd-first" label="First Name" required {...bindOwner('first_name')} />
            <TextField id="upd-middle" label="Middle Name" {...bindOwner('middle_name')} />
            <TextField id="upd-last" label="Last Name" required {...bindOwner('last_name')} />
            <TextField id="upd-suffix" label="Suffix (Jr., Sr.)" {...bindOwner('suffix')} />
            <TextField id="upd-birthday" label="Date of Birth" type="date" required max={MAX_BIRTHDAY} {...bindOwner('birthday')} />
            <TextField id="upd-phone" label="Contact Number" type="tel" required {...bindOwner('contact_number')} />
          </div>
          <TextField id="upd-email" label="Your Email" type="email" required {...bindOwner('email')} />
        </fieldset>
      )}

      {has('shop') && (
        <fieldset className="space-y-5">
          <legend className="mobile-h3 text-ink mb-4">Shop details</legend>
          <TextField id="upd-shop" label="Shop Name" required value={shopName} onChange={(e) => setShopName(e.target.value)} />
          <TextField id="upd-address" label="Street Address" required value={address} onChange={(e) => setAddress(e.target.value)} />
          <div>
            <p className="text-sm text-ink mb-2">Map Pin<span className="text-danger">*</span></p>
            <button type="button" onClick={() => setPickerOpen(true)}
              className={`flex w-full min-h-14 items-center gap-3 border px-4 py-3 text-left transition-colors hover:bg-sunken ${location ? 'border-sage bg-sage/5' : 'border-dashed border-line-strong bg-surface'}`}>
              <MapPin size={20} className={location ? 'shrink-0 text-sage' : 'shrink-0 text-ink-muted'} aria-hidden="true" />
              <span className="min-w-0 flex-1 text-sm text-ink">{location ? location.address || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : 'Pin your shop on the map'}</span>
              <span className="shrink-0 text-sm underline underline-offset-2">{location ? 'Change' : 'Open map'}</span>
            </button>
          </div>
        </fieldset>
      )}

      {(FILE_ITEMS.some(([key]) => has(key)) || has('government-id') || has('permits')) && (
        <fieldset className="space-y-6">
          <legend className="mobile-h3 text-ink mb-4">Documents</legend>
          {FILE_ITEMS.filter(([key]) => has(key)).map(([key, field, label, hint, accept]) => (
            <FileField key={key} id={`upd-${field}`} label={label} hint={hint} accept={accept} file={files[field]} onChange={(f) => setFile(field, f)} />
          ))}
          {has('government-id') && (
            <div className="space-y-3">
              <label htmlFor="upd-gov-type" className="block text-sm text-ink">Government ID type<span className="text-danger">*</span></label>
              <select id="upd-gov-type" required value={govIdType} onChange={(e) => setGovIdType(e.target.value)} className={INPUT_CLASS}>
                <option value="" disabled>Select ID type</option>
                {GOVERNMENT_ID_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <FileField id="upd-government_id" label="Government ID" hint="Front of the ID — photo or PDF" accept="image/*,.pdf" file={files.government_id} onChange={(f) => setFile('government_id', f)} />
            </div>
          )}
          {has('permits') && (
            <div>
              <p className="text-sm text-ink mb-1">Business permits<span className="text-danger">*</span></p>
              <p className="mobile-caption text-ink-muted mb-2">These replace the permits you sent before. Up to 5 files.</p>
              {permits.length > 0 && (
                <ul className="mb-2 divide-y divide-line border border-line">
                  {permits.map((file, i) => (
                    <li key={`${file.name}-${i}`} className="flex items-center gap-3 px-3 py-2 text-sm text-ink">
                      <FileText size={16} className="shrink-0 text-ink-muted" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{file.name}</span>
                      <button type="button" aria-label={`Remove ${file.name}`} onClick={() => setPermits(permits.filter((_, j) => j !== i))}
                        className="flex h-9 w-9 items-center justify-center text-ink-muted hover:text-ink"><X size={16} aria-hidden="true" /></button>
                    </li>
                  ))}
                </ul>
              )}
              {permits.length < 5 && (
                <label className="inline-flex min-h-11 cursor-pointer items-center border border-dashed border-ink/60 px-3.5 text-sm text-ink hover:border-ink">
                  Add permit file
                  <input type="file" accept="image/*,.pdf" multiple className="sr-only"
                    onChange={(e) => { setPermits([...permits, ...Array.from(e.target.files ?? [])].slice(0, 5)); e.target.value = ''; }} />
                </label>
              )}
            </div>
          )}
        </fieldset>
      )}

      {has('payment') && (
        <fieldset className="space-y-5">
          <legend className="mobile-h3 text-ink mb-4">Payment</legend>
          <div className="flex gap-2">
            {(['gcash', 'bank_transfer'] as const).map((m) => (
              <button key={m} type="button" aria-pressed={paymentMethod === m} onClick={() => setPaymentMethod(m)}
                className={`min-h-11 flex-1 border px-4 text-sm ${paymentMethod === m ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface text-ink hover:border-ink'}`}>
                {m === 'gcash' ? 'GCash' : 'Bank Transfer'}
              </button>
            ))}
          </div>
          <FileField id="upd-payment_receipt" label="Payment Receipt" hint="A clear screenshot of the completed payment" accept="image/*" file={files.payment_receipt} onChange={(f) => setFile('payment_receipt', f)} />
        </fieldset>
      )}

      {error && <div role="alert" className="border border-danger/30 bg-danger/5 p-3.5 text-sm text-danger">{error}</div>}

      <button type="submit" disabled={submitting} className="btn-primary-mobile w-full rounded-none! bg-ink text-white uppercase tracking-widest text-sm disabled:opacity-50">
        {submitting ? 'Sending…' : 'Send Updates'}
      </button>

      {pickerOpen && (
        <LocationPicker
          initial={location}
          confirmLabel="Confirm Shop Location"
          onClose={() => setPickerOpen(false)}
          onConfirm={(loc) => { setLocation(loc); if (!address) setAddress(loc.address); setPickerOpen(false); }}
        />
      )}
    </form>
  );
}
