'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';

// System Admin sign-in. Intentionally not linked from the storefront or the
// Customer / Shop Owner Sign In — admins reach it by URL. The public
// /auth/login refuses admin accounts, so this is the only way in.
export default function AdminLoginPage() {
  const router = useRouter();
  const { token, hydrated, hydrate } = useAdminAuthStore();

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (hydrated && token) router.replace('/admin'); }, [hydrated, token, router]);

  return (
    <main className="grid min-h-dvh bg-canvas lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <section aria-hidden="true" className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div className="relative flex items-center gap-2.5">
          <ShieldCheck size={22} className="text-taupe" />
          <span className="text-display text-xl tracking-wide">SUTURA</span>
          <span className="mobile-overline text-white/50">Console</span>
        </div>
        <div className="relative max-w-sm">
          <p className="tablet-hero-title text-white">Keep the platform honest.</p>
          <p className="mt-4 text-base text-white/65">Review shop applications, manage plans, and keep every store profile on SUTURA trustworthy.</p>
        </div>
        <p className="relative mobile-caption text-white/40">Restricted to SUTURA System Admins. Every sign-in is recorded in the activity log.</p>
      </section>

      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <ShieldCheck size={20} className="text-taupe" />
            <span className="text-display text-lg">SUTURA</span>
            <span className="mobile-overline text-ink-muted">Console</span>
          </div>
          <p className="mobile-overline text-taupe">System Admin</p>
          <h1 className="mobile-h1 mt-2 text-ink">Sign in to the console</h1>
          <p className="mobile-body-md mt-2 mb-8 text-ink-muted">Use your SUTURA administrator account.</p>
          <AdminLoginForm />
          <Link href="/" className="mt-8 inline-flex min-h-11 items-center text-sm text-ink-muted underline underline-offset-2 hover:text-ink">
            Back to SUTURA
          </Link>
        </div>
      </section>
    </main>
  );
}
