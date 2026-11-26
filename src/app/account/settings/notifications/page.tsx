'use client';

import { useEffect, useState } from 'react';
import { Bell, Loader2, MessageSquareText } from 'lucide-react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';
import AccountHeader from '@/components/account/AccountHeader';

// The two channels SUTURA really has: in-app notifications (always on — every stage change of a job order lands
// there) and text messages (SMS) for the few things you can't afford to miss. SUTURA does not send emails to
// customers, so no wording here promises one.
export default function NotificationSettingsPage() {
  const toast = useToast();
  const [phone, setPhone] = useState('');
  const [smsOn, setSmsOn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => { const u = res.data?.data?.user; setPhone(u?.phone ?? ''); setSmsOn(!u?.sms_opt_out); })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.put('/profile/text-messages', { phone: phone.trim() || null, sms_opt_out: !smsOn });
      setPhone(res.data.data.phone ?? '');
      toast.success('Notification settings saved.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AccountHeader title="Notification Settings" backHref="/account/settings" />

      <section aria-labelledby="ch-app" className="card-soft mb-4 flex items-start gap-3 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sunken text-taupe-dark"><Bell size={20} aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h2 id="ch-app" className="mobile-h4 text-ink">In-app notifications</h2>
            <span className="mobile-caption shrink-0 rounded-full bg-sage/10 px-2.5 py-1 font-semibold text-sage">Always on</span>
          </div>
          <p className="mobile-body-sm mt-1 text-ink-muted">Every update on your job orders and appointments — each production stage, from order received to ready for pickup.</p>
        </div>
      </section>

      <section aria-labelledby="ch-sms" className="card-soft space-y-5 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sunken text-taupe-dark"><MessageSquareText size={20} aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <h2 id="ch-sms" className="mobile-h4 text-ink">Text messages (SMS)</h2>
            <p className="mobile-body-sm mt-1 text-ink-muted">Only what you can&apos;t afford to miss: a changed appointment time, a reminder the day before, and when your order is ready.</p>
          </div>
        </div>

        {loading ? (
          <p className="mobile-body-sm flex items-center gap-2 text-ink-muted"><Loader2 size={16} className="animate-spin" /> Loading…</p>
        ) : (
          <>
            <button
              type="button"
              role="switch"
              aria-checked={smsOn}
              onClick={() => setSmsOn((v) => !v)}
              className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl bg-sunken px-4 text-left"
            >
              <span className="mobile-body-md text-ink">Send me text messages</span>
              <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${smsOn ? 'bg-ink' : 'bg-line-strong'}`}>
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-[left] ${smsOn ? 'left-[22px]' : 'left-0.5'}`} />
              </span>
            </button>

            {smsOn && (
              <div>
                <label htmlFor="mobile" className="mb-2 block text-sm font-medium text-ink">Mobile number</label>
                <input id="mobile" type="tel" inputMode="tel" autoComplete="tel-national" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0917 123 4567"
                  className="h-12 w-full rounded-xl border border-line-strong bg-white px-4 text-base text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none focus:ring-2 focus:ring-espresso/10" />
                <p className="mobile-caption mt-1.5 text-ink-muted">Philippine mobile numbers only. Double-check it — this is where the texts go.</p>
              </div>
            )}

            <button type="button" onClick={save} disabled={saving} className="flex h-[52px] w-full items-center justify-center rounded-full bg-ink text-base font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-60">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        )}
      </section>
    </div>
  );
}
