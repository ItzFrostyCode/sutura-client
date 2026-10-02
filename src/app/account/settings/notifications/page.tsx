'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';
import AccountHeader from '@/components/account/AccountHeader';

// Where to text you, and whether to text you at all. We only text for things you can't afford to miss
// (a time change, a reminder, "your order is ready") — everything else stays in the app and your email.
export default function NotificationSettingsPage() {
  const toast = useToast();
  const [phone, setPhone] = useState('');
  const [optOut, setOptOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => { const u = res.data?.data?.user; setPhone(u?.phone ?? ''); setOptOut(Boolean(u?.sms_opt_out)); })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.put('/profile/text-messages', { phone: phone.trim() || null, sms_opt_out: optOut });
      setPhone(res.data.data.phone ?? '');
      toast.success('Saved.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AccountHeader title="Text messages" backHref="/account/settings" />
      <div className="bg-surface border border-line p-4 space-y-5">
        <p className="mobile-body-sm text-ink-muted font-normal">Shops text you only for things you can&apos;t afford to miss: a changed appointment time, a reminder the day before, and when your order is ready. Everything else stays in the app and your email.</p>
        {loading ? (
          <p className="text-sm text-ink-muted flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading…</p>
        ) : (
          <>
            <div>
              <label htmlFor="mobile" className="block text-xs font-bold uppercase tracking-wider text-ink mb-2">Mobile number</label>
              <input id="mobile" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0917 123 4567" className="w-full h-12 px-3.5 bg-surface border border-line text-base text-ink focus:outline-none focus:border-taupe" />
              <p className="text-xs text-ink-muted mt-1.5">Philippine mobile numbers only. Double-check it — this is where the texts go.</p>
            </div>
            <label className="flex items-start gap-3 min-h-11 cursor-pointer">
              <input type="checkbox" checked={optOut} onChange={(e) => setOptOut(e.target.checked)} className="w-5 h-5 mt-0.5 accent-[#6B5346]" />
              <span className="text-sm text-ink">Don&apos;t text me. (You&apos;ll still get emails and app notifications.)</span>
            </label>
            <button type="button" onClick={save} disabled={saving} className="btn-primary-mobile w-full bg-taupe hover:bg-taupe-hover text-white text-base font-semibold disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
          </>
        )}
      </div>
    </div>
  );
}
