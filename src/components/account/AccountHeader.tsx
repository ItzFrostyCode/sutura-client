'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface AccountHeaderProps {
  readonly title: string;
  readonly backHref: string;
}

// The one back-arrow + title header every /account/* sub-page (except the
// Me hub itself, which has its own profile-row header, and Notification,
// which deliberately keeps its brown/centered treatment) should use — a
// white sticky bar, flush edge-to-edge (negative margins cancel
// AccountLayout's padding), title left-aligned right after the back arrow.
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
    <div className="-mx-[10px] -mt-[10px] sticky top-0 z-40 bg-surface border-b border-line px-4 h-[50px] flex items-center gap-2 mb-[10px]">
      <button type="button" onClick={handleBack} aria-label="Back" className="p-1 -ml-1 text-ink-muted">
        <ArrowLeft size={20} />
      </button>
      <h1 className="text-display text-lg text-ink">{title}</h1>
    </div>
  );
}
