'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SuturaLogo from '@/components/brand/SuturaLogo';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * The shop application frame: the same canvas and flat white card as the sign-up screens, a little wider for the
 * documents and the map. The logo row and the card share one column, so their edges line up.
 */
export default function OnboardingShell({ children }: { readonly children: ReactNode }) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <div className="flex-1 w-full sm:flex sm:items-start sm:justify-center sm:px-4 sm:py-12">
        <div className="w-full min-h-dvh sm:min-h-0 sm:max-w-2xl bg-white px-5 py-6 sm:p-8 sm:rounded-2xl sm:border sm:border-line sm:shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/for-shops" aria-label="SUTURA for shops" className="flex min-h-11 items-center"><SuturaLogo className="h-7 w-auto text-espresso sm:h-8" /></Link>
            <button type="button" onClick={() => { logout(); router.replace('/login?as=store'); }} className="flex min-h-11 items-center text-sm text-ink underline underline-offset-2">Log out</button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
