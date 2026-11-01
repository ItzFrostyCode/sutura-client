import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ShopsContainer from './ShopsContainer';
import OrderRecordMock from './OrderRecordMock';
import { TRIAL_HREF } from './shopsLinks';

export default function ShopsHero() {
  return (
    <section aria-labelledby="shops-hero-title" className="py-10 sm:py-14 lg:py-20">
      <ShopsContainer className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="mobile-overline text-taupe">For tailoring shops</p>
          <h1 id="shops-hero-title" className="mt-3 text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-[56px]">
            From the first fitting to the final handover.
          </h1>
          <p className="mobile-body-lg mt-4 max-w-xl text-ink-body">
            SUTURA keeps every order in one record: the booking, the measurements, the quote, the sewing and the payments. Your shop is listed for customers across Davao City.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={TRIAL_HREF} className="btn-primary-mobile inline-flex items-center justify-center gap-2 rounded-[10px] bg-ink px-6 text-white transition-transform hover:bg-espresso active:scale-[0.98]">
              Start free trial <ArrowRight size={18} />
            </Link>
            <a href="#pricing" className="btn-secondary-mobile inline-flex items-center justify-center rounded-[10px] border border-line-strong px-6 text-ink transition-colors hover:bg-sunken">
              See plans
            </a>
          </div>
          <p className="mobile-caption mt-4 max-w-md text-ink-muted">Free for 14 days once your documents are verified. Nothing to pay.</p>
        </div>
        <OrderRecordMock />
      </ShopsContainer>
    </section>
  );
}
