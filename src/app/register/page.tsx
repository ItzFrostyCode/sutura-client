'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [role, setRole] = useState('shop_owner');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== passwordConfirmation) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/register', { 
        name, email, password, password_confirmation: passwordConfirmation, role 
      });
      if (response.data.success) {
        router.push('/login?registered=true');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF6F3] text-[#2D2A26] relative overflow-hidden py-12">
      <div className="absolute top-0 right-1/4 w-full h-[600px] bg-linear-to-bl from-[#F0EAE3] to-[#EBE4DC] blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md p-8 rounded-2xl glass-panel border border-[#EBE6E0] relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#2D2A26] mb-2">Create Account</h1>
          <p className="text-[#827A73]">Join SUTURA as a Shop Owner or Customer</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-[#B26959]/10 border border-[#B26959]/50 text-[#B26959] text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="register-role" className="block text-sm font-medium text-[#524A44] mb-1">Account Type</label>
            <select
              id="register-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#FAF6F3] border border-[#EBE6E0] text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe transition-colors"
            >
              <option value="shop_owner">Shop Owner</option>
              <option value="customer">Customer</option>
            </select>
          </div>

          <div>
            <label htmlFor="register-name" className="block text-sm font-medium text-[#524A44] mb-1">Full Name</label>
            <input
              id="register-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#FAF6F3] border border-[#EBE6E0] text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="register-email" className="block text-sm font-medium text-[#524A44] mb-1">Email</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#FAF6F3] border border-[#EBE6E0] text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-[#524A44] mb-1">Password</label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#FAF6F3] border border-[#EBE6E0] text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe transition-colors"
              required
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="register-password-confirm" className="block text-sm font-medium text-[#524A44] mb-1">Confirm Password</label>
            <input
              id="register-password-confirm"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#FAF6F3] border border-[#EBE6E0] text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-taupe hover:bg-(--brand-taupe)/90 text-white font-medium transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-[#827A73] text-sm">
          Already have an account?{' '}
          <a href="/login" className="text-taupe hover:text-taupe-hover font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
