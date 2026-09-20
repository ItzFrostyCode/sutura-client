'use client';

import { Scissors } from 'lucide-react';
import AccountHeader from '@/components/account/AccountHeader';

export default function AboutPage() {
  return (
    <div>
      <AccountHeader title="About" backHref="/account/settings" />

      <div className="bg-surface border border-line rounded-2xl p-6 flex flex-col items-center text-center mb-4">
        <div className="w-14 h-14 rounded-full bg-sunken flex items-center justify-center mb-3">
          <Scissors size={22} className="text-taupe" />
        </div>
        <p className="text-display text-lg font-bold text-ink">SUTURA</p>
        <p className="text-xs text-ink-muted mt-1">Web-Based Tailoring Shop Tracker System</p>
      </div>

      <div className="bg-surface border border-line rounded-2xl p-5">
        <p className="text-xs text-ink-body leading-relaxed">
          SUTURA connects customers with tailoring shops across Davao City — search by garment specialization,
          book appointments, and track your order&apos;s production in real time, from cutting all the way to pickup.
        </p>
      </div>
    </div>
  );
}
