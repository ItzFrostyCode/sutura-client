'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Share2, MoreHorizontal, Home, Flag, HelpCircle } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface CatalogDesktopHeaderProps {
  readonly onBack: () => void;
  readonly onReport: () => void;
}

// Tablet/desktop equivalent of the mobile back/flag overlay
// (CatalogDetailHeader) — deliberately NOT the full site PublicNav. A
// minimal product-page header: Back on the left, Share + a "more options"
// dropdown (Back to Homepage / Report this product / Need help?) on the
// right.
export default function CatalogDesktopHeader({ onBack, onReport }: CatalogDesktopHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const toast = useToast();

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

  return (
    <header className="sticky top-0 z-50 w-full bg-surface border-b border-line">
      <div className="max-w-7xl mx-auto px-4 min-[600px]:px-[10px] md:px-8 h-14 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-9 h-9 flex items-center justify-center text-ink hover:bg-canvas rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center gap-1 relative">
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share this product"
            title="Share"
            className="w-9 h-9 flex items-center justify-center text-ink hover:bg-canvas rounded-full transition-colors"
          >
            <Share2 size={18} />
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="More options"
            title="More options"
            className="w-9 h-9 flex items-center justify-center text-ink hover:bg-canvas rounded-full transition-colors"
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
    </header>
  );
}
