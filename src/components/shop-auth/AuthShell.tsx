'use client';

import type { ReactNode } from 'react';
import AuthPage from '@/components/auth/AuthPage';
import type { AuthNav } from '@/components/auth/AuthTopBar';

/**
 * The shop sign-up screens in the same frame as Sign In and Create Account. `back` is the previous step (← Back);
 * the X leaves sign-up for the shop overview page.
 */
export default function AuthShell({ children, back }: { readonly children: ReactNode; readonly back?: AuthNav }) {
  return (
    <AuthPage back={back} close={{ href: '/for-shops', label: 'Close sign-up' }} tagline="Orders · Fittings · Payments">
      {children}
    </AuthPage>
  );
}

export { ERROR_BOX, FIELD, LABEL, OUTLINE_BTN, PRIMARY_BTN, SHOW_BTN, TITLE, EMAIL_INPUT_PROPS } from '@/components/auth/authStyles';
