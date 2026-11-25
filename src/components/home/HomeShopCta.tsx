import Link from 'next/link';
import { Store } from 'lucide-react';

/**
 * The landing page's closing invite for shop owners, above the footer.
 * "See how it works" opens the shop pitch (/for-shops); "Register your shop"
 * the application (/register/store). The 14-day trial matches
 * PlanStep's TRIAL_DAYS.
 */
export default function HomeShopCta() {
  return (
    <section aria-labelledby="home-shop-cta-title" className="max-w-7xl mx-auto w-full mobile-screen-margins my-10 sm:my-12">
      <div className="flex flex-col gap-4 rounded-2xl bg-[#4A3428] px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
        <div className="flex items-start gap-3">
          <Store size={20} className="mt-0.5 shrink-0 text-[#E9D9C3]" aria-hidden="true" />
          <div>
            <h2 id="home-shop-cta-title" className="text-sm sm:text-base font-semibold text-white">
              Run a tailoring shop in Davao City?
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-[#D8C6B2]">
              List your shop on Basic, Pro or Premium. Try it free for 14 days.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Link
            href="/for-shops"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 px-5 text-sm font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E9D9C3]"
          >
            See how it works
          </Link>
          <Link
            href="/register/store"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-[#2E1C14] transition-colors hover:bg-[#F3EBE3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E9D9C3]"
          >
            Register your shop
          </Link>
        </div>
      </div>
    </section>
  );
}
