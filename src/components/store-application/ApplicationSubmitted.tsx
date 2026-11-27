import Link from 'next/link';
import { Check } from 'lucide-react';
import { Section } from './ApplicationFields';

const NEXT_STEPS = [
  <>Sign in on the <strong className="font-semibold text-ink">Shop</strong> tab with the login we send you.</>,
  <>Choose your own password when asked.</>,
  <>Set up your shop profile, services and staff.</>,
];

// What an applicant sees after submitting. There's nothing to sign in to
// yet — the System Admin issues the shop login on approval.
export default function ApplicationSubmitted({ email, freeTrial = false }: { readonly email: string; readonly freeTrial?: boolean }) {
  return (
    <div role="status" className="mt-8 space-y-8">
      <div className="rounded-2xl border border-line bg-surface px-6 py-9 text-center shadow-[0_1px_2px_rgba(45,42,38,0.04)] sm:px-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage text-white">
          <Check size={26} strokeWidth={2.5} aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-xl font-bold text-ink">Application submitted</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-body">
          Our team will review your documents{freeTrial ? '' : ' and payment'}, usually within 1–2 business days.
          {freeTrial && ' Your 14-day free trial starts the day your shop is approved.'} Once approved, we&apos;ll send
          your <strong className="font-semibold text-ink">shop login and a temporary password</strong> to:
        </p>
        <p className="mt-3 break-all text-base font-semibold text-ink">{email}</p>
      </div>

      <Section label="What happens next" flush>
        <ol className="divide-y divide-line">
          {NEXT_STEPS.map((text, i) => (
            <li key={i} className="flex items-center gap-4 px-5 py-4 text-sm text-ink-body">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sunken text-xs font-semibold text-ink">{i + 1}</span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Link
        href="/"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-sunken px-8 text-sm font-semibold text-ink transition-colors hover:bg-sunken-hover sm:w-auto"
      >
        Back to SUTURA
      </Link>
    </div>
  );
}
