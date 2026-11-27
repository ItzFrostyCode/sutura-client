import Link from 'next/link';
import { Store } from 'lucide-react';

/**
 * Thesis objective "Subscription and Account Management: shops register and pick Basic, Pro or Premium". The last
 * section of Discover, kept slim: one line naming the plans, a button to the shop-owner overview page, and one to
 * the application with the free trial already chosen.
 */
export default function HomeShopOwnerCta() {
  return (
    <aside aria-label="For shop owners" className="flex flex-col gap-4 rounded-2xl bg-espresso p-4 text-white sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
      <div className="flex items-start gap-3">
        <Store size={22} className="mt-0.5 shrink-0 text-nav-inactive" aria-hidden />
        <div>
          <p className="mobile-h4 text-white">Run a tailoring shop in Davao City?</p>
          <p className="mobile-body-sm mt-1 text-white/80">List your shop on Basic, Pro or Premium. Try it free for 14 days.</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
        <Link href="/for-shops" className="flex h-[52px] items-center justify-center rounded-xl border border-white/30 px-6 text-base font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/5">
          See how it works
        </Link>
        <Link href="/register/store?trial=1" className="flex h-[52px] items-center justify-center rounded-xl bg-white px-6 text-base font-semibold text-espresso transition-colors hover:bg-nav-inactive">
          Start free trial
        </Link>
      </div>
    </aside>
  );
}
