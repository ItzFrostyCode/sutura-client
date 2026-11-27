'use client';

import { Sparkles } from 'lucide-react';
import Modal from '@/components/Modal';

/**
 * First login of a brand-new shop: a short greeting before anything else.
 * "Start the tour" opens Shop Profile with its guided tour (step 1 of the
 * Welcome Guide); "Later" / closing shows the Welcome Guide instead. Shown
 * once per shop (stores.welcome_seen_at, see tour/welcome.ts).
 */
export default function WelcomeModal({ isOpen, shopName, onStart, onLater }: {
  readonly isOpen: boolean;
  readonly shopName: string | undefined;
  readonly onStart: () => void;
  readonly onLater: () => void;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onLater}
      title="Welcome to SUTURA"
      maxWidth="max-w-md"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onLater}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line-strong px-5 text-sm font-medium text-ink-body hover:bg-sunken"
          >
            Later
          </button>
          <button
            type="button"
            onClick={onStart}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-5 text-sm font-semibold text-white hover:bg-ink/85"
          >
            Start the tour
          </button>
        </div>
      }
    >
      <div className="space-y-4 text-sm text-ink-body">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-taupe/10 text-taupe">
          <Sparkles size={22} aria-hidden="true" />
        </span>
        <p className="text-base font-semibold text-ink">
          {shopName ? `${shopName} is approved.` : 'Your shop is approved.'} Let&apos;s get it ready for customers.
        </p>
        <p className="leading-relaxed">
          Start with your shop profile: your logo, a short description and your opening hours. That&apos;s what customers
          see first. A quick tour shows you where everything is, about 10 minutes in all.
        </p>
        <p className="leading-relaxed text-ink-muted">
          Choose Later to see the full setup checklist. You can reopen it any time from Help (?) → Welcome guide.
        </p>
      </div>
    </Modal>
  );
}
