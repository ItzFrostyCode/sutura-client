'use client';

import { useRouter } from 'next/navigation';
import LoginPortalSwitch, { type LoginPortal } from '@/components/auth/LoginPortalSwitch';

/** The Customer | Shop switch from Sign In, on the sign-up pages: each tab leads to that kind of account's own sign-up. */
export default function AccountTypeTabs({ active }: { readonly active: LoginPortal }) {
  const router = useRouter();
  return (
    <LoginPortalSwitch
      value={active}
      onChange={(next) => { if (next !== active) router.push(next === 'store' ? '/signup/shop' : '/register'); }}
    />
  );
}
