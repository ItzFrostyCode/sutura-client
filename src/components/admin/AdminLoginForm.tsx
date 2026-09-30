'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import adminApi from '@/lib/adminApi';
import { getErrorMessage } from '@/lib/apiError';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';

const INPUT = 'w-full min-h-12 border border-line-strong bg-surface px-3.5 text-base text-ink focus:border-ink focus:outline-none';

export default function AdminLoginForm() {
  const router = useRouter();
  const setSession = useAdminAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.post('/auth/admin/login', { email, password });
      setSession(res.data.data.user, res.data.data.token);
      router.replace('/admin');
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      setError(status === 429
        ? 'Too many attempts. Wait a minute before trying again.'
        : getErrorMessage(err, 'Could not reach the server. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <div role="alert" className="border border-danger/30 bg-danger/5 p-3.5 text-sm text-danger">{error}</div>
      )}
      <div>
        <label htmlFor="admin-email" className="mb-2 block text-sm text-ink">Admin email</label>
        <input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT} />
      </div>
      <div>
        <label htmlFor="admin-password" className="mb-2 block text-sm text-ink">Password</label>
        <div className="relative">
          <input id="admin-password" type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={`${INPUT} pr-12`} />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="btn-icon-mobile absolute right-0 top-0 text-ink-muted hover:text-ink">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      <button type="submit" disabled={loading || !email || !password} className="btn-primary-mobile rounded-none! w-full bg-ink text-white uppercase tracking-widest text-sm disabled:opacity-50">
        {loading ? 'Verifying…' : 'Sign in to Console'}
      </button>
    </form>
  );
}
