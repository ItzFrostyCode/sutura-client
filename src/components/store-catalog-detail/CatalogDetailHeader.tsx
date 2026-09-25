'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Share2, MoreHorizontal, Home, Flag, HelpCircle } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface CatalogDetailHeaderProps {
  headerOpacity: number;
  onBack: () => void;
  onReport: () => void;
}

// Mobile counterpart to CatalogDesktopHeader — same Back / Share / 3-dot
// "more options" (Back to Homepage / Report this product / Need help?)
// feature set, just floating over the full-bleed hero image with a
// darker, transparent blurred circle instead of a solid bar, crossfading
// to solid white + ink icons once the page scrolls past the image
// (headerOpacity, driven by scroll position, controls that fade).
export default function CatalogDetailHeader({
  headerOpacity,
  onBack,
  onReport,
}: CatalogDetailHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const toast = useToast();
  const headerSolid = headerOpacity > 0.5;
  const iconButtonClass = headerSolid
    ? 'w-10 h-10 rounded-full flex items-center justify-center text-ink transition-colors touch-manipulation'
    : 'w-10 h-10 rounded-full bg-ink/70 backdrop-blur-sm text-white flex items-center justify-center transition-colors touch-manipulation';

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ url, title: document.title });
      } catch {
        // User cancelled the native share sheet — not an error.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard.');
    } catch {
      toast.error('Could not copy the link.');
    }
  };

  // position: fixed, not sticky — this header used to be `sticky top-0`
  // with a `marginBottom: -52` trick to pull the hero image up under it
  // (for the floating-over-the-image look). That collapsed this header's
  // own parent (a plain shrink-wrapped <div> in page.tsx) down to ~0px of
  // extra height, which left sticky nothing to "stick" within — it
  // scrolled away with the rest of the page almost immediately instead of
  // staying pinned. Fixed positions relative to the viewport regardless
  // of any parent's height/flow, so it now reliably stays put while
  // scrolling. Mirrors <main>'s own px tiers exactly (0px at 320-374px,
  // 24px at 375-599px — this component never renders past 600px) instead
  // of a flat px-4, so the back/share/3-dot icons line up with the image
  // and the price/title text below at every mobile width.
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-[52px] flex items-center justify-between px-0 min-[375px]:px-6"
      style={{
        backgroundColor: `rgba(255,255,255,${headerOpacity})`,
        borderBottom: headerOpacity > 0.6 ? '1px solid var(--brand-border)' : 'none',
      }}
    >
      <button type="button" onClick={onBack} aria-label="Back" className={iconButtonClass}>
        <ArrowLeft size={22} />
      </button>

      <div className="flex items-center gap-1.5 relative">
        <button type="button" onClick={handleShare} aria-label="Share this product" className={iconButtonClass}>
          <Share2 size={19} />
        </button>

        <button
          type="button"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="More options"
          className={iconButtonClass}
        >
          <MoreHorizontal size={20} />
        </button>

        {menuOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 cursor-default"
            />
            <div className="absolute right-0 top-full mt-1 w-52 bg-surface border border-line shadow-lg z-50 py-1">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink-body hover:bg-canvas transition-colors"
              >
                <Home size={15} className="text-ink-faint shrink-0" /> Back to Homepage
              </Link>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onReport(); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink-body hover:bg-canvas transition-colors text-left"
              >
                <Flag size={15} className="text-ink-faint shrink-0" /> Report this product
              </button>
              <Link
                href="/account/settings/support"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink-body hover:bg-canvas transition-colors"
              >
                <HelpCircle size={15} className="text-ink-faint shrink-0" /> Need help?
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
