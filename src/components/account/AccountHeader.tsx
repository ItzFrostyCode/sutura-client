'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface AccountHeaderProps {
  readonly title: string;
  readonly backHref: string;
}

// The one back-arrow + title header every /account/* sub-page (except the
// Me hub itself, which has its own profile-row header) should use — a
// white sticky bar, flush edge-to-edge (negative margins cancel
// AccountLayout's padding), title left-aligned right after the back arrow.
// Hidden at md+ — that's where AccountLayout's persistent sidebar takes
// over as the section's real navigation, making this back-arrow redundant.
export default function AccountHeader({ title, backHref }: AccountHeaderProps) {
  const router = useRouter();

  // A "literal" back — return to wherever the user actually came from
  // (e.g. a notification thread, a search result) instead of always
  // force-landing on this page's own canonical parent. `backHref` is only
  // the fallback for when there's genuinely no app history to go back to
  // (page opened directly via URL/refresh/new tab).
  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(backHref);
    }
  };

  return (
    <div className="md:hidden -mx-4 sm:-mx-6 -mt-4 sticky top-[52px] sm:top-[64px] z-40 bg-surface border-b border-line px-1 sm:px-3 h-[52px] sm:h-[56px] flex items-center gap-1 mb-4">
      <button
        type="button"
        onClick={handleBack}
        aria-label="Back"
        className="btn-icon-mobile text-ink hover:text-taupe touch-target-48"
      >
        <ArrowLeft size={24} />
      </button>
      <h1 className="mobile-h4 font-semibold text-ink">{title}</h1>
    </div>
  );
}
