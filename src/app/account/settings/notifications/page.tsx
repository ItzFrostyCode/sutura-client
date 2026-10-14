'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';
import AccountHeader from '@/components/account/AccountHeader';

// Where to text you, and whether to text you at all. We only text for things you can't afford to miss
// (a time change, a reminder, "your order is ready") — everything else stays in the app's own notifications. SUTURA does not send real
// emails to customers: its channels are SMS (this page) and the in-app notifications, so no wording here should promise an email.
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
      <AccountHeader title="Notification Settings" backHref="/account/settings" />
      <div className="card-soft space-y-5 p-4">
        <p className="mobile-body-sm text-ink-muted">Shops send you a text message (SMS) only for things you can&apos;t afford to miss: a changed appointment time, a reminder the day before, and when your order is ready. Everything else comes to you as a notification in the app.</p>
        {loading ? (
          <p className="mobile-body-sm flex items-center gap-2 text-ink-muted"><Loader2 size={16} className="animate-spin" /> Loading…</p>
        ) : (
          <>
            <div>
              <label htmlFor="mobile" className="mobile-overline mb-2 block text-ink-faint">Mobile number for SMS</label>
              <input id="mobile" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0917 123 4567" className="h-12 w-full rounded-xl bg-sunken px-4 text-base text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-line-strong" />
              <p className="mobile-caption mt-1.5 text-ink-muted">Philippine mobile numbers only. Double-check it — this is where the texts go.</p>
            </div>
            <label className="flex min-h-11 cursor-pointer items-start gap-3">
              <input type="checkbox" checked={optOut} onChange={(e) => setOptOut(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[#6B5346]" />
              <span className="mobile-body-sm text-ink">Don&apos;t send me text messages (SMS). (You&apos;ll still get notifications in the app.)</span>
            </label>
            <button type="button" onClick={save} disabled={saving} className="flex h-[52px] w-full items-center justify-center rounded-full bg-ink text-base font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
          </>
        )}
      </div>
    </div>
  );
}
