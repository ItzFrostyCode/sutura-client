'use client';

import { useState, SubmitEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import BrandLogo from '@/components/BrandLogo';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        const { user, token, shop, staff_profile } = response.data.data;
        
        
        let activeShop = shop;
        if (user.roles[0]?.name === 'staff' || user.roles[0]?.name === 'branch_manager') {
          if (staff_profile?.shop) {
            activeShop = staff_profile.shop;
          }
        }

        const roleName = user.roles[0]?.name;

        if (roleName === 'staff' || roleName === 'branch_manager' || roleName === 'shop_owner') {
          // Staff and branch managers share the same owner dashboard — there is
          // no separate staff portal. What each role can see/do there is
          // enforced by the API (and a handful of role checks in the UI),
          // not by routing them to a different page.
          setAuth(user, token, activeShop, staff_profile);
          router.push('/dashboard');
        } else {
          // admin / customer accounts don't have a web dashboard yet — avoid
          // navigating to a route that doesn't exist and 404ing right after login.
          setError('This account type does not have a dashboard yet. Please contact support.');
          setLoading(false);
          return;
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF6F3] text-[#2D2A26] relative overflow-hidden">
      {/* Background Decor (Soft gradient to simulate the soft warm vibe) */}
      <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-[#F0EAE3] via-[#FAF6F3] to-[#EBE4DC] opacity-50 pointer-events-none" />
      
      <div className="w-full max-w-[480px] p-10 md:p-12 rounded-3xl bg-white border border-[#EBE6E0] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] relative z-10 mx-4">
        <div className="text-center mb-10">
          <BrandLogo className="mb-8" />
          <h1 className="font-heading text-3xl text-[#2D2A26] mb-3">Welcome Back</h1>
          <p className="text-[#827A73] text-[15px]">Please enter your details below.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[#F8F3F2] border border-[#EFE3E1] text-[#9A5C4F] text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="flex items-center gap-2 text-[15px] text-[#524A44] mb-2">
              <Mail size={16} className="text-[#A8A19A]" /> Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-4 pr-4 py-3.5 rounded-xl bg-white border border-[#EBE6E0] text-[#2D2A26] focus:outline-none focus:border-[#9A8073] focus:ring-1 focus:ring-[#9A8073] transition-all placeholder:text-[#A8A19A]"
                placeholder="Email address here"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="flex items-center gap-2 text-[15px] text-[#524A44] mb-2">
              <Lock size={16} className="text-[#A8A19A]" /> Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-12 py-3.5 rounded-xl bg-white border border-[#EBE6E0] text-[#2D2A26] focus:outline-none focus:border-[#9A8073] focus:ring-1 focus:ring-[#9A8073] transition-all placeholder:text-[#A8A19A]"
                placeholder="Password"
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A8A19A] hover:text-[#9A8073] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end pt-1">
            <a href="/forgot-password" className="text-[15px] text-[#827A73] hover:text-[#9A8073] transition-colors">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 rounded-xl bg-[#9A8073] hover:bg-[#91756A] text-white text-[15px] font-medium transition-all disabled:opacity-50 mt-4 shadow-sm"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-[15px] text-[#827A73]">
          Don&apos;t have an account?{' '}
          <a href="/register" className="text-[#2D2A26] hover:text-[#9A8073] font-medium transition-colors">
            Sign Up
          </a>
        </div>
        
        <div className="mt-12 pt-8 text-center text-sm text-[#A8A19A]">
          <p>© 2026 Sutura. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
