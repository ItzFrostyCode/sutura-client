'use client';

import { Search, CalendarClock, Ruler, Package } from 'lucide-react';
import AccountHeader from '@/components/account/AccountHeader';

const STEPS = [
  {
    Icon: Search,
    title: 'Find a store',
    body: 'Search by garment type — Barong Tagalog, Filipiniana, school uniforms, team jerseys — or browse stores near you on the map.',
  },
  {
    Icon: CalendarClock,
    title: 'Book an appointment',
    body: 'Pick a consultation, measurement, or fitting slot with the store. You can hold one active appointment per store at a time.',
  },
  {
    Icon: Ruler,
    title: 'Save your measurements',
    body: 'Once a store records your measurements, they stay on your account under My Measurements for your next order.',
  },
  {
    Icon: Package,
    title: 'Track your order',
    body: 'Follow your job order in real time from Job Orders — from cutting and sewing to ready-for-pickup — no more guessing "sa na po ba?"',
  },
];

export default function WelcomeGuidePage() {
  return (
    <div>
      <AccountHeader title="Welcome Guide" backHref="/account/settings" />

      <div className="space-y-3">
        {STEPS.map((step, i) => (
          <div key={step.title} className="card-soft flex gap-3 p-4">
            <step.Icon size={22} className="mt-0.5 w-8 shrink-0 text-taupe" />
            <div className="min-w-0">
              <p className="mobile-overline text-ink-faint">Step {i + 1}</p>
              <p className="mobile-h4 mt-0.5 text-ink">{step.title}</p>
              <p className="mobile-body-sm mt-1 text-ink-muted">{step.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
