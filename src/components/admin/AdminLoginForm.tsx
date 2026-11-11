'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import adminApi from '@/lib/adminApi';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';
import PasswordField from '@/components/auth/PasswordField';
import { signInError } from '@/components/auth/signInError';
import { EMAIL_INPUT_PROPS, ERROR_BOX, FIELD, LABEL, PRIMARY_BTN } from '@/components/auth/authStyles';

/** System Admin sign-in: the same fields, button and messages as every other sign-in in SUTURA. */
export default function AdminLoginForm() {
  const router = useRouter();
  const setSession = useAdminAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.post('/auth/admin/login', { email: email.trim(), password });
      setSession(res.data.data.user, res.data.data.token);
      router.replace('/admin');
    } catch (err) {
      setError(signInError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div role="alert" className={ERROR_BOX}>{error}</div>}
      <div>
        <label htmlFor="admin-email" className={LABEL}>Admin email<span className="text-danger">*</span></label>
        <input id="admin-email" {...EMAIL_INPUT_PROPS} autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={FIELD} />
      </div>
      <PasswordField id="admin-password" label="Password" value={password} onChange={setPassword}
        shown={show} onToggle={() => setShow((s) => !s)} autoComplete="current-password" />
      <button type="submit" disabled={loading} className={PRIMARY_BTN}>{loading ? 'Signing in…' : 'Sign in to Console'}</button>
    </form>
  );
}
