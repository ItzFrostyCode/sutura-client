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
          <div key={step.title} className="bg-surface border border-line p-4 flex gap-3">
            <div className="w-10 h-10 rounded-full bg-sunken flex items-center justify-center shrink-0">
              <step.Icon size={18} className="text-taupe" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink-faint mb-0.5">Step {i + 1}</p>
              <p className="text-sm font-bold text-ink mb-1">{step.title}</p>
              <p className="text-xs text-ink-muted leading-relaxed">{step.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
