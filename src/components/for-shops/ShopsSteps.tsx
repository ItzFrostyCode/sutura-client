import Link from 'next/link';
import ShopsContainer from './ShopsContainer';
import SectionHead from './SectionHead';
import { SHOP_TERMS_VERIFICATION_HREF } from './shopsLinks';

const STEPS = [
  { title: 'Apply', body: 'Tell us about you and your shop, pin its location, and upload your DTI, TIN, barangay clearance and a government ID.', when: 'Today' },
  { title: 'Choose a plan', body: 'Pick a plan and pay with GCash, or start with 14 days free.', when: 'Today' },
  { title: 'We check your documents', body: 'The SUTURA team reviews the application. Nothing is public until they approve it.', when: 'Review' },
  { title: 'Get your login and go live', body: 'We email your shop login and a temporary password. Choose your own password, add your services and staff, and take your first booking.', when: 'Approval' },
] as const;

export default function ShopsSteps() {
  return (
    <section aria-labelledby="shops-steps-title" className="py-12 sm:py-16">
      <ShopsContainer>
        <SectionHead id="shops-steps-title" overline="How it starts" title="From application to your first booking." />
        <ol className="mt-8">
          {STEPS.map((s, i) => (
            <li key={s.title} className="grid gap-1 border-t border-line py-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] sm:gap-8">
              <p className="flex items-center gap-3 text-base font-semibold text-ink">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sunken text-xs tabular-nums text-ink-muted">{i + 1}</span>
                {s.title}
              </p>
              <p className="mobile-body-md text-ink-body">{s.body}</p>
              <p className="text-sm font-semibold text-taupe sm:text-right">{s.when}</p>
            </li>
          ))}
        </ol>
        <p className="mobile-body-sm mt-2 border-t border-line pt-5 text-ink-muted">
          What the team checks, and what you agree to:{' '}
          <Link href={SHOP_TERMS_VERIFICATION_HREF} className="font-semibold text-ink underline underline-offset-2 hover:text-taupe">
            Read the shop terms
          </Link>
        </p>
      </ShopsContainer>
    </section>
  );
}
