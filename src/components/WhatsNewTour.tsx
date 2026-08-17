'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

// Bump this whenever a new batch of features ships and should re-surface the
// tour for shop owners who already dismissed an older version. Stored in
// localStorage so it only auto-shows once per browser per version.
export const WHATS_NEW_VERSION = '2026-07-25-owner-ux-batch';
const STORAGE_KEY = 'sutura_whats_new_dismissed_version';

export function hasSeenLatestWhatsNew(): boolean {
  if (globalThis.window === undefined) return true;
  return localStorage.getItem(STORAGE_KEY) === WHATS_NEW_VERSION;
}

function dismissWhatsNew() {
  if (globalThis.window === undefined) return;
  localStorage.setItem(STORAGE_KEY, WHATS_NEW_VERSION);
}

interface TourStep {
  emoji: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: (shopSlug: string | undefined) => string;
}

const STEPS: TourStep[] = [
  {
    emoji: '📝',
    title: 'Customer Notes',
    description: 'Keep private notes on any customer — fit preferences, payment habits, anything staff should know. Open a customer, click the pencil next to their name, and add a note.',
    ctaLabel: 'Go to Customers',
    href: () => '/dashboard/customers',
  },
  {
    emoji: '⏸',
    title: 'Put a Job On Hold',
    description: "Waiting on a customer to confirm something, or a fabric delivery is late? Set a job's status to \"On Hold\" with a reason — it gets its own column on the board so you don't lose track of it.",
    ctaLabel: 'Go to Jobs',
    href: () => '/dashboard/jobs',
  },
  {
    emoji: '📸',
    title: 'Progress Photos',
    description: "Upload a quick photo of a job mid-production — proof of progress for the customer, and a running log for you. Open any job, scroll to Production Timeline, and add a photo.",
    ctaLabel: 'Go to Jobs',
    href: () => '/dashboard/jobs',
  },
  {
    emoji: '🧵',
    title: 'Garment Category on New Orders',
    description: 'Tag a new job with what it actually is — Barong, Gown, Suit, Filipiniana, or Uniform — right when you create it.',
    ctaLabel: 'Create a Job Order',
    href: () => '/dashboard/jobs/new',
  },
  {
    emoji: '⭐',
    title: 'Featured Shop Placement',
    description: 'Premium shops can pin themselves at the top of customer search results. Find the toggle under Business Type in your shop settings.',
    ctaLabel: 'Go to Shop Settings',
    href: (slug) => (slug ? `/shop/${slug}?tab=about` : '/dashboard/profile'),
  },
  {
    emoji: '🎯',
    title: 'Garment Specializations',
    description: "Tell customers what you actually specialize in — this is how they find you when searching the map. Same Business Type tab as Featured Placement, right below it.",
    ctaLabel: 'Go to Shop Settings',
    href: (slug) => (slug ? `/shop/${slug}?tab=about` : '/dashboard/profile'),
  },
];

export default function WhatsNewTour({ onClose }: { readonly onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const { shop } = useAuthStore();
  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  const handleClose = () => {
    dismissWhatsNew();
    onClose();
  };

  const handleGoThere = () => {
    dismissWhatsNew();
    onClose();
    router.push(step.href(shop?.slug));
  };

  return (
    <div className="fixed inset-0 bg-[#2D2A26]/60 z-[100] flex items-center justify-center p-4">
      <div className="bg-surface border border-line rounded-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        <div className="flex justify-between items-center px-5 pt-5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-taupe">
            <Sparkles size={12} /> What&apos;s New
          </span>
          <button onClick={handleClose} className="text-ink-faint hover:text-ink cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-6 text-center">
          <div className="text-4xl mb-3">{step.emoji}</div>
          <h3 className="text-lg font-bold text-ink mb-2">{step.title}</h3>
          <p className="text-sm text-ink-body leading-relaxed">{step.description}</p>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 pb-4">
          {STEPS.map((s, i) => (
            <span
              key={s.title}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-taupe' : 'w-1.5 bg-line'}`}
            />
          ))}
        </div>

        <div className="border-t border-line px-5 py-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIndex(i => Math.max(0, i - 1))}
            disabled={index === 0}
            className="p-2 rounded-lg text-ink-muted hover:bg-canvas disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Previous"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            onClick={handleGoThere}
            className="flex-1 text-center px-3 py-2 rounded-lg text-xs font-semibold text-taupe hover:bg-canvas transition-colors cursor-pointer"
          >
            {step.ctaLabel} →
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-taupe hover:bg-taupe/90 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Got it
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIndex(i => Math.min(STEPS.length - 1, i + 1))}
              className="flex items-center gap-1 px-4 py-2 bg-taupe hover:bg-taupe/90 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Next <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
