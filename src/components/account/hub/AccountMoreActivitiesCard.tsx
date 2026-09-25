import Link from 'next/link';
import { Store, Star, History, Layers, ChevronRight } from 'lucide-react';

export default function AccountMoreActivitiesCard() {
  return (
    <div className="bg-surface border border-line p-4 mb-3">
      <h2 className="mobile-h3 font-semibold text-ink mb-2">More Activities</h2>
      <div className="-mx-4 -mb-4">
        <Link
          href="/account/history"
          className="mobile-nav-row flex items-center gap-3.5 px-4 py-3 border-t border-line hover:bg-canvas transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-sunken flex items-center justify-center shrink-0">
            <Layers size={18} className="text-taupe" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="mobile-body-md font-normal text-ink">My History</p>
            <p className="mobile-caption font-normal text-ink-muted">Orders, appointments &amp; measurements</p>
          </div>
          <ChevronRight size={18} className="text-ink-faint shrink-0" />
        </Link>

        <Link
          href="/account/settings/become-store-owner"
          className="mobile-nav-row flex items-center gap-3.5 px-4 py-3 border-t border-line hover:bg-canvas transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-sunken flex items-center justify-center shrink-0">
            <Store size={18} className="text-taupe" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="mobile-body-md font-normal text-ink">Start a Store Owner Account</p>
            <p className="mobile-caption font-normal text-ink-muted">Be a Store Owner</p>
          </div>
          <ChevronRight size={18} className="text-ink-faint shrink-0" />
        </Link>

        <Link
          href="/account/ratings"
          className="mobile-nav-row flex items-center gap-3.5 px-4 py-3 border-t border-line hover:bg-canvas transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-sunken flex items-center justify-center shrink-0">
            <Star size={18} className="text-taupe" />
          </div>
          <p className="flex-1 mobile-body-md font-normal text-ink">My Ratings</p>
          <ChevronRight size={18} className="text-ink-faint shrink-0" />
        </Link>

        <Link
          href="/account/recently-viewed"
          className="mobile-nav-row flex items-center gap-3.5 px-4 py-3 border-t border-line hover:bg-canvas transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-sunken flex items-center justify-center shrink-0">
            <History size={18} className="text-taupe" />
          </div>
          <p className="flex-1 mobile-body-md font-normal text-ink">Recently Viewed</p>
          <ChevronRight size={18} className="text-ink-faint shrink-0" />
        </Link>
      </div>
    </div>
  );
}
