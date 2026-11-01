import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AuthBrand from '@/components/auth/AuthBrand';

/**
 * The same frame as Sign In and Create Account: full-bleed on a phone, a centred card from 640px, the brand mark on
 * top. The shop sign-up screens use this too, so a customer and a shop owner meet one design.
 */
export default function AuthShell({ children, backHref = '/for-shops', backLabel = 'Back' }: { readonly children: ReactNode; readonly backHref?: string; readonly backLabel?: string }) {
  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <div className="flex-1 w-full sm:flex sm:items-start sm:justify-center sm:px-4 sm:py-16">
        <div className="w-full min-h-dvh sm:min-h-0 sm:max-w-md bg-white px-5 py-6 sm:p-8 sm:rounded-2xl sm:border sm:border-line sm:shadow-sm">
          <Link href={backHref} aria-label={backLabel} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-ink-muted transition-colors py-1.5 -ml-1 mb-4">
            <ArrowLeft size={18} />
            <span>{backLabel}</span>
          </Link>
          <AuthBrand className="mb-5 sm:mb-8" tagline="Orders · Fittings · Payments" />
          {children}
        </div>
      </div>
    </div>
  );
}

export { ERROR_BOX, FIELD, LABEL, OUTLINE_BTN, PRIMARY_BTN, SHOW_BTN } from '@/components/auth/authStyles';
