import Link from 'next/link';
import AskBadge from './AskBadge';

const ASK = encodeURIComponent('/ask');

/** Guests see this instead of the questions: the answers include the customer's own orders and appointments. */
export default function AskSignIn() {
  return (
    <section className="relative border border-line bg-surface px-5 py-10 text-center sm:px-10 sm:py-12">
      {/* A tailor's basting stitch around the panel — the one ornament. */}
      <span className="pointer-events-none absolute inset-2.5 border border-dashed border-taupe/35" aria-hidden="true" />
      <div className="relative">
        <div className="mx-auto mb-5 w-fit"><AskBadge size="lg" /></div>
        <h1 className="text-display text-3xl text-ink sm:text-4xl">Ask SUTURA</h1>
        <p className="mx-auto mt-3 max-w-[52ch] text-[15px] leading-relaxed text-ink-body">
          Sign in to ask. SUTURA answers from its live data — verified Davao tailoring shops, and your own orders and appointments.
        </p>
        <div className="mx-auto mt-8 flex max-w-xs flex-col gap-3">
          <Link href={`/login?redirect=${ASK}`} className="flex min-h-12 items-center justify-center bg-ink px-6 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-ink/90">
            Sign In
          </Link>
          <Link href={`/register?redirect=${ASK}`} className="flex min-h-12 items-center justify-center border border-ink px-6 text-sm font-bold uppercase tracking-widest text-ink transition-colors hover:bg-sunken">
            Create an Account
          </Link>
        </div>
      </div>
    </section>
  );
}
