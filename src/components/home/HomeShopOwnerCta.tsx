import Link from 'next/link';
import { Store } from 'lucide-react';

/** The last thing on Discover, kept slim: one line and one button that lead shop owners to the overview page. */
export default function HomeShopOwnerCta() {
  return (
    <aside aria-label="For shop owners" className="flex flex-col gap-3 rounded-xl bg-espresso px-4 py-3.5 text-white sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
      <p className="flex items-start gap-3 text-sm sm:items-center">
        <Store size={18} className="mt-0.5 shrink-0 text-amber-300 sm:mt-0" />
        <span><strong className="font-semibold">Run a tailoring shop in Davao City?</strong> <span className="text-white/75">Try SUTURA free for 14 days.</span></span>
      </p>
      <Link href="/for-shops" className="flex min-h-11 shrink-0 items-center justify-center rounded-[10px] bg-amber-300 px-5 text-sm font-semibold text-espresso transition-transform hover:bg-amber-200 active:scale-[0.98]">
        See how it works
      </Link>
    </aside>
  );
}
