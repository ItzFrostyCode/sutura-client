'use client';

import type { LucideIcon } from 'lucide-react';
import AccountHeader from './AccountHeader';

interface ComingSoonProps {
  readonly title: string;
  readonly Icon: LucideIcon;
  readonly message: string;
}

// Shared shell for a settings row that's real (visible, tappable, no "Soon"
// badge cluttering the menu) but genuinely has no backend yet — honest about
// the gap on the destination screen instead of faking a working feature on
// the list screen. Used by /account/settings/{location,orders,notifications,support}.
export default function ComingSoon({ title, Icon, message }: ComingSoonProps) {
  return (
    <div>
      <AccountHeader title={title} backHref="/account/settings" />

      <div className="bg-surface border border-line rounded-2xl p-10 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-sunken flex items-center justify-center mb-4">
          <Icon size={24} className="text-ink-faint" />
        </div>
        <p className="text-sm font-semibold text-ink mb-1">Coming soon</p>
        <p className="text-xs text-ink-muted leading-relaxed max-w-[260px]">{message}</p>
      </div>
    </div>
  );
}
