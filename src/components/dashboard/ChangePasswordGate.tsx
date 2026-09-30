'use client';

import { useState } from 'react';
import { Check, KeyRound } from 'lucide-react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { PASSWORD_RULES, meetsPasswordRules } from '@/lib/passwordRules';
import { INPUT_CLASS } from '@/components/store-application/ApplicationFields';

interface ChangePasswordGateProps {
  readonly loginEmail: string;
  readonly onChanged: () => void;
  readonly onLogout: () => void;
}

// First sign-in with an admin-issued temporary password. The API refuses
// every store-scoped call (403 password_change_required) until this is done,
// so the dashboard isn't shown behind it.
export default function ChangePasswordGate({ loginEmail, onChanged, onLogout }: ChangePasswordGateProps) {
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setError('New passwords do not match.');
    setSaving(true);
    setError('');
    try {
      await api.put('/profile/password', { current_password: current, password, password_confirmation: confirm });
      onChanged();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not change your password. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh bg-canvas flex items-center justify-center mobile-screen-margins py-12">
      <form onSubmit={submit} className="w-full max-w-md border border-line bg-surface p-6 sm:p-8 space-y-5">
        <KeyRound size={30} className="text-taupe" />
        <div>
          <h1 className="mobile-h1 text-ink">Choose your password</h1>
          <p className="mobile-body-md text-ink-body mt-2">
            You signed in with a temporary password. Pick your own to finish setting up <span className="break-all font-semibold">{loginEmail}</span>.
          </p>
        </div>

        {error && <div role="alert" className="border border-danger/30 bg-danger/5 p-3.5 text-sm text-danger">{error}</div>}

        <div>
          <label htmlFor="cp-current" className="block text-sm text-ink mb-2">Temporary password</label>
          <input id="cp-current" type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={INPUT_CLASS} />
        </div>
        <div>
          <label htmlFor="cp-new" className="block text-sm text-ink mb-2">New password</label>
          <input id="cp-new" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={INPUT_CLASS} />
          <ul className="mt-3 space-y-1.5">
            {PASSWORD_RULES.map((rule) => {
              const met = rule.test(password);
              return (
                <li key={rule.key} className="flex items-center gap-2 text-xs">
                  <span className={`shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${met ? 'bg-taupe border-taupe text-white' : 'border-line-strong text-transparent'}`}>
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span className={met ? 'text-ink' : 'text-ink-faint'}>{rule.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <label htmlFor="cp-confirm" className="block text-sm text-ink mb-2">Confirm new password</label>
          <input id="cp-confirm" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={INPUT_CLASS} />
        </div>

        <button type="submit" disabled={saving || !meetsPasswordRules(password)} className="btn-primary-mobile rounded-none! w-full bg-ink text-white uppercase tracking-widest text-sm disabled:opacity-40">
          {saving ? 'Saving…' : 'Save Password'}
        </button>
        <button type="button" onClick={onLogout} className="flex min-h-11 w-full items-center justify-center text-sm text-ink-muted underline underline-offset-2">
          Sign out
        </button>
      </form>
    </div>
  );
}
