import Link from 'next/link';
import { Check } from 'lucide-react';
import { BTN_SECONDARY } from './ApplicationFields';

// What an applicant sees after submitting. There's nothing to sign in to
// yet — the System Admin issues the shop login on approval.
export default function ApplicationSubmitted({ email, freeTrial = false }: { readonly email: string; readonly freeTrial?: boolean }) {
  return (
    <section role="status" className="mt-8 space-y-6">
      <div className="rounded-2xl bg-surface p-6 text-center ring-1 ring-line/80 sm:p-8">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage text-white">
          <Check size={28} strokeWidth={3} aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-[22px] font-bold tracking-tight text-ink">Application submitted</h2>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-ink-body">
          Our team will review your documents{freeTrial ? '' : ' and payment'}, usually within 1–2 business days.
          {freeTrial && ' Your 14-day free trial starts the day your shop is approved.'} Once approved, we&apos;ll send your
          {' '}<strong className="font-semibold text-ink">shop login and a temporary password</strong> to:
        </p>
        <p className="mt-3 break-all text-[17px] font-semibold text-ink">{email}</p>
      </div>

      <div>
        <h3 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-muted">What happens next</h3>
        <ol className="divide-y divide-line/80 overflow-hidden rounded-2xl bg-surface ring-1 ring-line/80">
          {[
            <>Sign in on the <strong className="font-semibold text-ink">Shop</strong> tab with the login we send you.</>,
            <>Choose your own password when asked.</>,
            <>Set up your shop profile, services and staff.</>,
          ].map((step, i) => (
            <li key={i} className="flex items-center gap-3.5 px-4 py-3.5 text-[15px] text-ink-body sm:px-5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sunken text-[13px] font-semibold text-ink">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <Link href="/" className={`${BTN_SECONDARY} w-full sm:w-auto`}>Back to SUTURA</Link>
    </section>
  );
}
