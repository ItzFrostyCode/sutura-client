import Link from 'next/link';
import { Store } from 'lucide-react';

/** The last section of Discover: shop owners are sent to the overview page, not straight to the form. */
export default function HomeShopOwnerCta() {
  return (
    <section aria-labelledby="home-owner-title" className="rounded-xl bg-espresso p-6 text-white sm:p-10">
      <p className="mobile-overline flex items-center gap-1.5 text-amber-300"><Store size={14} /> For shop owners</p>
      <h2 id="home-owner-title" className="mt-3 max-w-xl text-2xl font-semibold leading-tight sm:text-[32px]">Run a tailoring shop in Davao City?</h2>
      <p className="mobile-body-md mt-3 max-w-xl text-white/75">Take bookings, measurements, job orders and payments in one place, and be found by customers near you. Try it free for 14 days.</p>
      <Link href="/for-shops" className="btn-primary-mobile mt-6 rounded-[10px] bg-amber-300 px-6 text-espresso transition-transform hover:bg-amber-200 active:scale-[0.98]">
        See how it works
      </Link>
    </section>
  );
}
