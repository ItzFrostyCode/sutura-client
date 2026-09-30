import Link from 'next/link';
import { MailCheck } from 'lucide-react';

// What an applicant sees after submitting. There's nothing to sign in to
// yet — the System Admin issues the shop login on approval.
export default function ApplicationSubmitted({ email }: { readonly email: string }) {
  return (
    <section role="status" className="py-4">
      <MailCheck size={32} className="text-sage" />
      <h2 className="mobile-h2 text-ink mt-5">Application submitted</h2>
      <p className="mobile-body-md text-ink-body mt-3">
        Our team will review your documents and payment, usually within 1–2 business days. Once your shop is approved,
        we&apos;ll send your <strong className="font-semibold text-ink">shop login and a temporary password</strong> to:
      </p>
      <p className="mobile-body-lg text-ink mt-3 break-all">{email}</p>
      <ol className="mt-6 space-y-2 border-l-2 border-line pl-4 mobile-body-sm text-ink-muted">
        <li>1. Sign in on the <strong className="font-semibold text-ink">Shop</strong> tab with the login we send you.</li>
        <li>2. Choose your own password when asked.</li>
        <li>3. Set up your store profile, services, and staff.</li>
      </ol>
      <Link href="/" className="btn-secondary-mobile rounded-none! mt-8 flex w-full items-center justify-center border border-ink text-sm uppercase tracking-widest text-ink sm:w-auto sm:inline-flex">
        Back to SUTURA
      </Link>
    </section>
  );
}
