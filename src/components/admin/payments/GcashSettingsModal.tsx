'use client';

import { useEffect, useState } from 'react';
import { Loader2, Trash2, Upload } from 'lucide-react';
import Modal from '@/components/Modal';
import adminApi from '@/lib/adminApi';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';
import { INPUT_CLASS } from '@/components/store-application/ApplicationFields';
import type { GcashSettings } from './paymentTypes';

/** The GCash account (and optional QR) every shop owner is told to pay. */
export default function GcashSettingsModal({ isOpen, onClose }: { readonly isOpen: boolean; readonly onClose: () => void }) {
  const toast = useToast();
  const [settings, setSettings] = useState<GcashSettings | null>(null);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [qrBusy, setQrBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    adminApi.get('/admin/payment-settings')
      .then((res) => { const s: GcashSettings = res.data.data; setSettings(s); setName(s.name ?? ''); setNumber(s.number ?? ''); })
      .catch((err) => setError(getErrorMessage(err, 'Could not load the GCash details.')));
  }, [isOpen]);

  const save = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await adminApi.put('/admin/payment-settings', { gcash_name: name.trim(), gcash_number: number });
      setSettings(res.data.data);
      toast.success(res.data.message);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save the GCash details.'));
    } finally {
      setSaving(false);
    }
  };

  const uploadQr = async (file: File | undefined) => {
    if (!file) return;
    setQrBusy(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('qr', file);
      const res = await adminApi.post('/admin/payment-settings/qr', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSettings(res.data.data);
      toast.success(res.data.message);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not upload the QR code.'));
    } finally {
      setQrBusy(false);
    }
  };

  const removeQr = async () => {
    setQrBusy(true);
    try {
      const res = await adminApi.delete('/admin/payment-settings/qr');
      setSettings(res.data.data);
      toast.success(res.data.message);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not remove the QR code.'));
    } finally {
      setQrBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="GCash account" maxWidth="max-w-lg"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={saving} className="h-11 px-5 border border-line-strong bg-white text-sm font-medium cursor-pointer">Cancel</button>
          <button type="submit" form="gcash-settings-form" disabled={saving || !settings} className="h-11 px-5 bg-ink text-white text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50">
            {saving && <Loader2 size={16} className="animate-spin" />} Save
          </button>
        </>
      }>
      <form id="gcash-settings-form" onSubmit={save} className="space-y-5">
        <p className="text-sm text-ink-muted">Shop owners see these on every &ldquo;Pay with GCash&rdquo; box: the shop application and Billing.</p>
        <div>
          <label htmlFor="gcash-name" className="block text-sm text-ink mb-2">Account name<span className="text-danger">*</span></label>
          <input id="gcash-name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} />
        </div>
        <div>
          <label htmlFor="gcash-number" className="block text-sm text-ink mb-2">GCash number<span className="text-danger">*</span></label>
          <input id="gcash-number" required inputMode="numeric" maxLength={11} placeholder="09XXXXXXXXX" value={number}
            onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 11))} className={`${INPUT_CLASS} tabular-nums`} />
        </div>
        <div>
          <p className="text-sm text-ink mb-2">QR code <span className="text-ink-muted">(optional)</span></p>
          {settings?.qr_url ? (
            <div className="flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={settings.qr_url} alt="GCash QR code" className="h-32 w-32 border border-line object-contain bg-white" />
              <button type="button" onClick={removeQr} disabled={qrBusy} className="inline-flex min-h-11 items-center gap-2 border border-danger/40 px-4 text-sm text-danger cursor-pointer disabled:opacity-50">
                <Trash2 size={16} aria-hidden="true" /> Remove
              </button>
            </div>
          ) : (
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 border border-dashed border-line-strong px-4 text-sm text-ink hover:bg-sunken">
              {qrBusy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} aria-hidden="true" />} Upload QR image
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => { uploadQr(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
          )}
        </div>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </form>
    </Modal>
  );
}
