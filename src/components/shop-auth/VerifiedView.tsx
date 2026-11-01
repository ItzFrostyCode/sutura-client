import Link from 'next/link';
import { Check } from 'lucide-react';
import { PRIMARY_BTN } from './AuthShell';

/** "Email verified": shown in the tab the link opened and, by itself, in the tab that was waiting. */
export default function VerifiedView() {
  return (
    <div className="text-center py-2">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600"><Check size={30} /></div>
      <h1 className="text-display text-2xl text-ink mb-2">Email Verified</h1>
      <p className="mb-6 text-sm text-ink-muted leading-relaxed">Your account has been created and is active. Sign in to set up your shop.</p>
      <Link href="/login?as=store" className={PRIMARY_BTN}>Sign In Now</Link>
    </div>
  );
}
